import axios from 'axios';
const MORALIS_API_KEY = process.env.MORALIS_API_KEY || ''

interface BlockData {
  date: string;
  block: number;
  timestamp: number;
  block_timestamp: string;
  hash: string;
  parent_hash: string;
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

export const getBlockNumber = async (epochStartDate: string): Promise<number> => {
  try {
    const uri = `https://deep-index.moralis.io/api/v2/dateToBlock?chain=polygon&date=${epochStartDate}`;
    const response = await axios.get<BlockData>(uri, {
      headers: {
        'X-API-Key': `${MORALIS_API_KEY}`,
      },
    });
    const json = response.data;
    return json.block;
  } catch (ex) {
    // error
    console.log(ex);
    throw ex;
  }
};
