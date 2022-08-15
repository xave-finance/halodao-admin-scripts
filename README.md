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

### Using Protocol Statistics

#### V0

- From [HDEV-467](https://halodao.atlassian.net/browse/HDEV-467), xsgd is only available. Run the task using the command below:

```
yarn hardhat v0statistics  --network mainnet
```

#### V1

- To generate a csv file input the command below:

```
yarn hardhat v1statistics --curveaddress {address of the curve} --name {token name for the filenames} --decimal {token decimal places that is not usdc} --network mainnet
```

Example:

```
yarn hardhat v1statistics --curveaddress 0x64DCbDeb83e39f152B7Faf83E5E5673faCA0D42A --name XSGD --decimal 6  --network mainnet
```

### Using XAV Airdrop 
```
yarn hardhat xav-airdrop --network mainnet
```