export const SWAP_FEE_V1 = 0.0005
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export const BPool: { xsgdusdc: string; thkdusdc: string } = {
  xsgdusdc: '0xd6fe343d66c797c8c392d59768b86ffa2cd8d602',
  thkdusdc: '0x309411c77CF68D5662c0D4dF68FB60f7E2dF3B65'
}

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

export interface Rewards {
  lpAddress: string
  bptBalance: string
  rewardAmountSgd: string
  rewardAmountUsd: string
}

export interface BptBalances {
  lpAddress: string
  bptBalance: string
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
