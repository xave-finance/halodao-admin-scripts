import { ethers } from 'hardhat'
import { formatEther, formatUnits, parseEther } from 'ethers/lib/utils'

const airdropXrnbw = async () => {
  // We get the contract to deploy
  const [deployer] = await ethers.getSigners()

  // Deployer information
  console.log('Deployer Address:', deployer.address)
  console.log('Deployer balance:', formatEther(await deployer.getBalance()))

  // 1 - check deployer balance

  // 2 - iterate json to send the amount of xRNBW owed

  // 3 - check balance

  // 4 - store all txn hash of airdropped in json
  // user, xrnbw value, hash
}

airdropXrnbw()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
