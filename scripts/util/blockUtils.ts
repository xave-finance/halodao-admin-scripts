export const getBlockRangeIteration = (
  latestBlockNumber: number,
  maxBlockRange: number
): number => {
  const chunks = latestBlockNumber / maxBlockRange
  const roundedChunks = Math.round(chunks)

  if (roundedChunks < chunks) {
    return roundedChunks + 1
  } else {
    return roundedChunks
  }
}
