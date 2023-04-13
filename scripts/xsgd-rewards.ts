import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { rewardsOnlyGaugeABI } from './constants/abi/rewards-only-gauge'
import { fxPoolABI } from './constants/abi/fxpool'
import { getSGDRate } from './util/cmc'
import { getBlockNumber } from './util/blockUtils'
import { ZERO_ADDRESS } from './constants'
import { Rewards, BptBalances } from './constants'
import * as fs from 'fs'
import { ExportToCsv } from 'export-to-csv'
import { haloContractAddresses } from './util/halo-contract-address-network'

const getDaysInMonth = (dateString: string): number => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const lastDay = new Date(year, month, 0).getDate()
  return lastDay
}

const getEndDateOfMonth = (dateString: string): string => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const lastDay = new Date(year, month, 0).getDate()
  const endDate =
    year.toString() + '-' + month.toString() + '-' + lastDay.toString()
  return endDate
}

export const snapshotXSGDRewards = async (
  hre: HardhatRuntimeEnvironment,
  epochStartDate: string
) => {
  // define csv parameters
  const options = {
    fieldSeparator: ',',
    quoteStrings: '"',
    decimalSeparator: '.',
    showLabels: true,
    showTitle: true,
    title: 'xsgd-rewards-snapshot-from-block',
    useTextFile: false,
    useBom: true,
    useKeysAsHeaders: true
  }
  const [deployer] = await hre.ethers.getSigners()
  const sgdRate = await getSGDRate()
  const sgdRateInWei = hre.ethers.utils.parseUnits(sgdRate.toString(), 18)
  console.log('USD to SGD rate', sgdRate)

  const FROM_BLOCK = await getBlockNumber(epochStartDate, hre.network.name)
  const TO_BLOCK = await getBlockNumber(
    getEndDateOfMonth(epochStartDate),
    hre.network.name
  )

  console.log('FROM_BLOCK', FROM_BLOCK)
  console.log('TO_BLOCK', TO_BLOCK)

  const daysInMonth = getDaysInMonth(epochStartDate)
  console.log(`Days in month: ${daysInMonth}`)

  const fxPoolAddress = haloContractAddresses(hre.network.name).ammV2.pools.all
    .LP_XSGD_USDC as string //'0x726E324c29a1e49309672b244bdC4Ff62A270407';
  const gaugeAddress = haloContractAddresses(hre.network.name).ammV2.pools
    .enabled[0].gauges?.l2?.rewardsOnly as string //'0x3aC845345fc2d51A3006Ed384055cD5ACde86441';
  console.log(`fxPoolAddress: ${fxPoolAddress}`)
  console.log(`gaugeAddress: ${gaugeAddress}`)
  const fxPoolContract = new hre.ethers.Contract(
    fxPoolAddress,
    fxPoolABI,
    deployer
  )
  const gaugeContract = new hre.ethers.Contract(
    gaugeAddress,
    rewardsOnlyGaugeABI,
    deployer
  )
  const lpUniqueAddresses: string[] = []
  const lpUniquePendingRewards: any[] = []
  const LpAddresses: string[] = []

  // 0. Get the current liquidity of fxPoolContract
  const liquidity = await fxPoolContract.liquidity()
  const liquidityInSgdWei = liquidity[0]
    .mul(sgdRateInWei)
    .div(hre.ethers.utils.parseUnits('1', 18))
  console.log(`FXPool current liquidity USD Wei: ${liquidity[0]}`)
  console.log(
    `FXPool current liquidity SGD Wei: ${liquidityInSgdWei.toString()}`
  )

  let bptHoldersTotal = hre.ethers.BigNumber.from(0)
  // 1. Get addresses of LPs in FXPool
  const fxPoolTransferEvent = await fxPoolContract.queryFilter(
    fxPoolContract.filters.Transfer(),
    FROM_BLOCK,
    TO_BLOCK
  )

  // loop through the events and get the unique addresses
  for (let i = 0; i < fxPoolTransferEvent.length; i++) {
    const event = fxPoolTransferEvent[i]
    const args = event.args

    if (args) {
      const { from, to } = args
      // Check if the addresses are already in the array
      if (
        !LpAddresses.includes(from) &&
        from !== ZERO_ADDRESS &&
        from.toLowerCase() !== gaugeAddress.toLowerCase()
      ) {
        LpAddresses.push(from)
      }
      if (
        !LpAddresses.includes(to) &&
        to !== ZERO_ADDRESS &&
        to.toLowerCase() !== gaugeAddress.toLowerCase()
      ) {
        LpAddresses.push(to)
      }
    }
  }

  // 2. Get addresses of BPT stakers in gauge
  const gaugeTransferEvent = await gaugeContract.queryFilter(
    gaugeContract.filters.Transfer(),
    FROM_BLOCK,
    TO_BLOCK
  )
  // loop through the events and get the balance of the sender
  for (let i = 0; i < gaugeTransferEvent.length; i++) {
    const event = gaugeTransferEvent[i]
    const args = event.args

    if (args) {
      const { _from, _to } = args
      // Check if the addresses are already in the array
      if (!LpAddresses.includes(_from) && _from !== ZERO_ADDRESS) {
        LpAddresses.push(_from)
      }
      if (!LpAddresses.includes(_to) && _to !== ZERO_ADDRESS) {
        LpAddresses.push(_to)
      }
    }
  }

  // 3. Calculate total balances of LPs and stakers
  const bptBalances: BptBalances[] = []
  const fxPoolBalancePromises: Promise<any>[] = []
  const gaugeBalancePromises: Promise<any>[] = []

  // loop through addresses and get the balance
  for (let i = 0; i < LpAddresses.length; i++) {
    const address = LpAddresses[i]
    fxPoolBalancePromises.push(
      fxPoolContract.balanceOf(address, { blockTag: TO_BLOCK })
    )
    gaugeBalancePromises.push(
      gaugeContract.balanceOf(address, { blockTag: TO_BLOCK })
    )
  }

  const fxPoolBalances = await Promise.all(fxPoolBalancePromises)
  const gaugeBalances = await Promise.all(gaugeBalancePromises)

  for (let i = 0; i < fxPoolBalances.length; i++) {
    const address = LpAddresses[i]
    const fxPoolBalance = fxPoolBalances[i]
    const gaugeBalance = gaugeBalances[i]

    if (fxPoolBalance > 0) {
      bptHoldersTotal = bptHoldersTotal.add(fxPoolBalance)
      console.log(
        `LP address: ${address} - BPT balance: ${fxPoolBalance.toString()}`
      )
    }
    if (gaugeBalance > 0) {
      bptHoldersTotal = bptHoldersTotal.add(gaugeBalance)
      console.log(
        `LP address: ${address} - GaugeToken balance: ${gaugeBalance.toString()}`
      )
    }
    if (fxPoolBalance > 0 || gaugeBalance > 0) {
      bptBalances.push({
        lpAddress: address,
        bptBalance: fxPoolBalance.add(gaugeBalance)
      })
    }
  }

  console.log(`Total Balance of BPT holders: ${bptHoldersTotal.toString()}`)
  // get the 3% APR of the relative liquidity
  const threePercent = bptHoldersTotal.mul(3).div(100)
  const threePercentInSgdWei = threePercent
    .mul(sgdRateInWei)
    .div(hre.ethers.utils.parseUnits('1', 18)) // convert back from wei
  console.log(`3% APR in USD: ${hre.ethers.utils.formatEther(threePercent)}`)
  console.log(`3% APR in SGD Wei:  ${threePercentInSgdWei.toString()}`)

  const dailyAPR = threePercent.div(365)
  const dailyAPRInSgdWei = threePercentInSgdWei.div(365)
  console.log(`Daily APR in SGD Wei: ${dailyAPR.toString()}`)
  const monthlyAPR = dailyAPR.mul(daysInMonth)
  const monthlyAPRInSgdWei = dailyAPRInSgdWei.mul(daysInMonth)
  console.log(`Monthly APR in SGD Wei: ${monthlyAPRInSgdWei.toString()}`)

  // 4. Calculate rewards for each rewardee
  const rewards: Rewards[] = []
  for (let i = 0; i < bptBalances.length; i++) {
    const rewardAmountUsd = monthlyAPR
      .mul(bptBalances[i].bptBalance)
      .div(bptHoldersTotal)
    const rewardAmountSgd = rewardAmountUsd
      .mul(sgdRateInWei)
      .div(hre.ethers.utils.parseUnits('1', 18))

    rewards.push({
      lpAddress: bptBalances[i].lpAddress,
      bptBalance: bptBalances[i].bptBalance,
      rewardAmountSgd: rewardAmountSgd,
      rewardAmountUsd: rewardAmountUsd
    })

    console.log(
      `Reward amount in USD to send to ${
        bptBalances[i].lpAddress
      } - ${rewardAmountUsd} -  ${hre.ethers.utils.formatEther(
        rewardAmountUsd
      )}`
    )
    console.log(
      `Reward amount in SGD to send to ${
        bptBalances[i].lpAddress
      } - ${rewardAmountSgd} -  ${hre.ethers.utils.formatEther(
        rewardAmountSgd
      )}`
    )
  }

  // loop through rewards and find duplicate lpAddress and add the rewardAmountSgd and rewardAmountUsd
  const exportRewards: {
    address: string
    balance: string
    share: string
    reward: string
  }[] = []

  const totalBPTBalance = Number(hre.ethers.utils.formatEther(bptHoldersTotal))
  let totalRewards = hre.ethers.BigNumber.from(0)

  for (let i = 0; i < rewards.length; i++) {
    const reward = rewards[i]

    const balance = Number(hre.ethers.utils.formatEther(reward.bptBalance))
    const percentage = (balance / totalBPTBalance) * 100

    exportRewards.push({
      address: reward.lpAddress,
      balance: `${balance.toFixed(2)} BPT`,
      share: `${percentage.toFixed(4)} %`,
      reward: `${Number(
        hre.ethers.utils.formatEther(reward.rewardAmountSgd)
      ).toFixed(2)} XSGD`
    })

    const rewardInString = hre.ethers.utils.formatEther(reward.rewardAmountSgd)
    const parts = rewardInString.split('.')
    const rewardInStringTrimmed =
      parts[1].length > 6
        ? `${parts[0]}.${parts[1].substring(0, 6)}`
        : `${parts[0]}.${parts[1]}`
    const rewardInSzabo = hre.ethers.utils.parseUnits(rewardInStringTrimmed, 6)

    lpUniqueAddresses.push(reward.lpAddress)
    lpUniquePendingRewards.push(rewardInSzabo)
    totalRewards = totalRewards.add(reward.rewardAmountSgd)
  }
  console.log('exportRewards', exportRewards)
  console.log('lpUniqueAddresses', lpUniqueAddresses)
  console.log(
    'lpUniquePendingRewards',
    lpUniquePendingRewards.map(r => r.toString())
  )
  console.log('totalRewards in SGD Wei', totalRewards.toString())

  // write csv file
  const csvExporter = new ExportToCsv(options)
  const xsgdStats = csvExporter.generateCsv(exportRewards, true)
  fs.writeFileSync(
    `xsgd-rewards-snapshot-from-block-${FROM_BLOCK}.csv`,
    xsgdStats
  )
}
