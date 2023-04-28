import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { rewardsOnlyGaugeABI } from './constants/abi/rewards-only-gauge'
import { fxPoolABI } from './constants/abi/fxpool'
import { getSGDRate } from './util/cmc'
import {
  getBlockNumber,
  getNativeBalancesForAddresses
} from './util/blockUtils'
import { ZERO_ADDRESS } from './constants'
import {
  Rewards,
  BptBalances,
  BptBalances2,
  MonthlyLpRewards,
  MonthlyLpRewards2
} from './constants'
import * as fs from 'fs'
import { ExportToCsv } from 'export-to-csv'
import { haloContractAddresses } from './util/halo-contract-address-network'
import { ethers } from 'ethers'

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

function getUnixTimestampsForMonth(dateString: string): number[] {
  const timestamps = []

  // Create a Date object for the first day of the month
  const currentDate = new Date(dateString)
  const currentMonth = currentDate.getMonth() + 1
  console.log('currentMonth', currentMonth)
  console.log('currentDate', currentDate)

  // Iterate through the month and generate a timestamp for each day
  while (currentDate.getMonth() === currentMonth - 1) {
    timestamps.push(Math.floor(currentDate.getTime() / 1000))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return timestamps
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
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

  // ------------------

  // Delay between requests (in milliseconds)
  const requestDelay = 300
  const bptBalances2: BptBalances2[] = []
  const monthlyLpRewards: MonthlyLpRewards[] = []
  const monthlyLpRewards2: MonthlyLpRewards2[] = []

  // Function to get balanceOf
  async function getBalanceOf(
    contract: ethers.Contract,
    address: string,
    blockNumber: number
  ): Promise<ethers.BigNumber> {
    await sleep(requestDelay)
    return await contract.balanceOf(address, { blockTag: blockNumber })
  }

  const processBlock = async (block: number) => {
    await sleep(requestDelay)
    const fxPoolPromises = LpAddresses.map(async address => {
      const fxPoolBalance = await getBalanceOf(fxPoolContract, address, block)
      const gaugeBalance = await getBalanceOf(gaugeContract, address, block)
      let bptBalance = hre.ethers.BigNumber.from(0)

      if (fxPoolBalance.gt(0)) {
        bptBalance = fxPoolBalance
      }

      if (gaugeBalance.gt(0)) {
        bptBalance = bptBalance.add(gaugeBalance)
      }

      if (bptBalance.gt(0)) {
        const xsgdRewardsinUsdWei = bptBalance.mul(3).div(100).div(365)
        bptBalances2.push({
          lpAddress: address,
          bptBalance: bptBalance,
          formattedBptBalance: hre.ethers.utils.formatEther(bptBalance),
          xsgdRewardsInUsdWei: xsgdRewardsinUsdWei,
          blockNumber: block
        })
      }
    })

    await Promise.all(fxPoolPromises)
  }

  // Calculate blocks for the end of each day

  const endOfDayTimestamps = getUnixTimestampsForMonth(epochStartDate)
  console.log('End of day timestamps: ', endOfDayTimestamps)

  let endOfDayBlocks: any[] = []

  for (const unixTimeStamp of endOfDayTimestamps) {
    const blockNumber = await getBlockNumber(
      unixTimeStamp.toString(),
      hre.network.name
    )
    endOfDayBlocks.push(blockNumber)
  }

  console.log('End of day blocks: ', endOfDayBlocks)
  // Process end of day blocks
  for (const block of endOfDayBlocks) {
    await processBlock(block)
  }

  console.log('bptBalances2', bptBalances2)

  console.log('Finished processing balances.')

  let totalAveLiquidity = hre.ethers.BigNumber.from(0)
  let totalAveBptBalance = hre.ethers.BigNumber.from(0)
  let totalXsgdRewards = hre.ethers.BigNumber.from(0)

  LpAddresses.forEach(address => {
    const lpBalances = bptBalances2.filter(
      bptBalances2 => bptBalances2.lpAddress === address
    )
    if (lpBalances.length > 0) {
      let monthlyBptBalance = hre.ethers.BigNumber.from(0)
      let aveMonthlyBptBalance = hre.ethers.BigNumber.from(0)
      let monthlyRewardAmount = hre.ethers.BigNumber.from(0)

      lpBalances.forEach(lpBalance => {
        monthlyBptBalance = monthlyBptBalance.add(lpBalance.bptBalance)
        monthlyRewardAmount = monthlyRewardAmount.add(
          lpBalance.xsgdRewardsInUsdWei
        )
      })
      aveMonthlyBptBalance = monthlyBptBalance.div(daysInMonth)
      monthlyRewardAmount = monthlyRewardAmount
        .mul(sgdRateInWei)
        .div(hre.ethers.utils.parseUnits('1', 18))

      const rewardInString = hre.ethers.utils.formatEther(monthlyRewardAmount)
      const parts = rewardInString.split('.')
      const rewardInStringTrimmed =
        parts[1].length > 6
          ? `${parts[0]}.${parts[1].substring(0, 6)}`
          : `${parts[0]}.${parts[1]}`
      const rewardInSzabo = hre.ethers.utils.parseUnits(
        rewardInStringTrimmed,
        6
      )

      monthlyLpRewards.push({
        lpAddress: address,
        aveBptBalance: aveMonthlyBptBalance,
        formattedAveBptBalance:
          hre.ethers.utils.formatEther(aveMonthlyBptBalance),
        xsgdRewardAmount: rewardInString
      })

      totalAveLiquidity = totalAveLiquidity.add(aveMonthlyBptBalance)
      totalAveBptBalance = totalAveBptBalance.add(monthlyBptBalance)
      totalXsgdRewards = totalXsgdRewards.add(monthlyRewardAmount)
    }
  })

  monthlyLpRewards.forEach(monthlyLpReward => {
    const totalBPTBalance = Number(
      hre.ethers.utils.formatEther(totalAveBptBalance.div(daysInMonth))
    )

    const balance = Number(
      hre.ethers.utils.formatEther(monthlyLpReward.aveBptBalance)
    )
    const percentage = (balance / totalBPTBalance) * 100

    monthlyLpRewards2.push({
      lpAddress: monthlyLpReward.lpAddress,
      aveBptBalance: monthlyLpReward.aveBptBalance.toString(),
      formattedAveBptBalance: monthlyLpReward.formattedAveBptBalance,
      xsgdRewardAmount: monthlyLpReward.xsgdRewardAmount,
      precentShare: `${percentage.toFixed(2)} %`
    })
  })

  console.log('monthlyLpRewards', monthlyLpRewards2)

  console.log(
    'totalAveLiquidity',
    hre.ethers.utils.formatEther(totalAveLiquidity)
  )
  console.log(
    'totalAveBptBalance',
    hre.ethers.utils.formatEther(totalAveBptBalance.div(daysInMonth))
  )
  console.log(
    'totalXsgdRewards',
    hre.ethers.utils.formatEther(totalXsgdRewards)
  )

  // // write csv file
  const csvExporter = new ExportToCsv(options)
  const xsgdStats = csvExporter.generateCsv(monthlyLpRewards2, true)
  fs.writeFileSync(
    `xsgd-rewards-snapshot-from-block-${FROM_BLOCK}.csv`,
    xsgdStats
  )
}
