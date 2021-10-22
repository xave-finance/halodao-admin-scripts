import { formatEther } from 'ethers/lib/utils'

export const calculateTotalTxnFees = async (
  txnHashArray: string[],
  deployer: any
) => {
  return (
    (await getTxnFee(txnHashArray[0], deployer)) +
    (await getTxnFee(txnHashArray[1], deployer)) +
    (await getTxnFee(txnHashArray[2], deployer))
  )
}

const getTxnFee = async (txnHash: string, deployer: any) => {
  const txnReceipt = await deployer.provider.getTransactionReceipt(txnHash)
  return (
    Number(txnReceipt.gasUsed) *
    Number(formatEther(txnReceipt.effectiveGasPrice))
  )
}
