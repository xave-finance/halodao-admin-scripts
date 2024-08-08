import { HardhatRuntimeEnvironment } from 'hardhat/types'
import pThrottle from 'p-throttle'
import { fxPoolABI } from './constants/abi/fxpool'
import { rewardsOnlyGaugeABI } from './constants/abi/rewards-only-gauge'
import { ZERO_ADDRESS } from './constants'
import { BigNumber } from 'ethers'
import {
  formatEther,
  formatUnits,
  parseEther,
  parseUnits
} from 'ethers/lib/utils'
import { getSGDRate } from './util/cmc'
import { ExportToCsv } from 'export-to-csv'
import * as fs from 'fs'
import { matic } from '@halodao/halodao-contract-addresses'

// at most 2 requests per second to the Alchemy / Infura endpoints
const throttle = pThrottle({
  limit: 2,
  interval: 1000
})

const POOL_ADDRESS = matic.ammV2.pools.all.LP_XSGD_USDC || ZERO_ADDRESS
const GAUGE_ADDRESS =
  matic.ammV2.pools.enabled.find(p => p.address === POOL_ADDRESS)?.gauges
    ?.child || ZERO_ADDRESS
const ONE_ETH = parseEther('1')

export const snapshotXSGDRewards = async (
  hre: HardhatRuntimeEnvironment,
  epochDate: string // YYYY-MM format, e.g. 2023-03 for March 2023
) => {
  // Get the current XSGD rate
  const rate = await getSGDRate()
  const [deployer] = await hre.ethers.getSigners()
  const FXPoolContract = new hre.ethers.Contract(
    POOL_ADDRESS,
    fxPoolABI,
    deployer
  )
  const GaugeContract = new hre.ethers.Contract(
    GAUGE_ADDRESS,
    rewardsOnlyGaugeABI,
    deployer
  )

  /**
   * STEP 1: Get list of all LPs
   */

  const events = await FXPoolContract.queryFilter(
    FXPoolContract.filters.Transfer(), // BPT is minted | transferred | burnt
    50320439 // block when XSGD-USDC pool was deployed on Polygon
  )

  const possibleLPs: string[] = []
  const blacklisted = [
    GAUGE_ADDRESS, // XSGD-USDC Polygon Gauge (ChildLiquidityGauge)
    ZERO_ADDRESS // transfer to 0x0 means BPT is burnt
  ]
  events.map(e => {
    const lp = e.args?.to
    if (!possibleLPs.includes(lp) && !blacklisted.includes(lp)) {
      possibleLPs.push(lp)
    }
  })
  console.log(`Possible LPs: ${possibleLPs.length}`)

  /**
   * STEP 2: Compute for daily rewards of each LP
   */

  // Step 2.1 Find out the block number for each EOD
  const [year, month] = epochDate.split('-').map(d => Number(d))
  const epochStartDate = new Date(Date.UTC(year, month - 1, 1, 23, 59, 59))
  const epochEndDate = new Date(Date.UTC(year, month, 0, 23, 59, 59))
  console.log('epoch start:', epochStartDate)
  console.log('epoch end:', epochEndDate)

  let i = 0
  let timestamp = epochStartDate.getTime() / 1000
  const lastTimestamp = epochEndDate.getTime() / 1000
  const fetchBlockPromises: any[] = []
  const fetchBlockThrottled = throttle((_timestamp: number) => {
    return fetch(`https://coins.llama.fi/block/polygon/${_timestamp}`)
  })

  while (timestamp < lastTimestamp) {
    const day = new Date(epochStartDate.getTime())
    day.setDate(epochStartDate.getDate() + i)
    timestamp = day.getTime() / 1000
    fetchBlockPromises.push(fetchBlockThrottled(timestamp))
    i++
  }

  const jsonPromises = (await Promise.all(fetchBlockPromises)).map((r: any) =>
    r.json()
  )
  const blocks = (await Promise.all(jsonPromises)).map((r: any) => r.height)

  // Step 2.2 Compute for LP rewards for each block
  const userRewards: {
    [block: number]: {
      address: string
      balance: BigNumber
      share: BigNumber
      reward: BigNumber
    }[]
  } = {}

  const formattedDailyRewards: {
    block: number
    blockLiquidity: string
    xsgdCompostion: string
    blockReward: string
    blockTotalBPT: string
    address: string
    balance: string
    share: string
    reward: string
  }[] = []

  const xsgdRate = parseEther(`${rate}`)
  console.log(`RATE: 1 XSGD = ${formatEther(xsgdRate)} USD`)

  for (const block of blocks) {
    const getBPTBalancePromises: any[] = []
    const getStakedBPTBalancePromises: any[] = []

    const fxpoolBalanceThrottled = throttle((_lp, _block) => {
      return FXPoolContract.balanceOf(_lp, {
        blockTag: _block
      })
    })
    const gaugeBalanceThrottled = throttle((_lp, _block) => {
      return GaugeContract.balanceOf(_lp, {
        blockTag: _block
      })
    })

    possibleLPs.map(lp => {
      getBPTBalancePromises.push(fxpoolBalanceThrottled(lp, block))
      getStakedBPTBalancePromises.push(gaugeBalanceThrottled(lp, block))
    })

    const [blockBPTBalances, blockStakedBPTBalances, blockLiquidity] =
      await Promise.all([
        Promise.all(getBPTBalancePromises),
        Promise.all(getStakedBPTBalancePromises),
        FXPoolContract.liquidity({
          blockTag: block
        })
      ])

    const xsgdLiquidityIndex = 0

    console.log('============================================')
    console.log('BLOCK:', block)
    console.log('blockLiquidity:', formatEther(blockLiquidity.total_))
    console.log(
      'blockLiquidity XSGD Composition:',
      formatEther(blockLiquidity.individual_[xsgdLiquidityIndex])
    )

    const blockReward = (
      blockLiquidity.individual_[xsgdLiquidityIndex] as BigNumber
    )
      .mul(3)
      .div(100)
      .div(365)
    console.log('blockReward:', formatEther(blockReward))

    let blockTotalBPT = BigNumber.from(0)
    possibleLPs.forEach((lp, index) => {
      blockTotalBPT = blockTotalBPT
        .add(blockBPTBalances[index])
        .add(blockStakedBPTBalances[index])
    })
    console.log('blockTotalBPT:', formatEther(blockTotalBPT))

    userRewards[block] = []

    possibleLPs.forEach((lp, index) => {
      const userBPT = (blockBPTBalances[index] as BigNumber).add(
        blockStakedBPTBalances[index] as BigNumber
      )

      if (userBPT.gt(0)) {
        const share = userBPT.mul(ONE_ETH).div(blockTotalBPT)
        const reward = blockReward.mul(share).div(xsgdRate)

        console.log(
          `${lp} - ` +
            `${Number(formatEther(userBPT)).toFixed(2)} BPT - ` +
            `${(Number(formatEther(share)) * 100).toFixed(4)} % - ` +
            `${Number(formatEther(reward)).toFixed(2)} SGD`
        )

        userRewards[block].push({
          address: lp,
          balance: userBPT,
          share: share,
          reward: reward
        })

        formattedDailyRewards.push({
          block: block,
          blockLiquidity: formatEther(blockLiquidity.total_),
          xsgdCompostion: formatEther(
            blockLiquidity.individual_[xsgdLiquidityIndex]
          ),
          blockReward: formatEther(blockReward),
          blockTotalBPT: formatEther(blockTotalBPT),
          address: lp,
          balance: `${Number(formatEther(userBPT)).toFixed(2)} BPT`,
          share: `${(Number(formatEther(share)) * 100).toFixed(4)} %`,
          reward: `${Number(formatEther(reward)).toFixed(2)} SGD`
        })
      }
    })
    console.log('============================================')
  }

  /**
   * STEP 3: Summarize daily rewards
   */
  const summarizedRewards: {
    [address: string]: BigNumber
  } = {}

  Object.values(userRewards).map(blockRewards => {
    const addresses = Object.keys(summarizedRewards)
    blockRewards.map(rewardDetail => {
      if (addresses.includes(rewardDetail.address)) {
        summarizedRewards[rewardDetail.address] = summarizedRewards[
          rewardDetail.address
        ].add(rewardDetail.reward)
      } else {
        summarizedRewards[rewardDetail.address] = rewardDetail.reward
      }
    })
  })

  let totalEpochRewards = BigNumber.from(0)
  const formattedUserRewards = Object.values(summarizedRewards).map(reward => {
    totalEpochRewards = totalEpochRewards.add(reward)
    const i = Object.values(summarizedRewards).indexOf(reward)
    return {
      address: Object.keys(summarizedRewards)[i],
      reward: `${Number(formatEther(reward)).toFixed(2)} XSGD`
    }
  })

  console.table(formattedUserRewards)
  console.log(
    'TOTAL EPOCH REWARDS:',
    Number(formatEther(totalEpochRewards)).toFixed(2),
    'XSGD'
  )

  /**
   * STEP 4: Export result to csv
   */

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
  const csvExporter = new ExportToCsv(options)
  const xsgdStats = csvExporter.generateCsv(formattedUserRewards, true)
  fs.writeFileSync(
    `xsgd-rewards-snapshot-from-block-${blocks[0]}.csv`,
    xsgdStats
  )

  const xsgdDailyStats = csvExporter.generateCsv(formattedDailyRewards, true)
  fs.writeFileSync(
    `xsgd-daily-rewards-snapshot-from-block-${blocks[0]}.csv`,
    xsgdDailyStats
  )

  console.log('============================================')
  console.log(
    `All LP addresses (${possibleLPs.length}):`,
    possibleLPs.join(',')
  )
  console.log(
    `Eligible LP addresses (${Object.keys(summarizedRewards).length}):`,
    Object.keys(summarizedRewards).join(',')
  )
  console.log(
    `LP rewards: `,
    Object.values(summarizedRewards)
      .map(r => {
        const rewardInString = formatEther(r)
        const parts = rewardInString.split('.')
        const rewardInStringTrimmed =
          parts[1].length > 6
            ? `${parts[0]}.${parts[1].substring(0, 5)}`
            : `${parts[0]}.${parts[1]}`
        return parseUnits(rewardInStringTrimmed, 6).toString()
      })
      .join(',')
  )
}
