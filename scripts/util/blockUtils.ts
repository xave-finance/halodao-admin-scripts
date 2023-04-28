import axios from 'axios'
const MORALIS_API_KEY = process.env.MORALIS_API_KEY || ''

interface BlockData {
  date: string
  block: number
  timestamp: number
  block_timestamp: string
  hash: string
  parent_hash: string
}

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

export const getBlockNumber = async (
  epochStartDate: string,
  network: string
): Promise<number> => {
  try {
    const uri = `https://deep-index.moralis.io/api/v2/dateToBlock?rate_limit_cost=25&chain=${network}&date=${epochStartDate}`
    const response = await axios.get<BlockData>(uri, {
      headers: {
        'X-API-Key': `${MORALIS_API_KEY}`
      }
    })
    const json = response.data
    return json.block
  } catch (ex) {
    // error
    console.log(ex)
    throw ex
  }
}

export const getNativeBalancesForAddresses = async (
  addresses: string[],
  network: string
): Promise<any> => {
  try {
    // const uri = `https://deep-index.moralis.io/api/v2/wallets/balances?chain=${network}&wallet_addresses=${addresses.join(
    //   ','
    // )}`
    const uri =
      'https://deep-index.moralis.io/api/v2/wallets/balances?rate_limit_cost=25&chain=polygon&wallet_addresses%5B0%5D=0x06Cc3a57ad3Afc8b9594913468F2F3d41A14a369&wallet_addresses%5B1%5D=0x01e198818a895f01562E0A087595E5b1C7bb8d5c&wallet_addresses%5B2%5D=0xFd53Ff42a0F3C433aDD20EdCb14B9879C13ed187&to_block=40957743'
    const response = await axios.get(uri, {
      headers: {
        'X-API-Key': `${MORALIS_API_KEY}`
      }
    })
    console.log('response', response.data[0].wallet_balances)
    const json = response.data
    return json
  } catch (ex) {
    // error
    console.log(ex)
    throw ex
  }
}
