import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { rewardsOnlyGaugeABI } from './constants/abi/rewards-only-gauge';
import { fxPoolABI } from './constants/abi/fxpool';
import { getSGDRate } from './util/cmc';
import { getBlockNumber } from './util/blockUtils';
import { ZERO_ADDRESS } from './constants';
import { Rewards } from './constants';
import * as fs from 'fs';
import { ExportToCsv } from 'export-to-csv';
import { matic } from '@halodao/halodao-contract-addresses'

const getDaysInMonth = (dateString: string): number => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const lastDay = new Date(year, month, 0).getDate();
    return lastDay;
};

const getEndDateOfMonth = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = year.toString() + '-' + month.toString() + '-' + lastDay.toString();
    return endDate;
};

export const snapshotXSGDRewards = async (
    hre: HardhatRuntimeEnvironment,
    epochStartDate: string
) => {
    // define csv parameters
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
    };
    const [deployer] = await hre.ethers.getSigners();
    const rewards: Rewards[] = []
    const sgdRate = await getSGDRate();
    const sgdRateInWei = hre.ethers.utils.parseUnits(sgdRate.toString(), 18);
    console.log('USD to SGD rate', sgdRate);

    const FROM_BLOCK = await getBlockNumber(epochStartDate, hre.network.name);
    const TO_BLOCK =  await getBlockNumber(getEndDateOfMonth(epochStartDate), hre.network.name);

    console.log('FROM_BLOCK', FROM_BLOCK);
    console.log('TO_BLOCK', TO_BLOCK);

    const fxPoolAddress = matic.ammV2.pools.all.LP_XSGD_USDC as string;  //'0x726E324c29a1e49309672b244bdC4Ff62A270407';
    const gaugeAddress = '0x3aC845345fc2d51A3006Ed384055cD5ACde86441';
    const fxPoolContract = new hre.ethers.Contract(fxPoolAddress, fxPoolABI, deployer)
    const gaugeContract = new hre.ethers.Contract(gaugeAddress, rewardsOnlyGaugeABI, deployer)
    const fxPoolLpAddresses: string[] = [];
    const gaugeLpAddresses: string[] = [];
    const lpUniqueAddresses: string[] = [];
    const lpUniquePendingRewards: any[] = [];
    let guageLp = ZERO_ADDRESS;

    // get the liquidity of fxPoolContract
    const liquidity = await fxPoolContract.liquidity();
    const liquidityInSgdWei = liquidity[0].mul(sgdRateInWei).div(hre.ethers.utils.parseUnits('1', 18));
    console.log(`FXPool liquidity USD Wei: ${liquidity[0]}`)
    console.log(`FXPool liquidity SGD Wei: ${liquidityInSgdWei.toString()}`);

    const threePercent = liquidity[0].mul(3).div(100);
    const threePercentInSgdWei = threePercent.mul(sgdRateInWei).div(hre.ethers.utils.parseUnits('1', 18)); // convert back from wei
    console.log(`3% APR in USD: ${hre.ethers.utils.formatEther(threePercent)}`);
    console.log(`3% APR in SGD Wei:  ${threePercentInSgdWei.toString()}`);
    // Formula: Average liquidity for day * daily rate (where daily rate = 3.0% / 365)
    const dailyAPR = threePercentInSgdWei.div(365);
    console.log(`Daily APR in SGD Wei: ${dailyAPR.toString()}`);
    const daysInMonth = getDaysInMonth(epochStartDate);
    console.log(`Days in month: ${daysInMonth}`);
    const monthlyAPR = dailyAPR.mul(daysInMonth);
    console.log(`Monthly APR in SGD Wei: ${monthlyAPR.toString()}`);

    const fxPoolTransferEvent = await fxPoolContract.queryFilter(fxPoolContract.filters.Transfer(), FROM_BLOCK, TO_BLOCK);

    // loop through the events and get the unique addresses
    for (let i = 0; i < fxPoolTransferEvent.length; i++) {
        const event = fxPoolTransferEvent[i];
        const args = event.args;

        if (args) {
            const { from, to } = args;
            // Check if the addresses are already in the array
            if (!fxPoolLpAddresses.includes(from) && from !== ZERO_ADDRESS && from !== gaugeAddress) {
                fxPoolLpAddresses.push(from);
            }
            if (!fxPoolLpAddresses.includes(to) && to !== ZERO_ADDRESS && to !== gaugeAddress) {
                fxPoolLpAddresses.push(to);
            }
            if (from === gaugeAddress) {
                guageLp = from;
            }
            if (to === gaugeAddress) {
                guageLp = to;
            }
        }
    }

    let gaugeRewardAmount = hre.ethers.BigNumber.from(0);
    let bptHoldersTotal = hre.ethers.BigNumber.from(0);
    let guageBptbalance = hre.ethers.BigNumber.from(0);

    if (guageLp !== ZERO_ADDRESS) {
        guageBptbalance = await fxPoolContract.balanceOf(guageLp);
        gaugeRewardAmount = monthlyAPR.mul(guageBptbalance).div(liquidity[0]);;
    }
    console.log('Gauge BPT balance', gaugeRewardAmount.toString());
    console.log('Gauge reward amount in USD', gaugeRewardAmount.toString());

    // loop through unique addresses and get the balance
    for (let i = 0; i < fxPoolLpAddresses.length; i++) {
        const address = fxPoolLpAddresses[i];
        const balance = await fxPoolContract.balanceOf(address);
        if (balance.gt(0)) {
            bptHoldersTotal = bptHoldersTotal.add(balance);
            // console.log(address, balance.toString());
            // distribute the monthlyAPR to the bpt holders based on their balances
            const rewardAmountUsd = monthlyAPR.mul(balance).div(liquidity[0]);
            const rewardAmountSgd = rewardAmountUsd.mul(sgdRateInWei).div(hre.ethers.utils.parseUnits('1', 18));
            rewards.push({
                lpAddress: address,
                bptBalance: balance.toString(),
                rewardAmountSgd: rewardAmountSgd.toString(),
                rewardAmountUsd: rewardAmountUsd.toString()
            })
            console.log(`Reward amount in USD to send to ${address} - ${rewardAmountUsd} -  ${hre.ethers.utils.formatEther(rewardAmountUsd)}`);
            console.log(`Reward amount in SGD to send to ${address} - ${rewardAmountSgd} -  ${hre.ethers.utils.formatEther(rewardAmountSgd)}`);
        }
    }

    const gaugeTransferEvent = await gaugeContract.queryFilter(gaugeContract.filters.Transfer(), FROM_BLOCK, TO_BLOCK);
    // loop through the events and get the balance of the sender
    for (let i = 0; i < gaugeTransferEvent.length; i++) {
        const event = gaugeTransferEvent[i];
        const args = event.args;

        if (args) {
            const { _from, _to } = args;
            // Check if the addresses are already in the array
            if (!gaugeLpAddresses.includes(_from) && _from !== ZERO_ADDRESS) {
                gaugeLpAddresses.push(_from);
            }
            if (!gaugeLpAddresses.includes(_to) && _to !== ZERO_ADDRESS) {
                gaugeLpAddresses.push(_to);
            }
        }
    }

    // loop through unique addresses and get the balance
    for (let i = 0; i < gaugeLpAddresses.length; i++) {
        const address = gaugeLpAddresses[i];
        const balance = await gaugeContract.balanceOf(address);
        if (balance > 0) {
            // console.log(address, balance.toString());
            // distribute the gaugeRewardAmount to the gauge bpt holders based on their balances
            const rewardAmountUsd = gaugeRewardAmount.mul(balance).div(guageBptbalance);
            const rewardAmountSgd = rewardAmountUsd.mul(sgdRateInWei).div(hre.ethers.utils.parseUnits('1', 18));
            rewards.push({
                lpAddress: address,
                bptBalance: balance.toString(),
                rewardAmountSgd: rewardAmountSgd.toString(),
                rewardAmountUsd: rewardAmountUsd.toString()
            })
            console.log(`Reward amount in USD to send to ${address} - ${rewardAmountUsd} -  ${hre.ethers.utils.formatEther(rewardAmountUsd)}`);
            console.log(`Reward amount in SGD to send to ${address} - ${rewardAmountSgd} - ${hre.ethers.utils.formatEther(rewardAmountSgd)}`);
        }
    }

    // loop through rewards and find duplicate lpAddress and add the rewardAmountSgd and rewardAmountUsd
    const uniqueRewards: Rewards[] = [];
    for (let i = 0; i < rewards.length; i++) {
        const reward = rewards[i];
        const index = uniqueRewards.findIndex((item: any) => item.lpAddress === reward.lpAddress);
        if (index === -1) {
            uniqueRewards.push(reward);
            lpUniqueAddresses.push(reward.lpAddress);
            lpUniquePendingRewards.push(reward.rewardAmountSgd);
            // lpUniquePendingRewards.push(hre.ethers.BigNumber.from(reward.rewardAmountSgd));
        } else {
            // convert to big number and add and then convert back to string
            uniqueRewards[index].rewardAmountSgd = hre.ethers.BigNumber.from(uniqueRewards[index].rewardAmountSgd).add(hre.ethers.BigNumber.from(reward.rewardAmountSgd)).toString();
            uniqueRewards[index].rewardAmountUsd = hre.ethers.BigNumber.from(uniqueRewards[index].rewardAmountUsd).add(hre.ethers.BigNumber.from(reward.rewardAmountUsd)).toString();
            lpUniqueAddresses.push(uniqueRewards[index].lpAddress);
            lpUniquePendingRewards.push(uniqueRewards[index].rewardAmountSgd);
            // lpUniquePendingRewards.push(hre.ethers.BigNumber.from(uniqueRewards[index].rewardAmountSgd));
        }
        // lpUniqueAddresses.push(uniqueRewards[index].lpAddress);
    }
    console.log('uniqueRewards', uniqueRewards);
    console.log('lpUniqueAddresses', lpUniqueAddresses);
    console.log('lpUniquePendingRewards', lpUniquePendingRewards);

    // write csv file
    const csvExporter = new ExportToCsv(options);
    const xsgdStats = csvExporter.generateCsv(uniqueRewards, true);
    fs.writeFileSync(`xsgd-rewards-snapshot-from-block-${FROM_BLOCK}.csv`, xsgdStats);
}