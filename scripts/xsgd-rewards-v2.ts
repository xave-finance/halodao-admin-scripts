import { HardhatRuntimeEnvironment } from 'hardhat/types'
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

const POOL_ADDRESS = '0x726E324c29a1e49309672b244bdC4Ff62A270407'
const GAUGE_ADDRESS = '0x3aC845345fc2d51A3006Ed384055cD5ACde86441'
const GAUGE_ADDRESS_V2 = '0xA7165E1E3dEfe55DAdA5C4289268d57faBA6dAd2'
const ONE_ETH = parseEther('1')

export const snapshotXSGDRewards = async (
  hre: HardhatRuntimeEnvironment,
  epochDate: string // YYYY-MM format, e.g. 2023-03 for March 2023
) => {
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
  const GaugeContractV2 = new hre.ethers.Contract(
    GAUGE_ADDRESS_V2,
    rewardsOnlyGaugeABI, // this works even if ABI doesn't fully match since we only need `balanceOf()`
    deployer
  )
  /**
   * STEP 1: Get list of all LPs
   */

  const events = await FXPoolContract.queryFilter(
    FXPoolContract.filters.Transfer(), // BPT is minted | transferred | burnt
    32054797 // block when XSGD-USDC pool was deployed on Polygon
  )

  const possibleLPs: string[] = []
  const blacklisted = [
    GAUGE_ADDRESS, // XSGD-USDC Polygon Gauge (RewardsOnlyGauge)
    GAUGE_ADDRESS_V2, // new XSGD-USDC Polygon Gauge (ChildLiquidityGauge)
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

  while (timestamp < lastTimestamp) {
    const day = new Date(epochStartDate.getTime())
    day.setDate(epochStartDate.getDate() + i)
    timestamp = day.getTime() / 1000
    fetchBlockPromises.push(
      fetch(`https://coins.llama.fi/block/polygon/${timestamp}`)
    )
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

  const rate = await getSGDRate()
  const xsgdRate = parseEther(`${rate}`)
  console.log(`RATE: 1 XSGD = ${formatEther(xsgdRate)} USD`)

  for (const block of blocks) {
    const getBPTBalancePromises: any[] = []
    const getStakedBPTBalancePromises: any[] = []
    const getStakedBPTV2BalancePromises: any[] = []

    possibleLPs.map(lp => {
      getBPTBalancePromises.push(
        FXPoolContract.balanceOf(lp, {
          blockTag: block
        })
      )
      getStakedBPTBalancePromises.push(
        GaugeContract.balanceOf(lp, {
          blockTag: block
        })
      )
      getStakedBPTV2BalancePromises.push(
        GaugeContractV2.balanceOf(lp, {
          blockTag: block
        })
      )
    })

    const [
      blockBPTBalances,
      blockStakedBPTBalances,
      blockStakedBPTV2Balances,
      blockLiquidity
    ] = await Promise.all([
      Promise.all(getBPTBalancePromises),
      Promise.all(getStakedBPTBalancePromises),
      Promise.all(getStakedBPTV2BalancePromises),
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
        .add(blockStakedBPTV2Balances[index])
    })
    console.log('blockTotalBPT:', formatEther(blockTotalBPT))

    userRewards[block] = []

    possibleLPs.forEach((lp, index) => {
      const userBPT = (blockBPTBalances[index] as BigNumber)
        .add(blockStakedBPTBalances[index] as BigNumber)
        .add(blockStakedBPTV2Balances[index] as BigNumber)

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
