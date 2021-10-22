require('dotenv').config()

import { ethers } from 'hardhat'
import { formatEther, formatUnits, parseEther } from 'ethers/lib/utils'
import { firestore } from '../util/firebase'
import { calculateTotalTxnFees } from '../util/calculateTotalTxnFee'
import { ExportToCsv } from 'export-to-csv'
import * as fs from 'fs'

interface AirdropEntry {
  address: string
  totalMigratedxRNBWReward: string
  currentxRNBWReward: string
  totalGasFee: number
}

const verifyAddresses = async () => {
  // 0 - Setup
  const options = {
    fieldSeparator: ',',
    quoteStrings: '"',
    decimalSeparator: '.',
    showLabels: true,
    showTitle: true,
    title: 'HaloAirdrop',
    useTextFile: false,
    useBom: true,
    useKeysAsHeaders: true
  }

  const csvExporter = new ExportToCsv(options)
  const airdropData: AirdropEntry[] = []

  // We get the contract to deploy
  const [deployer] = await ethers.getSigners()
  const ammRewardsv1 = await ethers.getContractAt(
    'AmmRewards',
    process.env.AMM_REWARDS_CONTRACT_ADDRESS
  )

  console.log(`Deployer Address: ${deployer.address}`)
  console.log('Deployer balance:', formatEther(await deployer.getBalance()))

  // 1 - get all data from firestore
  const result = await firestore.collection('pendingRewards').get()
  const migrationData = result.docs

  for (let i = 0; i < migrationData.length; i++) {
    const data = await migrationData[i].data()

    const contractPendingReward = formatEther(
      await ammRewardsv1.pendingRewardToken(data.poolId, data.userAddress)
    )

    // 2 - Verify if pendingRewards in firebase is equal to pendingReward in contract
    if (data.pendingRewards <= contractPendingReward) {
      // 3 - calculate totalTxnFees: gasUsed * effectiveGasPrice (gasPrice used + priority fee)
      const totalGasRefund = await calculateTotalTxnFees(
        data.txHashes,
        deployer
      )
      // 4 - Push to array for csv export
      airdropData.push({
        address: data.userAddress,
        totalMigratedxRNBWReward: data.pendingRewards,
        currentxRNBWReward: contractPendingReward,
        totalGasFee: totalGasRefund
      })
    }
  }

  // 5 - generateCsv
  const csvData = csvExporter.generateCsv(airdropData, true)
  fs.writeFileSync('data.csv', csvData)
}

verifyAddresses()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
