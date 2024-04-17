import { web3, sleep } from '@alephium/web3'
import { subscribeAllEvents, subscribeSwapEvent } from '../src/subscription'

web3.setCurrentNodeProvider('https://wallet.mainnet.alephium.org')

describe('tests', () => {
  const alphAyinTokenPairAddress = '25ywM8iGxKpZWuGA5z6DXKGcZCXtPBmnbQyJEsjvjjWTy'

  it('should subscribe to swap events', async () => {
    const subscription = subscribeSwapEvent(alphAyinTokenPairAddress, 0)
    await sleep(10_000)
    subscription.unsubscribe()
  }, 20000)

  it('should subscribe to all events', async () => {
    const subscription = subscribeAllEvents(alphAyinTokenPairAddress, 0)
    await sleep(10_000)
    subscription.unsubscribe()
  }, 20000)
})