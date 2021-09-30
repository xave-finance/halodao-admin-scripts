import { ethers } from 'hardhat'
import { formatEther, formatUnits, parseEther } from 'ethers/lib/utils'

const verifyAddresses = async () => {
  // We get the contract to deploy
  const [deployer] = await ethers.getSigners()

  // Deployer information
  console.log('Deployer Address:', deployer.address)
  console.log('Deployer balance:', formatEther(await deployer.getBalance()))
  console.log('test successful')

  // 1 - call from firebase

  // 2 - check if hash are valid

  // 3 - check rewards from v1.0 if valid

  // 4 - generate json object of verified
}

verifyAddresses()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
