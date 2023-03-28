require('dotenv').config()

// import { ethers } from 'hardhat'
import { formatEther, formatUnits, parseEther } from 'ethers/lib/utils'
import { ExportToCsv } from 'export-to-csv'
import { xrnbwInternalHolders } from '../constants/index'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import * as fs from 'fs'

interface AirdropList {
    address: string
    balance: string
}
 
export const generateAirdroplist = async (
    hre: HardhatRuntimeEnvironment,
    name: string,
    tokenaddress: string
) => {
    // 0 - Setup
    const options = {
        fieldSeparator: ',',
        quoteStrings: '"',
        decimalSeparator: '.',
        showLabels: true,
        showTitle: true,
        title: `Airdrop List`,
        useTextFile: false,
        useBom: true,
        useKeysAsHeaders: true
    }

    const csvExporter = new ExportToCsv(options)
    const airdropList: AirdropList[] = []
    const addresses: string[] = []
    const snapshotBlockNumber = 15281097

    // 1 - get tokenContract contract instance
    const tokenContract = await hre.ethers.getContractAt(
        name,
        tokenaddress,
    )

    // 2 - query all Transfer events from deployment to snapshot block
    const tokenContractEventFilter = await tokenContract.filters.Transfer()

    const tokenContractEvents = await tokenContract.queryFilter(
        tokenContractEventFilter,
        12570796, // deployment block
        snapshotBlockNumber
    )

    // 3 - store Events[] to an array to prevent loss
    const tokenContractEventsArray = tokenContractEvents

    // 4 - store all unique addresses from transfer events in an array
    for (let key in tokenContractEventsArray) {
        const log = tokenContractEventsArray[key]
        if (addresses.indexOf(log.args?.to) < 0
            && log.args?.to != '0x0000000000000000000000000000000000000000'
            && xrnbwInternalHolders.indexOf(log.args?.to) < 0) {
            addresses.push(log.args?.to)
        }
        if (addresses.indexOf(log.args?.from) < 0
            && log.args?.from != '0x0000000000000000000000000000000000000000'
            && xrnbwInternalHolders.indexOf(log.args?.from) < 0) {
            addresses.push(log.args?.from)
        }
    }

    // 5 - get the xRNBW balance of addresses at snapshot block
    for (let key in addresses) {
        const bal = await tokenContract.balanceOf(addresses[key], { blockTag: snapshotBlockNumber })
        if (bal > 0) {
            airdropList.push({
                address: addresses[key],
                balance: formatEther(bal)
            })
            console.log(addresses[key], formatEther(bal))
        }
    }

    // 5 - output csv
    const xavAirdropCSV = csvExporter.generateCsv(airdropList, true)
    fs.writeFileSync(`xav-airdrop-list.csv`, xavAirdropCSV)
}