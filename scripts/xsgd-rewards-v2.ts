import { subgraphRequest } from './util/subgraphHelper'

const main = async () => {
  var firstDay = new Date(Date.UTC(2023, 2, 1, 23, 59, 59)) // March 1, 2023
  var lastDay = new Date(Date.UTC(2023, 3, 0, 23, 59, 59)) // March 31, 2023
  console.log('First day:', firstDay, firstDay.getTime())
  console.log('Last day:', lastDay, lastDay.getTime())

  let i = 0
  let timestamp = firstDay.getTime() / 1000
  const lastTimestamp = lastDay.getTime() / 1000
  const promises: any[] = []

  while (timestamp < lastTimestamp) {
    const day = new Date(firstDay.getTime())
    day.setDate(firstDay.getDate() + i)
    timestamp = day.getTime() / 1000
    promises.push(fetch(`https://coins.llama.fi/block/polygon/${timestamp}`))
    i++
  }

  const promises2 = (await Promise.all(promises)).map((r: any) => r.json())
  const blocks = (await Promise.all(promises2)).map((r: any) => r.height)

  const subgraphUrl =
    'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-polygon-v2'

  const poolId =
    '0x726e324c29a1e49309672b244bdc4ff62a270407000200000000000000000702'

  const promises3: any[] = []

  console.log('blocks:', blocks.join(', '))

  blocks.forEach(block => {
    const query = {
      users: {
        __args: {
          first: 100,
          where: {
            sharesOwned_: {
              poolId: poolId,
              balance_gt: '0'
            }
          },
          block: {
            number: block
          }
        },
        sharesOwned: {
          __args: {
            first: 5,
            where: {
              poolId: poolId
            }
          },
          balance: true,
          userAddress: {
            id: true
          }
        }
      },
      pools: {
        __args: {
          where: {
            id: poolId
          },
          block: {
            number: block
          }
        },
        totalLiquidity: true
      }
    }

    promises3.push(subgraphRequest(subgraphUrl, query))
  })

  const result = await Promise.all(promises3)

  let userBalances: { [userAddress: string]: number } = {}
  let totalLiquidity = 0

  result.map((r: any) => {
    r.users.map((u: any) => {
      const addresses = Object.keys(userBalances)
      const address = u.sharesOwned[0].userAddress.id
      const balance = Number(u.sharesOwned[0].balance)

      if (addresses.includes(address)) {
        userBalances[address] = userBalances[address] + balance
      } else {
        userBalances[address] = balance
      }
    })

    r.pools.map((p: any) => {
      totalLiquidity += Number(p.totalLiquidity)
    })
  })

  const days = blocks.length
  let totalBalances = 0
  Object.keys(userBalances).forEach(address => {
    userBalances[address] = userBalances[address] / days
    totalBalances += userBalances[address]
  })

  const averageLiquidity = totalLiquidity / days

  console.log('totalBalances:', totalBalances, 'BPT')
  console.log('averageLiquidity:', averageLiquidity, 'USD')

  const XSGD_RATE = 1.33 // 1 USD = 1.33 SGD
  const totalRewardsXSGD = ((averageLiquidity * 0.03) / 12) * XSGD_RATE // 3% of liquidity
  console.log(
    'totalRewards:',
    totalRewardsXSGD,
    'XSGD',
    `(rate: 1 USD = ${XSGD_RATE} XSGD)`
  )

  const userRewards: {
    address: string
    balance: number
    share: number
    rewards: number
  }[] = []
  Object.keys(userBalances).forEach(address => {
    const share = userBalances[address] / totalBalances
    userRewards.push({
      address,
      balance: userBalances[address],
      share,
      rewards: share * totalRewardsXSGD
    })
  })

  console.log(
    'userRewards:',
    userRewards.map(u => {
      return (
        `${u.address} ` +
        `- ${u.balance.toFixed(2)} BPT ` +
        `- ${Number(u.share * 100).toFixed(4)}% ` +
        `- ${u.rewards.toFixed(2)} XSGD`
      )
    })
  )
}

main()
