### Halo Admin Scripts

This repository aims to run scripts to interact with HALODao contracts in admin mode.

### Current scripts

- ammRewardsV1.0 airdrop script + helpers

### How to write scripts

```
  // 1-  Get signers, pref our deployer address which is address[0] in the mnemonic
  const [deployer] = await ethers.getSigners()

  // 2a - contract call: Add contract reference using ethers.getContractAt()
  const fooContract = await ethers.getContractAt(
    ABI,
    contractAddress
  )

  // 2b - deploy: Add a contract reference using ethers.getContractFactory()
  const fooContract = ethers.getContractFactory(ABI)

  // 3a - call a function in the contract or deploy
  await fooContract.function(params)

  // 3b - deploy a contract:
  await fooContract.deploy()

```
