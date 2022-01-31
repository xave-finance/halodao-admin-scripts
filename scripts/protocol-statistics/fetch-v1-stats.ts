import { formatEther, formatUnits } from 'ethers/lib/utils'
import { ExportToCsv } from 'export-to-csv'
import { ethers } from 'hardhat'
import { BPool, V0_START_BLOCK_NUMBER } from '../constants'
import * as fs from 'fs'
import { curveABI } from '../constants/abi/curve'

// TODO: Transform to hardhat tasks

interface v1Stats {
  amountIn: string
  amountOut: string
  feesIn: string
  feesOut: string
  caller: string
}

const fetchV1Stats = async () => {
  const [deployer] = await ethers.getSigners()
  const options = {
    fieldSeparator: ',',
    quoteStrings: '"',
    decimalSeparator: '.',
    showLabels: true,
    showTitle: true,
    title: 'v1 Protocol Statistics',
    useTextFile: false,
    useBom: true,
    useKeysAsHeaders: true
  }
  const csvExporter = new ExportToCsv(options)
  let xsgdTotalAmountIn = 0
  let xsgdTotalAmountOut = 0

  const xsgdProtocolStats: v1stats[] = []

  const xsgdusdc = new ethers.Contract(BPool['xsgdusdc'], curveABI, deployer)

  const xsgdusdcEventFilter = await xsgdusdc.filters.LOG_SWAP()

  const xsgdusdcSwapFee = formatEther(await xsgdusdc.getSwapFee())

  const xsgdusdcEvents = await xsgdusdc.queryFilter(
    xsgdusdcEventFilter,
    V0_START_BLOCK_NUMBER,
    14115866
  )

  const xsgdusdcEventsArray = xsgdusdcEvents

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
    }`
  )

  const xsgdStats = csvExporter.generateCsv(xsgdProtocolStats, true)

  fs.writeFileSync('v0ProtocolXSGD.csv', xsgdStats)

  console.log(xsgdProtocolStats)
}

fetchV1Stats()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
