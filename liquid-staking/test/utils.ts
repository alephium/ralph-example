import {
  web3,
  Project,
  Contract,
  ONE_ALPH,
  DUST_AMOUNT,
  contractIdFromAddress,
  addressFromContractId,
  binToHex,
  hexToBinUnsafe
} from '@alephium/web3'
import { RewardSystem } from '../artifacts/ts'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import { TestToken } from '../artifacts/ts'

export const ZERO_ADDRESS = '1111111111111111111111111111111111111111111111111111'

// Helper to deploy test tokens
export async function deployTestToken(
  initialSupply: bigint,
  decimals: number = 18
): Promise<TestToken> {
  const testToken = await TestToken.deploy(web3.getCurrentNodeProvider(), {
    initialFields: {
      symbol: binToHex(Buffer.from('TEST')),
      name: binToHex(Buffer.from('Test Token')),
      decimals: BigInt(decimals),
      totalSupply: initialSupply,
      owner: ZERO_ADDRESS
    }
  })
  return testToken
}

// Deploy reward system with test tokens
export async function deployRewardSystem(): Promise<{
  contractInstance: RewardSystem,
  stakingToken: TestToken,
  rewardToken: TestToken
}> {
  // Deploy test tokens
  const stakingToken = await deployTestToken(1000000n * ONE_ALPH)
  const rewardToken = await deployTestToken(1000000n * ONE_ALPH)

  // Deploy reward system
  const rewardSystem = await RewardSystem.deploy(web3.getCurrentNodeProvider(), {
    initialFields: {
      tokenId: contractIdFromAddress(stakingToken.address),
      rewardTokenId: contractIdFromAddress(rewardToken.address),
      baseRewardRate: 100n, // 100 tokens per second
      poolPerformanceMultiplier: 1000000000000000000n // 1.0 (18 decimals)
    }
  })

  // Fund reward system with reward tokens
  await rewardToken.methods.transfer({
    args: {
      to: rewardSystem.address,
      amount: 1000000n * ONE_ALPH
    }
  })

  return {
    contractInstance: rewardSystem,
    stakingToken,
    rewardToken
  }
}

// Helper to stake tokens
export async function stake(
  rewardSystem: RewardSystem,
  staker: string,
  amount: bigint
): Promise<void> {
  await rewardSystem.methods.stake({
    args: { amount },
    initialFields: { sender: staker }
  })
}

// Helper to advance blockchain time
export async function advanceTime(seconds: number): Promise<void> {
  await web3.getCurrentNodeProvider().debug.advanceBlockTimeStamp(seconds)
}

// Helper to get token balance
export async function getTokenBalance(
  tokenId: string,
  address: string
): Promise<bigint> {
  const balance = await web3.getCurrentNodeProvider().addresses.getAddressBalance(address)
  const tokenBalance = balance.tokenBalances?.find(t => t.id === tokenId)
  return tokenBalance ? BigInt(tokenBalance.amount) : 0n
}

// Helper to fund address with tokens
export async function fundAddress(
  token: TestToken,
  address: string,
  amount: bigint
): Promise<void> {
  await token.methods.transfer({
    args: {
      to: address,
      amount
    }
  })
}

// Helper to calculate expected rewards
export async function calculateExpectedReward(
  stakedAmount: bigint,
  duration: number,
  baseRate: bigint = 100n,
  multiplier: bigint = 1000000000000000000n // 1.0
): Promise<bigint> {
  const PRECISION = 1000000000000000000n // 1e18
  return (stakedAmount * BigInt(duration) * baseRate * multiplier) / (PRECISION * PRECISION)
}

// Helper to get staker info
export async function getStakerInfo(
  rewardSystem: RewardSystem,
  staker: string
): Promise<{
  stakedAmount: bigint
  stakingStartTime: bigint
  lastUpdateTime: bigint
  pendingRewards: bigint
}> {
  return await rewardSystem.methods.getStakerInfo(staker)
}

// Helper to check events
export function expectEvent(
  result: any,
  eventName: string,
  args?: any
): void {
  const event = result.events?.find((e: any) => e.name === eventName)
  expect(event).toBeDefined()
  if (args) {
    expect(event.args).toMatchObject(args)
  }
}

// Helper to expect revert
export async function expectRevert(
  promise: Promise<any>,
  errorMessage: string | RegExp
): Promise<void> {
  try {
    await promise
    throw new Error('Expected promise to revert')
  } catch (error) {
    if (errorMessage instanceof RegExp) {
      expect(error.message).toMatch(errorMessage)
    } else {
      expect(error.message).toContain(errorMessage)
    }
  }
}