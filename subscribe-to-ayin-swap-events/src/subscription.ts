import { Address, EventSubscription } from '@alephium/web3'
import { TokenPair, TokenPairTypes } from './TokenPair'

export function subscribeSwapEvent(
  tokenPairAddress: Address,
  fromCount: number
): EventSubscription {
  const instance = TokenPair.at(tokenPairAddress)
  return instance.subscribeSwapEvent(
    {
      pollingInterval: 1000,
      messageCallback: (swapEvent: TokenPairTypes.SwapEvent) => {
        console.log('received swap event: ', swapEvent.fields)
        return Promise.resolve()
      },
      errorCallback: (error, subscription) => {
        console.error('error: ', error)
        subscription.unsubscribe()
        return Promise.resolve()
      }
    },
    // you can also subscribe starting from the current event count:
    // const currentCount = await instance.getContractEventsCurrentCount()
    fromCount
  )
}

export function subscribeAllEvents(
  tokenPairAddress: Address,
  fromCount: number
): EventSubscription {
  const instance = TokenPair.at(tokenPairAddress)
  return instance.subscribeAllEvents(
    {
      pollingInterval: 1000,
      messageCallback: (event: TokenPairTypes.MintEvent | TokenPairTypes.BurnEvent | TokenPairTypes.SwapEvent) => {
        switch (event.name) {
          case 'Mint':
            const mintEvent = event as TokenPairTypes.MintEvent
            console.log('received mint event: ', mintEvent.fields)
            break
          case 'Burn':
            const burnEvent = event as TokenPairTypes.BurnEvent
            console.log('received burn event: ', burnEvent.fields)
            break
          case 'Swap':
            const swapEvent = event as TokenPairTypes.SwapEvent
            console.log('received swap event: ', swapEvent.fields)
            break
          default:
            throw new Error(`unknown event ${event.name}`)
        }
        return Promise.resolve()
      },
      errorCallback: (error, subscription) => {
        console.error('error: ', error)
        subscription.unsubscribe()
        return Promise.resolve()
      }
    },
    // you can also subscribe starting from the current event count:
    // const currentCount = await instance.getContractEventsCurrentCount()
    fromCount
  )
}
