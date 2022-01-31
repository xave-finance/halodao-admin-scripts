import { formatEther, formatUnits, parseUnits } from 'ethers/lib/utils'
import { ExportToCsv } from 'export-to-csv'
import { ethers } from 'hardhat'
import { BPool, V0_START_BLOCK_NUMBER } from '../constants'
import { bptABI } from '../constants/abi/bpt'
import * as fs from 'fs'

// TODO: Transform to hardhat tasks

interface v0Stats {
  amountIn: string
  amountOut: string
  feesIn: string
  feesOut: string
  caller: string
}

const fetchV0Stats = async () => {
  const [deployer] = await ethers.getSigners()
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

  const xsgdProtocolStats: v0Stats[] = []
  const thkdProtocolStats: v0Stats[] = []

  const xsgdusdc = new ethers.Contract(BPool['xsgdusdc'], bptABI, deployer)
  const thkdusdc = new ethers.Contract(BPool['thkdusdc'], bptABI, deployer)

  const xsgdusdcEventFilter = await xsgdusdc.filters.LOG_SWAP()
  const thkdusdcEventFilter = await thkdusdc.filters.LOG_SWAP()

  const xsgdusdcSwapFee = formatEther(await xsgdusdc.getSwapFee())
  const thkdusdcSwapFee = formatEther(await thkdusdc.getSwapFee())

  const xsgdusdcEvents = await xsgdusdc.queryFilter(
    xsgdusdcEventFilter,
    V0_START_BLOCK_NUMBER,
    14115866
  )

  const thkdusdcEvents = await thkdusdc.queryFilter(
    thkdusdcEventFilter,
    V0_START_BLOCK_NUMBER,
    14115866
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

fetchV0Stats()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
