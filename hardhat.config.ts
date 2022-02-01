require('dotenv').config()

import { HardhatUserConfig, task } from 'hardhat/config'
import '@nomiclabs/hardhat-waffle'
import 'hardhat-gas-reporter'
import '@nomiclabs/hardhat-ethers'
import 'solidity-coverage'
import '@nomiclabs/hardhat-etherscan'
import 'hardhat-typechain'
import { fetchV0Stats } from './scripts/protocol-statistics/fetch-v0-stats'
import { fetchV1Stats } from './scripts/protocol-statistics/fetch-v1-stats'

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID || ''
const MNEMONIC_SEED = process.env.MNEMONIC_SEED || ''
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ''
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || ''

// Tasks
task('v1statistics', 'fetch v1 statistics')
  .addParam('curveaddress', 'Curve address')
  .addParam('name', 'Name of the currency')
  .addParam('decimal', 'Currency decimal')
  .setAction(async ({ curveaddress, name, decimal }, hre) => {
    await fetchV1Stats(hre, curveaddress, name, decimal)
  })

task('v0statistics', 'fetch v0 statistics', async (args, hre) => {
  await fetchV0Stats(hre)
})

const config: HardhatUserConfig = {
  solidity: '0.6.12',
  networks: {
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      chainId: 1,
      accounts: {
        mnemonic: MNEMONIC_SEED
      }
    },
    hardhat: {
      chainId: 1337,
      accounts: {
        mnemonic: MNEMONIC_SEED
      }
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: {
        mnemonic: MNEMONIC_SEED
      }
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: {
        mnemonic: MNEMONIC_SEED
      }
    },

    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_PROJECT_ID}`,
      gasPrice: 200000000000,
      accounts: {
        mnemonic: MNEMONIC_SEED
      }
    },
    localhost: {
      chainId: 1337,
      url: 'http://127.0.0.1:8545/'
    },
    bscTestnet: {
      url: 'https://data-seed-prebsc-1-s2.binance.org:8545/',
      chainId: 97,
      gasPrice: 20000000000,
      accounts: {
        mnemonic: MNEMONIC_SEED
      }
    },
    maticTestnet: {
      url: 'https://rpc-mumbai.matic.today',
      chainId: 80001,
      accounts: {
        mnemonic: MNEMONIC_SEED
      }
    },
    moonbase: {
      url: 'https://rpc.testnet.moonbeam.network',
      chainId: 1287,
      accounts: {
        mnemonic: MNEMONIC_SEED
      }
    }
  },
  etherscan: {
    // change to BSCSCAN_API_KEY if BSC, ETHERSCAN_API_KEY if Eth networks
    apiKey: ETHERSCAN_API_KEY
  }
}

export default config
