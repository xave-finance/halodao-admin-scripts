import { formatUnits } from 'ethers/lib/utils'
import { ExportToCsv } from 'export-to-csv'
import {
  END_BLOCK_NUMBER,
  Stats,
  SWAP_FEE_V1,
  V0_START_BLOCK_NUMBER
} from '../constants'
import * as fs from 'fs'
import { curveABI } from '../constants/abi/curve'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export const fetchV1Stats = async (
  hre: HardhatRuntimeEnvironment,
  curveAddress: string,
  name: string,
  decimal: number
) => {
  const [deployer] = await hre.ethers.getSigners()

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

  const protocolStats: Stats[] = []
  let totalAmountIn = 0
  let totalAmountOut = 0
  let totalAmountInFees = 0
  let totalAmountOutFees = 0

  const curveContract = new hre.ethers.Contract(
    curveAddress,
    curveABI,
    deployer
  )

  const curveContractEventFilter = await curveContract.filters.Trade()

  const curveContractEvents = await curveContract.queryFilter(
    curveContractEventFilter,
    V0_START_BLOCK_NUMBER,
    END_BLOCK_NUMBER
  )

  const curveContractEventsArray = curveContractEvents

  curveContractEventsArray.forEach(log => {
    const amountIn = formatUnits(log.args?.originAmount, decimal)
    const amountOut = formatUnits(log.args?.targetAmount, 6)
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

  const protocolStatsCSV = csvExporter.generateCsv(protocolStats, true)
  fs.writeFileSync(`v1Protocol${name}.csv`, protocolStatsCSV)

  console.log(
    `
    Total Amount In- ${name}: ${totalAmountIn}, 
    Total Amount Out - ${name}: ${totalAmountOut}, 
    Total Amount In Fees - ${name}: ${totalAmountInFees}, 
    Total Amount Out Fees - ${name}: ${totalAmountOutFees}
    `
  )
}
