import { formatEther, formatUnits } from 'ethers/lib/utils'
import { ExportToCsv } from 'export-to-csv'
import {
  getMaxBlockRange,
  getStartBlockNumber,
  Stats,
  SWAP_FEE_V1
} from '../constants'
import * as fs from 'fs'
import { curveABI } from '../constants/abi/curve'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { getBlockRangeIteration } from '../util/blockUtils'

export const fetchV1Stats = async (
  hre: HardhatRuntimeEnvironment,
  curveAddress: string,
  name: string,
  decimal: number
) => {
  const [deployer] = await hre.ethers.getSigners()

  const FROM_BLOCK = getStartBlockNumber(hre.network.name)

  // 1 - define csv parameters
  const options = {
    fieldSeparator: ',',
    quoteStrings: '"',
    decimalSeparator: '.',
    showLabels: true,
    showTitle: true,
    title: `v1 Protocol Statistics - ${name}`,
    useTextFile: false,
    useBom: true,
    useKeysAsHeaders: true
  }

  const csvExporter = new ExportToCsv(options)
  const MAX_BLOCKRANGE = getMaxBlockRange(hre.network.name)
  const ITERATION = getBlockRangeIteration(
    Number(await deployer.provider?.getBlockNumber()),
    MAX_BLOCKRANGE
  )

  // 2 - set variables
  const protocolStats: Stats[] = []
  let totalAmountIn = 0
  let totalAmountOut = 0
  let totalAmountInFees = 0
  let totalAmountOutFees = 0

  // 3 - get curve contract instance
  const curveContract = new hre.ethers.Contract(
    curveAddress,
    curveABI,
    deployer
  )
  // 4 - define contract event filter
  const curveContractEventFilter = await curveContract.filters.Trade()

  if (hre.network.name == 'mainnet') {
    // 5 - query all Trade events from deployment to current block
    const curveContractEvents = await curveContract.queryFilter(
      curveContractEventFilter,
      FROM_BLOCK,
      await deployer.provider?.getBlockNumber()
    )

    // 6 - store Events[] to an array to prevent loss
    const curveContractEventsArray = curveContractEvents

    // 7 - calculate and format to typed array
    curveContractEventsArray.forEach(log => {
      const amountIn = formatUnits(log.args?.originAmount, decimal)
      const amountOut = formatUnits(log.args?.targetAmount, 18)
      totalAmountIn += Number(amountIn)
      totalAmountOut += Number(amountOut)
      totalAmountInFees += Number(amountIn) * SWAP_FEE_V1
      totalAmountOutFees += Number(amountOut) * SWAP_FEE_V1

      protocolStats.push({
        amountIn: amountIn,
        amountOut: amountOut,
        feesIn: `${Number(amountIn) * SWAP_FEE_V1}`,
        feesOut: `${Number(amountOut) * SWAP_FEE_V1}`,
        caller: log.args?.trader
      })
    })

    // 8 - push the totaled values to the end of the array - thus the end of the csv file
    protocolStats.push({
      amountIn: `${totalAmountIn}`,
      amountOut: `${totalAmountOut}`,
      feesIn: `${totalAmountInFees}`,
      feesOut: `${totalAmountOutFees}`,
      caller: 'TOTAL'
    })
  } else {
    console.log(`${ITERATION} block ranges found.`)
    for (let i = 1; i < ITERATION; i++) {
      // 5 - query all Trade events from deployment to current block
      const PREV_BLOCK = i - 1
      const CURRENT_ADDTL_BLOCK = MAX_BLOCKRANGE * i - 1
      const CURRENT_PREV_ADDTL_BLOCK = MAX_BLOCKRANGE * PREV_BLOCK
      const CURRENT_FROM_BLOCK =
        MAX_BLOCKRANGE * PREV_BLOCK <= 0
          ? FROM_BLOCK
          : FROM_BLOCK + CURRENT_PREV_ADDTL_BLOCK
      const CURRENT_TO_BLOCK = FROM_BLOCK + CURRENT_ADDTL_BLOCK - 1

      console.log(
        `Checking Block Range # ${i}: ${CURRENT_FROM_BLOCK}, ${CURRENT_TO_BLOCK}`
      )

      const curveContractEvents = await curveContract.queryFilter(
        curveContractEventFilter,
        CURRENT_FROM_BLOCK,
        CURRENT_TO_BLOCK
      )

      // 6 - store Events[] to an array to prevent loss
      const curveContractEventsArray = curveContractEvents

      // 7 - calculate and format to typed array
      curveContractEventsArray.forEach(log => {
        const amountIn = formatUnits(log.args?.originAmount, decimal)
        const amountOut = formatUnits(log.args?.targetAmount, 18)
        const tradeAmount = Number(log.args?.tAmt_)

        totalAmountIn += Number(amountIn)
        totalAmountOut += Number(amountOut)
        totalAmountInFees += Number(amountIn) * SWAP_FEE_V1
        totalAmountOutFees += Number(amountOut) * SWAP_FEE_V1

        protocolStats.push({
          amountIn: amountIn,
          amountOut: amountOut,
          feesIn: `${Number(amountIn) * SWAP_FEE_V1}`,
          feesOut: `${Number(amountOut) * SWAP_FEE_V1}`,
          caller: log.args?.trader
        })
      })
    }

    // 8 - push the totaled values to the end of the array - thus the end of the csv file
    protocolStats.push({
      amountIn: `${totalAmountIn}`,
      amountOut: `${totalAmountOut}`,
      feesIn: `${totalAmountInFees}`,
      feesOut: `${totalAmountOutFees}`,
      caller: 'TOTAL'
    })
  }

  // 9 - output csv
  const protocolStatsCSV = csvExporter.generateCsv(protocolStats, true)
  fs.writeFileSync(`v1Protocol${name}.csv`, protocolStatsCSV)

  // 9 - output total values
  console.log(
    `
    Total Amount In- ${name}: ${totalAmountIn}, 
    Total Amount Out - ${name}: ${totalAmountOut}, 
    Total Amount In Fees - ${name}: ${totalAmountInFees}, 
    Total Amount Out Fees - ${name}: ${totalAmountOutFees}
    `
  )
}
