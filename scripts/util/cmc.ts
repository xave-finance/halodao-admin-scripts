import axios from 'axios'
const CMC_API_KEY = process.env.CMC_API_KEY || ''

interface QuoteData {
  data: {
    [key: string]: {
      quote: {
        USD: {
          price: number
        }
      }
    }
  }
}

export const getSGDRate = async (): Promise<number> => {
  if (!CMC_API_KEY) {
    // fail early
    throw new Error('CMC_API_KEY is not set')
  }

  try {
    const response = await axios.get<QuoteData>(
      'https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=2808',
      {
        headers: {
          'X-CMC_PRO_API_KEY': `${CMC_API_KEY}`
        }
      }
    )
    const json = response.data
    const sgdPrice = json.data['2808'].quote['USD'].price
    return sgdPrice
  } catch (ex) {
    // error
    console.log(ex)
    throw ex
  }
}
