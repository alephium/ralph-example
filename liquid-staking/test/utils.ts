import { web3, Project, ONE_ALPH } from '@alephium/web3'
import { RewardSystem } from '../artifacts/ts'
import { PrivateKeyWallet } from '@alephium/web3-wallet'

export const PRECISION = 1_000_000_000_000_000_000n // 1e18
export const DAY = 86400 // seconds

export async function deployRewardSystem(
  owner: string,
  tokenId: string,
  rewardTokenId: string
): Promise<RewardSystem> {
  return RewardSystem.deploy(web3.getCurrentNodeProvider(), {
    initialFields: {
      tokenId,
      rewardTokenId,
      baseRewardRate: 100n,
      poolPerformanceMultiplier: PRECISION,
      owner
    }
  })
}

export async function advanceTime(seconds: number): Promise<void> {
  await web3.getCurrentNodeProvider().debug.advanceBlockTimeStamp(seconds)
}

export async function getTimeMultiplier(
  stakingDuration: bigint,
  precision: bigint = PRECISION
): Promise<bigint> {
  if (stakingDuration >= BigInt(30 * DAY)) {
    return precision + precision / 10n // 1.1x
  } else if (stakingDuration >= BigInt(7 * DAY)) {
    return precision + precision / 20n // 1.05x
  }
  return precision
}

export async function calculateExpectedReward(
  stakedAmount: bigint,
  duration: bigint,
  baseRate: bigint = 100n,
  performanceMultiplier: bigint = PRECISION
): Promise<bigint> {
  const timeMultiplier = await getTimeMultiplier(duration)
  const baseReward = (stakedAmount * duration * baseRate) / PRECISION
  const poolAdjusted = (baseReward * performanceMultiplier) / PRECISION
  return (poolAdjusted * timeMultiplier) / PRECISION
}

export function expectEvent(
  result: any,
  eventName: string,
  args?: Record<string, any>
): void {
  const event = result.events?.find((e: any) => e.name === eventName)
  expect(event).toBeDefined()
  if (args) {
    expect(event.args).toMatchObject(args)
  }
}

export async function expectRevert(
  promise: Promise<any>,
  errorMessage: string | RegExp
): Promise<void> {
  try {
    await promise
    throw new Error('Expected promise to revert')
  } catch (error: any) {
    if (errorMessage instanceof RegExp) {
      expect(error.message).toMatch(errorMessage)
    } else {
      expect(error.message).toContain(errorMessage)
    }
  }
}