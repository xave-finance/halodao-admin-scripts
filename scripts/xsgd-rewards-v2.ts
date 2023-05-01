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
const ONE_ETH = parseEther('1')
const XSGD_DECIMALS = 6

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

  /**
   * STEP 1: Get list of all LPs
   */

  const events = await FXPoolContract.queryFilter(
    FXPoolContract.filters.Transfer(), // BPT is minted | transferred | burnt
    32054797 // block when XSGD-USDC pool was deployed on Polygon
  )

  const possibleLPs: string[] = []
  const blacklisted = [
    GAUGE_ADDRESS, // XSGD-USDC Polygon Gauge
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
   * STEP 2: Find out average BPT balance of all LPs on this epoch
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

  // Step 2.2 Get BPT and staked BPT balance of LPs for each block
  const getAllBPTBalancePromises: any[] = []
  const getAllStakedBPTBalancePromises: any[] = []

  possibleLPs.map(lp => {
    const getBPTBalancePromises: any[] = []
    const getStakedBPTBalancePromises: any[] = []

    blocks.map(block => {
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
    })

    getAllBPTBalancePromises.push(Promise.all(getBPTBalancePromises))
    getAllStakedBPTBalancePromises.push(
      Promise.all(getStakedBPTBalancePromises)
    )
  })

  const allBPTBalancePromises = await Promise.all(getAllBPTBalancePromises)
  const allStakedBPTBalancePromises = await Promise.all(
    getAllStakedBPTBalancePromises
  )

  // Step 2.3 Compute for average BPT/Staked BPT balance
  const userBalances: {
    address: string
    totalBPT: BigNumber
    totalStakedBPT: BigNumber
    averageBPT: BigNumber
  }[] = []
  const epochLength = BigNumber.from(blocks.length)
  let epochAverageBPT = BigNumber.from(0)

  possibleLPs.forEach((lp, index) => {
    let totalBPTBalance = BigNumber.from(0)
    allBPTBalancePromises[index].forEach((b: BigNumber, j: number) => {
      totalBPTBalance = totalBPTBalance.add(b)
    })

    let totalStakedBPTBalance = BigNumber.from(0)
    allStakedBPTBalancePromises[index].forEach((b: BigNumber, j: number) => {
      totalStakedBPTBalance = totalStakedBPTBalance.add(b)
    })

    const averageBPT = totalBPTBalance
      .add(totalStakedBPTBalance)
      .div(epochLength)
    epochAverageBPT = epochAverageBPT.add(averageBPT)

    userBalances.push({
      address: lp,
      totalBPT: totalBPTBalance,
      totalStakedBPT: totalStakedBPTBalance,
      averageBPT
    })
  })

  /**
   * STEP 3: Compute total amount of XSGD to be distributed this epoch
   */
  const [[tvl], totalSupply] = await Promise.all([
    FXPoolContract.liquidity({
      blockTag: blocks[blocks.length - 1]
    }),
    FXPoolContract.totalSupply({
      blockTag: blocks[blocks.length - 1]
    })
  ])

  console.log('epochAverageBPT: ', formatEther(epochAverageBPT))
  const bptPrice = tvl.mul(ONE_ETH).div(totalSupply)
  console.log('bptPrice: $', formatEther(bptPrice))
  const epochAverageLiquidity = epochAverageBPT.mul(bptPrice).div(ONE_ETH)
  console.log('epochAverageLiquidity: $', formatEther(epochAverageLiquidity))
  const epochRewardAmount = epochAverageLiquidity.mul(3).div(100).div(12) // 3% APR
  console.log(
    'epochRewardAmount: $',
    formatEther(epochRewardAmount),
    '(3% APR)'
  )
  const sgdRate = await getSGDRate()
  const epochRewardAmountXSGD = epochRewardAmount
    .div(parseEther(`${sgdRate}`))
    .mul(ONE_ETH)
  console.log(
    'epochRewardAmountXSGD: SG$',
    formatEther(epochRewardAmountXSGD),
    `(1 XSGD = ${sgdRate} USD)`
  )

  /**
   * STEP 4: Compute XSGD reward for each LP
   */
  const userRewards: {
    address: string
    balance: BigNumber
    share: number
    rewards: BigNumber
  }[] = []
  userBalances.map(u => {
    if (u.averageBPT.gt(0)) {
      const share = u.averageBPT.mul(ONE_ETH).div(epochAverageBPT)
      const rewards = epochRewardAmountXSGD.mul(share).div(ONE_ETH)
      userRewards.push({
        address: u.address,
        balance: u.averageBPT,
        share: Number(formatEther(share)),
        rewards
      })
    }
  })

  const balanceFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'BPT'
  })
  const rewardFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'SGD'
  })
  const formattedUserRewards = userRewards.map(u => {
    return {
      address: u.address,
      balance: balanceFormatter.format(Number(formatEther(u.balance))),
      share: `${(u.share * 100).toFixed(4)}%`,
      reward: rewardFormatter.format(Number(formatEther(u.rewards)))
    }
  })
  console.table(formattedUserRewards)

  /**
   * STEP 5: Export result to csv
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
}
