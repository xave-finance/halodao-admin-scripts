export const SWAP_FEE_V1 = 0.0005

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
  month?: string
  year?: string
  timestamp?: string
}

export interface StatsCurve {
  amountIn: string
  amountOut: string
  feesIn: string
  feesOut: string
  tradeAmount: string
  caller: string
}

// add more here as needed
export const getStartBlockNumber = (networkName: string) => {
  switch (networkName) {
    case 'mainnet': {
      return 12765981
    }
    case 'arbitrum': {
      return 3720315	// 5125323
      // return 7341762 //3720315 //5125323 //2525586
    }
    case 'polygon': {
      return 20588832
      // return 20620820
      // return 20697650
      // return 22193610
      // return 26981444 //18959446 
      // return 20697650 //23320444 // 18959446
      // return 18910353
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
