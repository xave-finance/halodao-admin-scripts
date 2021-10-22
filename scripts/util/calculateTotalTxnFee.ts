import { formatEther } from 'ethers/lib/utils'

export const calculateTotalTxnFees = async (
  txnHashArray: string[],
  deployer: any
) => {
  return (
    (await getReceipt(txnHashArray[0], deployer)) +
    (await getReceipt(txnHashArray[1], deployer)) +
    (await getReceipt(txnHashArray[2], deployer))
  )
}

const getReceipt = async (txnHash: string, deployer: any) => {
  const txnReceipt = await deployer.provider.getTransactionReceipt(txnHash)
  return (
    Number(txnReceipt.gasUsed) *
    Number(formatEther(txnReceipt.effectiveGasPrice))
  )
}
