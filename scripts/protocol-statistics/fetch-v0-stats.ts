import { formatEther, formatUnits } from 'ethers/lib/utils'
import { ExportToCsv } from 'export-to-csv'
import { BPool, getStartBlockNumber, Stats } from '../constants'
import { bptABI } from '../constants/abi/bpt'
import * as fs from 'fs'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export const fetchV0Stats = async (hre: HardhatRuntimeEnvironment) => {
  const [deployer] = await hre.ethers.getSigners()
  // 1 - define csv parameters
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
  const FROM_BLOCK = getStartBlockNumber(hre.network.name)

  // 2 - set variables
  let xsgdTotalAmountIn = 0
  let thkdTotalAmountIn = 0
  let xsgdTotalAmountOut = 0
  let thkdTotalAmountOut = 0

  const xsgdProtocolStats: Stats[] = []
  const thkdProtocolStats: Stats[] = []

  // 3 - make bpt contract instance
  const xsgdusdc = new hre.ethers.Contract(BPool['xsgdusdc'], bptABI, deployer)
  const thkdusdc = new hre.ethers.Contract(BPool['thkdusdc'], bptABI, deployer)

  // 4 - define LOG_SWAP() filter for querying events
  const xsgdusdcEventFilter = await xsgdusdc.filters.LOG_SWAP()
  const thkdusdcEventFilter = await thkdusdc.filters.LOG_SWAP()

  // 5 - get swap fee
  const xsgdusdcSwapFee = formatEther(await xsgdusdc.getSwapFee())
  const thkdusdcSwapFee = formatEther(await thkdusdc.getSwapFee())

  // 6 - query all LOG_SWAP events from deployment to current block
  const xsgdusdcEvents = await xsgdusdc.queryFilter(
    xsgdusdcEventFilter,
    FROM_BLOCK,
    await deployer.provider?.getBlockNumber()
  )

  const thkdusdcEvents = await thkdusdc.queryFilter(
    thkdusdcEventFilter,
    FROM_BLOCK,
    await deployer.provider?.getBlockNumber()
  )

  // 7 - store Events[] to an array to prevent loss
  const xsgdusdcEventsArray = xsgdusdcEvents
  const thkdusdcEventsArray = thkdusdcEvents

  // 8 - calculate and format to typed array
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

  // 9 - output total values
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

  // 10 - write csv file
  const xsgdStats = csvExporter.generateCsv(xsgdProtocolStats, true)
  fs.writeFileSync('v0ProtocolXSGD.csv', xsgdStats)
  // Note: THKD yielded no result
  // const thkd = csvExporter.generateCsv(thkdProtocolStats, true)
  // fs.writeFileSync('v0ProtocolTHKD.csv', thkd)
}
