export const SWAP_FEE_V1 = 0.0005

export const BPool: { xsgdusdc: string; thkdusdc: string } = {
  xsgdusdc: '0xd6fe343d66c797c8c392d59768b86ffa2cd8d602',
  thkdusdc: '0x309411c77CF68D5662c0D4dF68FB60f7E2dF3B65'
}

export const xrnbwInternalHolders = [ 
  '0x4fbc1dffd80f197cf99faeda8f7bcae0ebea4d81', // xRNBW Primary Bridge
  '0xa3a7b6f88361f48403514059f1f16c8e78d60eec', // xRNBW Arbitrum Bridge (external contract)
  '0xd10e226f85dfb53aa2f9f3d297e521e1ee4f1bf7', // xRNBW Multichain Bridge  (external contract)
  '0x9cff4a10b6fb163a4df369aafed9d95838222ca6', // AMM Rewards 1.1
  '0x1af00782f74ddc4c7fcefe8752113084febcda45', // AMM Rewards 1.0 
  '0x5fcd66bce7fdccbaa7aeeb39537820bd953ef7e2', // AMM Rewards 0  
  '0xd1a8ab10725779246d9d48e422f7fc3313d133f2', // Uniswap V2: xRNBW
  '0x7eaE370E6a76407C3955A2f0BBCA853C38e6454E', // contract ops multisig
]
export interface Stats {
  amountIn: string
  amountOut: string
  feesIn: string
  feesOut: string
  caller: string
}

export interface StatsCurve {
  amountIn: string
  amountOut: string
  feesIn: string
  feesOut: string
  tradeAmount: string
  caller: string
}

export interface UserInfo {
  pid: number
  user: string
  amount: string
  rewardDebt: string
}

// add more here as needed
export const getStartBlockNumber = (networkName: string) => {
  switch (networkName) {
    case 'mainnet': {
      return 12765981
    }
    case 'arbitrum': {
      return 2525586
    }
    case 'polygon': {
      return 18910353
    }
    default: {
      return 12765981
    }
  }
}

export const getMaxBlockRange = (networkName: string): number => {
  switch (networkName) {
    case 'mainnet': {
      return 1
    }
    case 'arbitrum': {
      return 100000
    }
    case 'polygon': {
      return 3500
    }
    default: {
      return 1
    }
  }
}
