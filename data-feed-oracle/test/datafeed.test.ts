import { Address, EventSubscribeOptions, groupOfAddress, sleep } from '@alephium/web3'
import { WeatherDataFeedInstance, WeatherDataFeedTypes } from '../artifacts/ts'
import { addOracle, alph, deployDataFeed, makeRequest, randomP2PKHAddress, removeOracle } from './utils'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import { getSigners, testAddress, getSigner } from '@alephium/web3-test'

describe('test data feed', () => {
  const groupIndex = groupOfAddress(testAddress)
  const fee = alph(10)

  let dataFeed: WeatherDataFeedInstance
  let owner: PrivateKeyWallet
  let users: PrivateKeyWallet[]
  let eventCount: number
  let requestId: any

  beforeEach(async () => {
    const now = Date.now()
    users = await getSigners(5, alph(1000), groupIndex)
    owner = await getSigner(alph(1000), groupIndex)
    dataFeed = (await deployDataFeed(owner.address, fee)).contractInstance
    eventCount = 0
    requestId = ''
  })

  async function checkOracle(dataFeed: WeatherDataFeedInstance, oracle: Address, expected: boolean) {
    const result = await dataFeed.view.checkOracle({ args: { oracle } })
    expect(result.returns).toEqual(BigInt(expected))
  }

  async function checkOracleRemoved(dataFeed: WeatherDataFeedInstance, oracle: Address, expected: boolean) {
    try {
      await dataFeed.view.checkOracle({ args: { oracle } })
    } catch (error: any) {
      expect(error?.message).toContain('does not exist')
    }
  }

  async function checkRequest(
    dataFeed: WeatherDataFeedInstance,
    requestId: string,
    lat: number,
    lon: number,
    status: Boolean,
    temp: string
  ) {
    const result = await dataFeed.view.getRequest({ args: { requestId } })
    expect(result.returns).toEqual({ lat: BigInt(lat), lon: BigInt(lon), status, temp })
  }

  function createSubscribeOptions<T>(events: Array<T>): EventSubscribeOptions<T> {
    return {
      pollingInterval: 500,
      messageCallback: (event: T) => {
        events.push(event)
      },
      errorCallback: (error: any, subscription) => {
        console.log(error)
        subscription.unsubscribe()
      },
      onEventCountChanged: (count: number) => {
        eventCount = count
      }
    }
  }

  test('datafeed:add oracle', async () => {
    const dummyOracle = randomP2PKHAddress()
    await addOracle(owner, dataFeed, dummyOracle)
    await checkOracle(dataFeed, dummyOracle, true)
  })

  test('datafeed:remove oracle', async () => {
    const dummyOracle = randomP2PKHAddress()
    await addOracle(owner, dataFeed, dummyOracle)
    await removeOracle(owner, dataFeed, dummyOracle)
    await checkOracleRemoved(dataFeed, dummyOracle, true)
  })

  test('datafeed:make oracle request', async () => {
    const user = users[1]
    const fee = (await dataFeed.fetchState()).fields.fee
    const newRequestEvents: Array<WeatherDataFeedTypes.NewRequestEvent> = []
    const subscribeOptions = createSubscribeOptions(newRequestEvents)
    const subscription = dataFeed.subscribeNewRequestEvent(subscribeOptions)

    await makeRequest(user, dataFeed, 40, 70, fee)

    await sleep(3000)

    expect(newRequestEvents.length).toEqual(1)
    newRequestEvents.forEach((event) => {
      expect(event.fields.lat).toEqual(40)
      expect(event.fields.lon).toEqual(70)
      requestId = event.fields.requestId
    })
    expect(subscription.currentEventCount()).toEqual(newRequestEvents.length)
    expect(eventCount).toEqual(1)

    subscription.unsubscribe()

    await checkRequest(dataFeed, requestId, 40, 70, false, '')
  }, 30000)
})
