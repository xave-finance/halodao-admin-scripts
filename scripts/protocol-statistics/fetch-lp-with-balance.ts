import { formatEther, formatUnits } from 'ethers/lib/utils'
import { ExportToCsv } from 'export-to-csv'
import {
  UserInfo
} from '../constants'
import * as fs from 'fs'
import { ammRewardsABI } from '../constants/abi/amm-rewards'
import { curveABI } from '../constants/abi/curve'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { getBlockRangeIteration } from '../util/blockUtils'

export const fetchLPWithBalance = async (
  hre: HardhatRuntimeEnvironment
  // curveAddress: string,
  // name: string,
  // decimal: number
) => {
  const [deployer] = await hre.ethers.getSigners()
  const userInfo: UserInfo[] = []

  const FROM_BLOCK = 18910358

  const ammRewardsContract = new hre.ethers.Contract(
    '0x972127aFf8e6464e50eFc0a2aD344063355AE424',
    ammRewardsABI,
    deployer
  )

  const ammRewardsContractEventFilter = await ammRewardsContract.filters.Deposit()


  const ammRewardsContractEvents = await ammRewardsContract.queryFilter(
    ammRewardsContractEventFilter,
    FROM_BLOCK,
    await deployer.provider?.getBlockNumber()
  )

  const ammRewardsContractEventsArray = ammRewardsContractEvents

  for (let i = 0; i < ammRewardsContractEventsArray.length; i++) {
    const log = ammRewardsContractEventsArray[i]
    if (Number(log.args?.pid) > 0) continue
    // query user info mapping from ammRewardsContract

    const user = await ammRewardsContract.userInfo(0, log.args?.user);
    if (Number(formatUnits(user.amount, 18)) == 0) continue
    // console.log('user', formatUnits(user.amount, 18));
    userInfo.push({
      pid:  Number(log.args?.pid),
      user: log.args?.user,
      amount: formatUnits(user.amount, 18),
      rewardDebt: formatUnits(user.rewardDebt, 18)
    })
  }

  console.log('LP with HLP-XSGD-USDC Balance:', userInfo);
  console.log('LP with HLP-XSGD-USDC Balance count', userInfo.length);
  console.log('Deposit Event Count', ammRewardsContractEventsArray.length);

}
