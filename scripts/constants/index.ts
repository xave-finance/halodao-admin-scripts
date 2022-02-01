export const V0_START_BLOCK_NUMBER = 12765981
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
}
