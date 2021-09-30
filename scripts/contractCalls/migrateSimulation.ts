import { ethers } from 'hardhat'
import { formatEther, formatUnits, parseEther } from 'ethers/lib/utils'
import { REWARDS_TO_DEPLOY } from '../constants'
import {
  HALO_TOKEN_ADDRESS,
  REWARDS_MANAGER_CONTRACT_ADDRESS
} from '../constants/addresses'

const triggerEpochRewards = async () => {
  // We get the contract to deploy
  const [deployer] = await ethers.getSigners()

  // Deployer information
  console.log('Deployer Address:', deployer.address)
  console.log('Deployer balance:', formatEther(await deployer.getBalance()))

  const lptTokenContract = await ethers.getContractAt(
    'LpToken',
    '0xEb06cF1cD90d75eC6d10bbdc43B555483674F6ff'
  )

  const ammRewards1 = await ethers.getContractAt(
    'AmmRewards',
    '0xeD252AE0B697FbF60572eeFa1c7411E813A2f03B'
  )
  const ammRewards2 = await ethers.getContractAt(
    'AmmRewards',
    '0x311FDdE361e6258e9730c6147aAf584aC0F9c59A'
  )

  console.log(
    `LP Token balance: ${formatEther(
      await lptTokenContract.balanceOf(deployer.address)
    )}`
  )

  /*
  const txn0 = await ammRewards1.deposit(1, parseEther("10"), deployer.address);

  const txnResult0 = await txn0.wait();

  console.log(
    `gas used: ${formatEther(txnResult0.gasUsed)}, txn hash: ${
      txnResult0.transactionHash
    }, blockNumber: ${txnResult0.blockNumber}`
  );
*/

  await lptTokenContract.transfer()

  /*
  const txn1 = await ammRewards1.deposit(
    0,
    parseEther("110"),
    deployer.address
  );

  const txnResult1 = await txn1.wait();

  console.log(
    `gas used: ${formatEther(txnResult1.gasUsed)}, txn hash: ${
      txnResult1.transactionHash
    }, blockNumber: ${txnResult1.blockNumber}`
  );
*/
  /*
  console.log(`Transaction 1: Withdraw from amm v1.0`);

  const txn1 = await ammRewards1.withdraw(0, parseEther("3"), deployer.address);

  const txnResult1 = await txn1.wait();

  console.log(
    `Withdraw from v1.0: gas used: ${formatEther(
      txnResult1.gasUsed
    )}, txn hash: ${txnResult1.transactionHash}, blockNumber: ${
      txnResult1.blockNumber
    }`
  );


  //console.log(txnResult1);

  console.log(`Transaction 2: Approve transfer to amm v1.1`);

  const txn2 = await lptTokenContract.approve(
    ammRewards2.address,
    parseEther("1000000")
  );

  const txnResult2 = await txn2.wait();

  console.log(
    `gas used: ${formatEther(txnResult2.gasUsed)}, txn hash: ${
      txnResult2.transactionHash
    }, blockNumber: ${txnResult2.blockNumber}`
  );

  console.log(`Transaction 3: Deposit to amm v1.1`);
  const txn3 = await ammRewards2.deposit(
    0,
    parseEther("100"),
    deployer.address
  );

  const txnResult3 = await txn3.wait();

  console.log(
    `gas used: ${formatEther(txnResult3.gasUsed)}, txn hash: ${
      txnResult3.transactionHash
    }, blockNumber: ${txnResult3.blockNumber}`
  );

  console.log(
    `${deployer.address} reward in Amm v1.0: ${formatEther(
      await ammRewards1.pendingRewardToken(0, deployer.address)
    )}`
  );

  console.log(
    `total gas costs: ${formatEther(
      txnResult1.gasUsed.add(txnResult2.gasUsed).add(txnResult3.gasUsed)
    )}`

    // pool address, user address, hashes, pending rewards, gas
  );
  */
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
triggerEpochRewards()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
