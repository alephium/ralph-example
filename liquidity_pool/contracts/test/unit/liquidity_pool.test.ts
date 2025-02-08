import { web3, TestContractParams, addressFromContractId, AssetOutput } from '@alephium/web3'
import { expectAssertionError, randomContractId, testAddress } from '@alephium/web3-test'
import { LiquidityPool, LiquidityPoolTypes } from './artifacts/LiquidityPool'
import { TokenFaucet, TokenFaucetTypes } from './artifacts/TokenFaucet'

describe('LiquidityPool Contract Tests', () => {
  let testContractId: string
  let token0Id: string
  let token1Id: string
  let lpTokenId: string
  let testContractAddress: string
  let testParamsFixture: TestContractParams<LiquidityPoolTypes.Fields, {
    amount0: bigint,
    amount1: bigint,
    minLPTokens: bigint
  }>

  beforeAll(async () => {
    web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
    
    // Generate test contract IDs for tokens and LP token
    testContractId = randomContractId()
    token0Id = randomContractId()
    token1Id = randomContractId()
    lpTokenId = randomContractId()
    testContractAddress = addressFromContractId(testContractId)

    // Initial test fixture for deposit
    testParamsFixture = {
      address: testContractAddress,
      initialAsset: { 
        alphAmount: 10n ** 18n, 
        tokens: [
          { id: token0Id, amount: 1000n },
          { id: token1Id, amount: 1000n }
        ] 
      },
      initialFields: {
        token0: token0Id,
        token1: token1Id,
        lpToken: lpTokenId,
        reserve0: 0n,
        reserve1: 0n
      },
      testArgs: {
        amount0: 100n,
        amount1: 100n,
        minLPTokens: 0n
      },
      inputAssets: [
        { 
          address: testAddress, 
          asset: { 
            alphAmount: 10n ** 18n,
            tokens: [
              { id: token0Id, amount: 200n },
              { id: token1Id, amount: 200n }
            ] 
          } 
        }
      ]
    }
  })

  it('should successfully deposit initial liquidity', async () => {
    const testParams = testParamsFixture
    const testResult = await LiquidityPool.tests.deposit(testParams)

    // Verify contract state after deposit
    const contractState = testResult.contracts[0] as LiquidityPoolTypes.State
    expect(contractState.fields.reserve0).toEqual(100n)
    expect(contractState.fields.reserve1).toEqual(100n)

    // Check deposit event
    expect(testResult.events.length).toEqual(1)
    const depositEvent = testResult.events[0] as LiquidityPoolTypes.DepositEvent
    expect(depositEvent.name).toEqual('Deposit')
    expect(depositEvent.fields.amount0).toEqual(100n)
    expect(depositEvent.fields.amount1).toEqual(100n)
  })

  it('should fail deposit with insufficient amounts', async () => {
    const testParams = {
      ...testParamsFixture,
      testArgs: {
        amount0: 0n,
        amount1: 100n,
        minLPTokens: 0n
      }
    }

    await expectAssertionError(
      LiquidityPool.tests.deposit(testParams), 
      testContractAddress, 
      1 // InvalidDepositAmount error code
    )
  })

  it('should successfully withdraw liquidity', async () => {
    // First, deposit some liquidity
    const depositParams = testParamsFixture
    await LiquidityPool.tests.deposit(depositParams)

    // Then prepare withdrawal test
    const withdrawParams = {
      ...depositParams,
      testArgs: {
        lpTokenAmount: 50n,
        minAmount0: 0n,
        minAmount1: 0n
      }
    }

    const testResult = await LiquidityPool.tests.withdraw(withdrawParams)

    // Verify contract state after withdrawal
    const contractState = testResult.contracts[0] as LiquidityPoolTypes.State
    expect(contractState.fields.reserve0).toEqual(50n)
    expect(contractState.fields.reserve1).toEqual(50n)

    // Check withdrawal event
    expect(testResult.events.length).toEqual(1)
    const withdrawEvent = testResult.events[0] as LiquidityPoolTypes.WithdrawEvent
    expect(withdrawEvent.name).toEqual('Withdraw')
    expect(withdrawEvent.fields.amount0).toEqual(50n)
    expect(withdrawEvent.fields.amount1).toEqual(50n)
  })

  it('should fail withdrawal with insufficient LP tokens', async () => {
    const testParams = {
      ...testParamsFixture,
      testArgs: {
        lpTokenAmount: 0n,
        minAmount0: 0n,
        minAmount1: 0n
      }
    }

    await expectAssertionError(
      LiquidityPool.tests.withdraw(testParams), 
      testContractAddress, 
      2 // InsufficientLPTokens error code
    )
  })
})