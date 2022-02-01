import { formatEther, formatUnits } from 'ethers/lib/utils'
import { ExportToCsv } from 'export-to-csv'
import {
  BPool,
  END_BLOCK_NUMBER,
  Stats,
  V0_START_BLOCK_NUMBER
} from '../constants'
import { bptABI } from '../constants/abi/bpt'
import * as fs from 'fs'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

// NOTE: thkd empty
export const fetchV0Stats = async (hre: HardhatRuntimeEnvironment) => {
  const [deployer] = await hre.ethers.getSigners()
  const options = {
    fieldSeparator: ',',
    quoteStrings: '"',
    decimalSeparator: '.',
    showLabels: true,
    showTitle: true,
    title: 'v0 Protocol Statistics',
    useTextFile: false,
    useBom: true,
    useKeysAsHeaders: true
  }
  const csvExporter = new ExportToCsv(options)
  let xsgdTotalAmountIn = 0
  let thkdTotalAmountIn = 0
  let xsgdTotalAmountOut = 0
  let thkdTotalAmountOut = 0

  const xsgdProtocolStats: Stats[] = []
  const thkdProtocolStats: Stats[] = []

  const xsgdusdc = new hre.ethers.Contract(BPool['xsgdusdc'], bptABI, deployer)
  const thkdusdc = new hre.ethers.Contract(BPool['thkdusdc'], bptABI, deployer)

  const xsgdusdcEventFilter = await xsgdusdc.filters.LOG_SWAP()
  const thkdusdcEventFilter = await thkdusdc.filters.LOG_SWAP()

  const xsgdusdcSwapFee = formatEther(await xsgdusdc.getSwapFee())
  const thkdusdcSwapFee = formatEther(await thkdusdc.getSwapFee())

  const xsgdusdcEvents = await xsgdusdc.queryFilter(
    xsgdusdcEventFilter,
    V0_START_BLOCK_NUMBER,
    END_BLOCK_NUMBER
  )

  const thkdusdcEvents = await thkdusdc.queryFilter(
    thkdusdcEventFilter,
    V0_START_BLOCK_NUMBER,
    END_BLOCK_NUMBER
  )

  const xsgdusdcEventsArray = xsgdusdcEvents
  const thkdusdcEventsArray = thkdusdcEvents

  xsgdusdcEventsArray.forEach(log => {
    xsgdTotalAmountIn += Number(log.args?.tokenAmountIn)
    xsgdTotalAmountOut += Number(log.args?.tokenAmountOut)

    xsgdProtocolStats.push({
      amountIn: formatUnits(log.args?.tokenAmountIn, 6),
      amountOut: formatUnits(log.args?.tokenAmountOut, 6),
      feesIn: `${
        Number(formatUnits(log.args?.tokenAmountIn, 6)) *
        Number(xsgdusdcSwapFee)
      }`,
      feesOut: `${
        Number(formatUnits(log.args?.tokenAmountIn, 6)) *
        Number(xsgdusdcSwapFee)
      }`,
      caller: log.args?.caller
    })
  })

  thkdusdcEventsArray.forEach(log => {
    thkdTotalAmountIn += Number(log.args?.tokenAmountIn)
    thkdTotalAmountOut += Number(log.args?.tokenAmountOut)

    thkdProtocolStats.push({
      amountIn: formatUnits(log.args?.tokenAmountIn, 6),
      amountOut: formatUnits(log.args?.tokenAmountOut, 6),
      feesIn: `${
        Number(formatUnits(log.args?.tokenAmountIn, 6)) *
        Number(thkdusdcSwapFee)
      }`,
      feesOut: `${
        Number(formatUnits(log.args?.tokenAmountIn, 6)) *
        Number(thkdusdcSwapFee)
      }`,
      caller: log.args?.caller
    })
  })

  console.log(
    `XSGD : { 
    totalTokenAmountIn: ${formatUnits(xsgdTotalAmountIn, 6)}, 
    totalAmountOut: ${formatUnits(xsgdTotalAmountOut, 6)} ,
    totalFeesIn : ${
      Number(formatUnits(xsgdTotalAmountIn, 6)) * Number(xsgdusdcSwapFee)
    },
    totalFeesOut : ${
      Number(formatUnits(xsgdTotalAmountOut, 6)) * Number(xsgdusdcSwapFee)
    }
    }, 
    THKD : {
      totalTokenAmountIn: ${formatUnits(thkdTotalAmountIn, 18)}, 
      totalAmountOut: ${formatUnits(xsgdTotalAmountIn, 18)},
      totalFeesIn : ${
        Number(formatUnits(thkdTotalAmountIn, 18)) * Number(thkdusdcSwapFee)
      },
      totalFeesOut : ${
        Number(formatUnits(thkdTotalAmountOut, 18)) * Number(thkdusdcSwapFee)
      }
    }`
  )

  const xsgdStats = csvExporter.generateCsv(xsgdProtocolStats, true)
  //const thkd = csvExporter.generateCsv(thkdProtocolStats, true)
  fs.writeFileSync('v0ProtocolXSGD.csv', xsgdStats)
  // fs.writeFileSync('v0ProtocolTHKD.csv', thkd)

  console.log(xsgdProtocolStats)
}
