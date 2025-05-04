import { web3, TestContractParams, addressFromContractId, AssetOutput, DUST_AMOUNT } from '@alephium/web3'
import { expectAssertionError, randomContractId, testAddress } from '@alephium/web3-test'
import { StableSwapInstance, StableSwapTypes, StableSwap } from '../../artifacts/ts'

describe('get A', () => {
  let testContractId: string
  let testTokenId: string
  let testContractAddress: string
  let testParamsFixture: TestContractParams<StableSwapTypes.Fields, { amount: bigint }>

  beforeAll(async () => {
    web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
    testContractId = randomContractId()
    testTokenId = testContractId
    testContractAddress = addressFromContractId(testContractId)
    testParamsFixture = {
      address: testContractAddress,
      initialAsset: { alphAmount: 10n ** 18n, tokens: [{ id: testTokenId, amount: 10n }] },
      initialFields: {
        initialA: BigInt(100),
        futureA: BigInt(500),
        initialATime: BigInt(0),
        futureATime: BigInt(200),
        balances: [BigInt(1000), BigInt(1000), BigInt(1000)],
        rates: [
          BigInt('1000000000000000000'),
          BigInt('1000000000000000000000000000000'),
          BigInt('1000000000000000000000000000000')
        ]
      },
      testArgs: { amount: 1n },
      inputAssets: [{ address: testAddress, asset: { alphAmount: 10n ** 18n } }]
    }
  })

  it('blockTimestamp in middle', async () => {
    const testParams = { ...testParamsFixture, testArgs: { amount: 3n }, blockTimeStamp: 0 }
    const result = await StableSwap.tests.getA(testParams)
    expect(result.returns).toEqual(100n)
  })

  it('blockTimestamp in middle', async () => {
    const testParams = { ...testParamsFixture, testArgs: { amount: 3n }, blockTimeStamp: 100 }
    const result = await StableSwap.tests.getA(testParams)
    expect(result.returns).toEqual(300n)
  })

  it('blockTimestamp equal futureA time', async () => {
    const testParams = { ...testParamsFixture, testArgs: { amount: 3n }, blockTimeStamp: 200 }
    const result = await StableSwap.tests.getA(testParams)
    expect(result.returns).toEqual(500n)
  })

  it('blockTimestamp greater futureA time', async () => {
    const testParams = { ...testParamsFixture, testArgs: { amount: 3n }, blockTimeStamp: 250 }
    const result = await StableSwap.tests.getA(testParams)
    expect(result.returns).toEqual(500n)
  })
})

describe('exchange function tests', () => {
  let testContractId: string
  let testTokenId: string
  let testContractAddress: string
  let testParamsFixture: TestContractParams<
    StableSwapTypes.Fields,
    {
      i: bigint
      j: bigint
      dx: bigint
      min_dy: bigint
    }
  >

  beforeAll(async () => {
    web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
    testContractId = randomContractId()
    testTokenId = testContractId
    testContractAddress = addressFromContractId(testContractId)

    const PRECISION = 1000000000000000000n

    testParamsFixture = {
      address: testContractAddress,
      initialAsset: {
        alphAmount: 10n ** 18n,
        tokens: [{ id: testTokenId, amount: 10n }]
      },
      initialFields: {
        initialA: BigInt(100),
        futureA: BigInt(500),
        initialATime: BigInt(0),
        futureATime: BigInt(200),
        balances: [BigInt(1000) * PRECISION, BigInt(1000) * PRECISION, BigInt(1000) * PRECISION],
        rates: [PRECISION, PRECISION, PRECISION]
      },
      testArgs: {
        i: 0n,
        j: 1n,
        dx: BigInt(100) * PRECISION,
        min_dy: BigInt(90) * PRECISION
      },
      inputAssets: [
        {
          address: testAddress,
          asset: { alphAmount: 10n ** 18n }
        }
      ]
    }
  })

  it('should successfully exchange tokens with sufficient output', async () => {
    const result = await StableSwap.tests.exchange(testParamsFixture)
    const expectedOutput = (testParamsFixture.testArgs.dx * 999n) / 1000n
    expect(result.returns).toBeGreaterThanOrEqual(testParamsFixture.testArgs.min_dy)
    expect(result.returns).toBeLessThanOrEqual(expectedOutput)
  })

  it('should fail when output amount is less than minimum', async () => {
    const testParams = {
      ...testParamsFixture,
      testArgs: {
        ...testParamsFixture.testArgs,
        min_dy: testParamsFixture.testArgs.dx
      }
    }

    await expectAssertionError(StableSwap.tests.exchange(testParams), testContractAddress, 1)
  })

  it('should handle different token decimal places correctly', async () => {
    const PRECISION = 1000000000000000000n
    const testParams = {
      ...testParamsFixture,
      initialFields: {
        ...testParamsFixture.initialFields,
        balances: [BigInt(1000) * PRECISION, BigInt(1000) * PRECISION, BigInt(1000) * PRECISION] as [
          bigint,
          bigint,
          bigint
        ],
        rates: [PRECISION, PRECISION * 1000n, PRECISION / 1000n] as [bigint, bigint, bigint]
      },
      testArgs: {
        ...testParamsFixture.testArgs,
        dx: BigInt(100) * PRECISION,
        min_dy: BigInt(0)
      }
    }

    const result = await StableSwap.tests.exchange(testParams)
    expect(result.returns).toBeGreaterThan(0n)
  })
})

describe('xp normalization tests', () => {
  let testContractId: string
  let testTokenId: string
  let testContractAddress: string
  let testParamsFixture: TestContractParams<StableSwapTypes.Fields, { balances: [bigint, bigint, bigint] }>

  beforeAll(async () => {
    web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
    testContractId = randomContractId()
    testTokenId = testContractId
    testContractAddress = addressFromContractId(testContractId)

    testParamsFixture = {
      address: testContractAddress,
      initialAsset: {
        alphAmount: 10n ** 18n,
        tokens: [{ id: testTokenId, amount: 10n }]
      },
      initialFields: {
        initialA: BigInt(100),
        futureA: BigInt(500),
        initialATime: BigInt(0),
        futureATime: BigInt(200),
        balances: [BigInt(1000), BigInt(1000), BigInt(1000)],
        rates: [
          BigInt('1000000000000000000'),
          BigInt('1000000000000000000000000000000'),
          BigInt('1000000000000000000000000000000')
        ]
      },
      testArgs: {
        balances: [BigInt(1000), BigInt(1000), BigInt(1000)]
      },
      inputAssets: [
        {
          address: testAddress,
          asset: { alphAmount: 10n ** 18n }
        }
      ]
    }
  })

  it('should normalize balances correctly with 1:1 rate', async () => {
    const testParams = {
      ...testParamsFixture,
      testArgs: {
        pBalances: [BigInt(1000), BigInt(0), BigInt(0)] as [bigint, bigint, bigint]
      }
    }

    const result = await StableSwap.tests.xp(testParams)
    expect(result.returns[0]).toEqual(BigInt(1000))
  })

  it('should normalize balances correctly with 1:1e12 rate', async () => {
    const testParams = {
      ...testParamsFixture,
      testArgs: {
        pBalances: [BigInt(0), BigInt(1000), BigInt(0)] as [bigint, bigint, bigint]
      }
    }

    const result = await StableSwap.tests.xp(testParams)
    expect(result.returns[1]).toEqual(BigInt(1000) * BigInt(10) ** BigInt(12))
  })

  it('should normalize multiple non-zero balances', async () => {
    const testParams = {
      ...testParamsFixture,
      testArgs: {
        pBalances: [BigInt(1000), BigInt(2000), BigInt(3000)] as [bigint, bigint, bigint]
      }
    }

    const result = await StableSwap.tests.xp(testParams)
    expect(result.returns[0]).toEqual(BigInt(1000))
    expect(result.returns[1]).toEqual(BigInt(2000) * BigInt(10) ** BigInt(12))
    expect(result.returns[2]).toEqual(BigInt(3000) * BigInt(10) ** BigInt(12))
  })
})

describe('getD invariant tests', () => {
  let testContractId: string
  let testTokenId: string
  let testContractAddress: string
  let testParamsFixture: TestContractParams<
    StableSwapTypes.Fields,
    {
      xp: [bigint, bigint, bigint]
      amp: bigint
    }
  >

  beforeAll(async () => {
    web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
    testContractId = randomContractId()
    testTokenId = testContractId
    testContractAddress = addressFromContractId(testContractId)

    testParamsFixture = {
      address: testContractAddress,
      initialAsset: {
        alphAmount: 10n ** 18n,
        tokens: [{ id: testTokenId, amount: 10n }]
      },
      initialFields: {
        initialA: BigInt(100),
        futureA: BigInt(500),
        initialATime: BigInt(0),
        futureATime: BigInt(200),
        balances: [BigInt(1000), BigInt(1000), BigInt(1000)],
        rates: [
          BigInt('1000000000000000000'),
          BigInt('1000000000000000000000000000000'),
          BigInt('1000000000000000000000000000000')
        ]
      },
      testArgs: {
        xp: [BigInt(1000), BigInt(1000), BigInt(1000)] as [bigint, bigint, bigint],
        amp: BigInt(100)
      },
      inputAssets: [
        {
          address: testAddress,
          asset: { alphAmount: 10n ** 18n }
        }
      ]
    }
  })

  it('should return 0 when sum is 0', async () => {
    const testParams = {
      ...testParamsFixture,
      testArgs: {
        xp: [BigInt(0), BigInt(0), BigInt(0)] as [bigint, bigint, bigint],
        amp: BigInt(100)
      }
    }

    const result = await StableSwap.tests.getD(testParams)
    expect(result.returns).toEqual(BigInt(0))
  })

  it('should calculate D correctly for equal balances', async () => {
    const balance = BigInt(1000)
    const testParams = {
      ...testParamsFixture,
      testArgs: {
        xp: [balance, balance, balance] as [bigint, bigint, bigint],
        amp: BigInt(100)
      }
    }

    const result = await StableSwap.tests.getD(testParams)
    // For equal balances, D should equal the sum of balances
    expect(result.returns).toEqual(balance * BigInt(3))
  })

  it('should calculate D correctly for imbalanced pools', async () => {
    const testParams = {
      ...testParamsFixture,
      testArgs: {
        xp: [BigInt(1500), BigInt(750), BigInt(750)] as [bigint, bigint, bigint],
        amp: BigInt(100)
      }
    }

    const result = await StableSwap.tests.getD(testParams)
    // D should be less than sum for imbalanced pools
    const sum = BigInt(1500 + 750 + 750)
    expect(result.returns).toBeLessThan(sum)
    expect(result.returns).toBeGreaterThan((sum * BigInt(95)) / BigInt(100)) // Should be within 5%
  })

  it('should handle different amplification parameters', async () => {
    const balances: [bigint, bigint, bigint] = [BigInt(1000), BigInt(1000), BigInt(1000)]

    // Test with low A
    const lowAParams = {
      ...testParamsFixture,
      testArgs: {
        xp: balances,
        amp: BigInt(10)
      }
    }
    const lowAResult = await StableSwap.tests.getD(lowAParams)

    // Test with high A
    const highAParams = {
      ...testParamsFixture,
      testArgs: {
        xp: balances,
        amp: BigInt(1000)
      }
    }
    const highAResult = await StableSwap.tests.getD(highAParams)

    // Higher A should result in same or higher D for same balances
    expect(highAResult.returns).toBeGreaterThanOrEqual(lowAResult.returns)
  })

  it('should converge within reasonable iterations', async () => {
    const testParams = {
      ...testParamsFixture,
      testArgs: {
        xp: [BigInt(2000), BigInt(500), BigInt(1500)] as [bigint, bigint, bigint],
        amp: BigInt(100)
      }
    }

    const result = await StableSwap.tests.getD(testParams)
    // Verify result is non-zero (convergence occurred)
    expect(result.returns).toBeGreaterThan(BigInt(0))
  })

  it('should maintain invariant property under balanced swaps', async () => {
    // Initial D
    const initialParams = {
      ...testParamsFixture,
      testArgs: {
        xp: [BigInt(1000), BigInt(1000), BigInt(1000)] as [bigint, bigint, bigint],
        amp: BigInt(100)
      }
    }
    const initialD = await StableSwap.tests.getD(initialParams)

    // D after balanced swap
    const swappedParams = {
      ...testParamsFixture,
      testArgs: {
        xp: [BigInt(1100), BigInt(900), BigInt(1000)] as [bigint, bigint, bigint],
        amp: BigInt(100)
      }
    }
    const swappedD = await StableSwap.tests.getD(swappedParams)

    // D should remain relatively stable (within 1% difference)
    const difference =
      initialD.returns > swappedD.returns ? initialD.returns - swappedD.returns : swappedD.returns - initialD.returns

    expect((difference * BigInt(100)) / initialD.returns).toBeLessThan(BigInt(1))
  })
})

describe('getY output calculation tests', () => {
  let testContractId: string
  let testTokenId: string
  let testContractAddress: string
  let testParamsFixture: TestContractParams<
    StableSwapTypes.Fields,
    {
      i: bigint
      j: bigint
      x: bigint
      xp: [bigint, bigint, bigint]
    }
  >

  beforeAll(async () => {
    web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
    testContractId = randomContractId()
    testTokenId = testContractId
    testContractAddress = addressFromContractId(testContractId)

    testParamsFixture = {
      address: testContractAddress,
      initialAsset: {
        alphAmount: 10n ** 18n,
        tokens: [{ id: testTokenId, amount: 10n }]
      },
      initialFields: {
        initialA: BigInt(100),
        futureA: BigInt(100), // Keep A constant for predictable tests
        initialATime: BigInt(0),
        futureATime: BigInt(0),
        balances: [BigInt(1000), BigInt(1000), BigInt(1000)],
        rates: [BigInt('1000000000000000000'), BigInt('1000000000000000000'), BigInt('1000000000000000000')]
      },
      testArgs: {
        i: 0n,
        j: 1n,
        x: BigInt(1000),
        xp: [BigInt(1000), BigInt(1000), BigInt(1000)] as [bigint, bigint, bigint]
      },
      inputAssets: [
        {
          address: testAddress,
          asset: { alphAmount: 10n ** 18n }
        }
      ]
    }
  })

  it('should fail for invalid indices', async () => {
    // Test i = j
    const sameIndexParams = {
      ...testParamsFixture,
      testArgs: {
        i: 1n,
        j: 1n,
        x: BigInt(1000),
        xp: [BigInt(1000), BigInt(1000), BigInt(1000)] as [bigint, bigint, bigint]
      }
    }
    await expectAssertionError(StableSwap.tests.getY(sameIndexParams), testContractAddress, 1)

    // Test j >= N_COINS
    const invalidJParams = {
      ...testParamsFixture,
      testArgs: {
        i: 0n,
        j: 3n,
        x: BigInt(1000),
        xp: [BigInt(1000), BigInt(1000), BigInt(1000)] as [bigint, bigint, bigint]
      }
    }
    await expectAssertionError(StableSwap.tests.getY(invalidJParams), testContractAddress, 1)

    // Test i >= N_COINS
    const invalidIParams = {
      ...testParamsFixture,
      testArgs: {
        i: 3n,
        j: 1n,
        x: BigInt(1000),
        xp: [BigInt(1000), BigInt(1000), BigInt(1000)] as [bigint, bigint, bigint]
      }
    }
    await expectAssertionError(StableSwap.tests.getY(invalidIParams), testContractAddress, 1)
  })

  it('should calculate y correctly for balanced pool', async () => {
    const testParams = {
      ...testParamsFixture,
      testArgs: {
        i: 0n,
        j: 1n,
        x: BigInt(1100), // Adding 100 to pool i
        xp: [BigInt(1000), BigInt(1000), BigInt(1000)] as [bigint, bigint, bigint]
      }
    }

    const result = await StableSwap.tests.getY(testParams)
    // For a balanced pool with equal rates, adding to one side should result in slightly less than 1:1 output
    // due to the invariant curve
    expect(result.returns).toBeLessThan(BigInt(1000))
    expect(result.returns).toBeGreaterThanOrEqual(BigInt(900)) // Should not lose more than 10% to slippage
  })

  it('should handle different pool depths', async () => {
    // Test with deeper liquidity
    const deepPoolParams = {
      ...testParamsFixture,
      testArgs: {
        i: 0n,
        j: 1n,
        x: BigInt(11000), // Same 10% increase but with more liquidity
        xp: [BigInt(10000), BigInt(10000), BigInt(10000)] as [bigint, bigint, bigint]
      }
    }
    const deepResult = await StableSwap.tests.getY(deepPoolParams)

    // Test with shallow liquidity
    const shallowPoolParams = {
      ...testParamsFixture,
      testArgs: {
        i: 0n,
        j: 1n,
        x: BigInt(110), // Same 10% increase but with less liquidity
        xp: [BigInt(100), BigInt(100), BigInt(100)] as [bigint, bigint, bigint]
      }
    }
    const shallowResult = await StableSwap.tests.getY(shallowPoolParams)

    // Deeper pools should have less slippage for the same relative trade size
    const deepSlippage = ((BigInt(10000) - deepResult.returns) * BigInt(100)) / BigInt(10000)
    const shallowSlippage = ((BigInt(100) - shallowResult.returns) * BigInt(100)) / BigInt(100)
    expect(deepSlippage).toBeLessThanOrEqual(shallowSlippage)
  })

  it('should handle imbalanced pools correctly', async () => {
    const testParams = {
      ...testParamsFixture,
      testArgs: {
        i: 0n,
        j: 1n,
        x: BigInt(1500), // Adding to the already larger side
        xp: [BigInt(1000), BigInt(500), BigInt(1000)] as [bigint, bigint, bigint] // Imbalanced pool
      }
    }

    const result = await StableSwap.tests.getY(testParams)
    // Adding to the larger side should result in higher slippage
    expect(result.returns).toBeLessThan(BigInt(450)) // Should get less than 90% of remaining balance
  })

  it('should maintain price stability for small trades', async () => {
    const smallTradeParams = {
      ...testParamsFixture,
      testArgs: {
        i: 0n,
        j: 1n,
        x: BigInt(1010), // Only 1% increase
        xp: [BigInt(1000), BigInt(1000), BigInt(1000)] as [bigint, bigint, bigint]
      }
    }

    const result = await StableSwap.tests.getY(smallTradeParams)
    // For very small trades, output should be very close to input amount
    const slippage = ((BigInt(1000) - result.returns) * BigInt(100)) / BigInt(1000)
    expect(slippage).toBeLessThan(BigInt(2)) // Less than 2% slippage for 1% trade
  })

  it('should converge within iteration limit', async () => {
    // Test with extreme values that still should converge
    const extremeParams = {
      ...testParamsFixture,
      testArgs: {
        i: 0n,
        j: 1n,
        x: BigInt(2000), // Large change
        xp: [BigInt(1000), BigInt(1000), BigInt(1000)] as [bigint, bigint, bigint]
      }
    }

    const result = await StableSwap.tests.getY(extremeParams)
    // Verify we get a non-zero result (indicates convergence)
    expect(result.returns).toBeGreaterThan(BigInt(0))
  })
})
