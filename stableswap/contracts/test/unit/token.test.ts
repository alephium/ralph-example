import { web3, TestContractParams, addressFromContractId, AssetOutput, DUST_AMOUNT } from '@alephium/web3'
import { expectAssertionError, randomContractId, testAddress } from '@alephium/web3-test'
import { StableSwapInstance, StableSwapTypes } from '../../artifacts/ts'

describe('unit tests', () => {
  let testContractId: string
  let testTokenId: string
  let testContractAddress: string
  let testParamsFixture: TestContractParams<StableSwapTypes.Fields, { amount: bigint }>
  let stableSwapInstance: StableSwapInstance

  // We initialize the fixture variables before all tests
  beforeAll(async () => {
    web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
    testContractId = randomContractId()
    testTokenId = testContractId
    testContractAddress = addressFromContractId(testContractId)
    testParamsFixture = {
      // a random address that the test contract resides in the tests
      address: testContractAddress,
      // assets owned by the test contract before a test
      initialAsset: { alphAmount: 10n ** 18n, tokens: [{ id: testTokenId, amount: 10n }] },
      // initial state of the test contract

      // initialA: U256, futureA: U256, initialATime: U256, futureATime: U256, balances: [U256; 3]
      initialFields: {
        initialA: BigInt(100),
        futureA: BigInt(100),
        initialATime: BigInt(0),
        futureATime: BigInt(0),
        balances: [BigInt(10000000000), BigInt(10000000000), BigInt(10000000000)]
      },
      // arguments to test the target function of the test contract
      testArgs: { amount: 1n },
      // assets owned by the caller of the function
      inputAssets: [{ address: testAddress, asset: { alphAmount: 10n ** 18n } }]
    }
  })

  it('test withdraw', async () => {
    const testParams = { ...testParamsFixture, testArgs: { amount: 3n } }
    // test that assertion failed in the withdraw function
    await expectAssertionError(stableSwapInstance.tests.withdraw(testParams), testContractAddress, 0)
  })
})
