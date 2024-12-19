import {
  ALPH_TOKEN_ID,
  Address,
  ONE_ALPH,
  addressFromContractId,
  groupOfAddress,
  sleep,
  subContractId,
  web3
} from '@alephium/web3'
import { Staking, StakingInstance, StakingAccount } from '../artifacts/ts'
import {
  deployStaking,
  stake,
  stakeFailed,
  unstake,
  unstakeFailed,
  claimRewards,
  setRewardRate,
  setRewardRateFailed,
  balanceOf,
  randomP2PKHAddress,
  transferTokenTo,
  checkStakingAccount,
  transferAlphTo,
  alph,
  updateStartTime,
  calculateExpectedReward
} from './utils'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import { testAddress } from '@alephium/web3-test'
import * as base58 from 'bs58'

const DAY = 86400 // seconds in a day
const ONE_TOKEN = 10n ** 18n

// Helper function to advance blockchain time
async function advanceTime(seconds: number) {
  await web3.getCurrentNodeProvider().debug.advanceBlockTimeStamp(seconds)
}

describe('test staking', () => {
  const groupIndex = groupOfAddress(testAddress)
  const stakingDuration = 10 * 1000 // 10s
  const rewardRate = 100n // tokens per second
  const penaltyPercent = 10n // 10%

  let staking: StakingInstance
  let owner: Address
  let tokenId: string
  let rewardsTokenId: string
  let stakers: PrivateKeyWallet[]
  let ownerWallet: PrivateKeyWallet

  beforeEach(async () => {
    const startTime = Date.now() * 2000
    ownerWallet = PrivateKeyWallet.Random(groupIndex)
    owner = ownerWallet.address
    staking = (await deployStaking(
      owner,
      startTime,
      stakingDuration,
      penaltyPercent,
      rewardRate
    )).contractInstance

    const stakingState = await staking.fetchState()
    tokenId = stakingState.fields.tokenId
    rewardsTokenId = stakingState.fields.rewardsTokenId

    stakers = Array.from(Array(2).keys()).map((_) => PrivateKeyWallet.Random(groupIndex))
    // Setup initial token balances for stakers
    for (const staker of stakers) {
      await transferAlphTo(staker.address, alph(1000))
      await transferTokenTo(staker.address, tokenId, 1000n)
    }

    await transferAlphTo(owner, alph(1000))
    await transferTokenTo(owner, tokenId, 1000n)
  })

  async function checkTotalStaked(expectedAmount: bigint) {
    const state = await staking.fetchState()
    expect(state.fields.totalAmountStaked).toEqual(expectedAmount)
  }

  test('stake:failed scenarios', async () => {
    const [staker] = stakers

    // Test staking before pool starts
    await stakeFailed(
      staker,
      staking,
      100n,
      tokenId,
      Number(Staking.consts.ErrorCodes.PoolNotStarted)
    )
  })


  test('stake:successful staking', async () => {
    const [staker1, staker2] = stakers
    const stakeAmount = 100n

    await updateStartTime(staking, ownerWallet)

    // Test initial stake
    await stake(staker1, staking, stakeAmount, tokenId)
    // await checkStakingAccount(staking, staker1.address, stakeAmount)
    await checkTotalStaked(stakeAmount)

    // Test additional stake
    await stake(staker1, staking, stakeAmount, tokenId)
    // await checkStakingAccount(staking, staker1.address, stakeAmount * 2n)
    await checkTotalStaked(stakeAmount * 2n)

    // Test multiple stakers
    await stake(staker2, staking, stakeAmount, tokenId)
    // await checkStakingAccount(staking, staker2.address, stakeAmount)
    await checkTotalStaked(stakeAmount * 3n)
  })

  test('unstake:with penalty', async () => {
    const [staker] = stakers
    const stakeAmount = 100n
    await updateStartTime(staking, ownerWallet)

    await stake(staker, staking, stakeAmount, tokenId)
    await unstake(staker, staking, stakeAmount)

    const expectedPenalty = (stakeAmount * penaltyPercent) / 100n
    const finalBalance = await balanceOf(tokenId, staker.address)
    expect(finalBalance).toEqual(1000n - expectedPenalty) // Initial 1000n minus penalty
  })

  jest.setTimeout(30000)
  test('unstake:after duration', async () => {
    const [staker] = stakers
    const stakeAmount = 100n

    await updateStartTime(staking, ownerWallet)

    await stake(staker, staking, stakeAmount, tokenId)
    await sleep(stakingDuration + 1000)
    await unstake(staker, staking, stakeAmount)

    const finalBalance = await balanceOf(tokenId, staker.address)
    expect(finalBalance).toEqual(1000n) // Should get full amount back
  })

  test('rewards:accumulation and claiming', async () => {
    const [staker] = stakers
    const stakeAmount = 100n

    await updateStartTime(staking, ownerWallet)

    await stake(staker, staking, stakeAmount, tokenId)
    await sleep(3000) // Wait 3 seconds for rewards to accumulate

    const initialRewardsBalance = await balanceOf(rewardsTokenId, staker.address)
    await claimRewards(staker, staking)
    const finalRewardsBalance = await balanceOf(rewardsTokenId, staker.address)

    expect(finalRewardsBalance).toBeGreaterThan(initialRewardsBalance)
  })

  test('admin:reward rate update', async () => {
    const [nonOwner] = stakers
    const newRate = 200n

    // Non-owner should fail
    await setRewardRateFailed(nonOwner, staking, newRate)

    // Owner should succeed
    await setRewardRate(ownerWallet, staking, newRate)
    const state = await staking.fetchState()
    expect(state.fields.rewardRate).toEqual(newRate)
  })
})

describe('Staking with Compound Rewards', () => {
  let staking: StakingInstance
  let staker: PrivateKeyWallet
  let staker1: PrivateKeyWallet
  let staker2: PrivateKeyWallet
  let owner: Address
  let tokenId: string
  let rewardsTokenId: string

  beforeEach(async () => {
    const groupIndex = groupOfAddress(testAddress)
    const startTime = Date.now() * 2000
    const ownerWallet = PrivateKeyWallet.Random(groupIndex)
    owner = ownerWallet.address

    // Deploy contracts
    staking = (await deployStaking(
      owner,
      startTime,
      30 * DAY, // 30 days staking duration
      10n, // 10% penalty
      100n // base reward rate
    )).contractInstance

    // Setup stakers
    staker = PrivateKeyWallet.Random(groupIndex)
    staker1 = PrivateKeyWallet.Random(groupIndex)
    staker2 = PrivateKeyWallet.Random(groupIndex)

    // Initialize tokens
    const stakingState = await staking.fetchState()
    tokenId = stakingState.fields.tokenId
    rewardsTokenId = stakingState.fields.rewardsTokenId

    // Fund stakers
    for (const s of [staker, staker1, staker2]) {
      await transferAlphTo(s.address, alph(1000))
      await transferTokenTo(s.address, tokenId, 1000n * ONE_TOKEN)
    }

    // Start the pool
    await updateStartTime(staking, ownerWallet)
  })

  it('should compound rewards correctly', async () => {
    const initialStake = 100n * ONE_TOKEN
    await stake(staker, staking, initialStake, '30')

    // Advance time to accumulate rewards
    await advanceTime(30 * DAY)
    // Get initial balances
    const beforeStake = await staking.methods.getStakingAccount(staker.address)
    await staking.methods.compoundRewards()
    const afterStake = await staking.methods.getStakingAccount(staker.address)

    expect(afterStake.amountStaked).toBeGreaterThan(beforeStake.amountStaked)
    expect(afterStake.rewards).toBe(0n)
  })

  it('should handle multiple compound operations', async () => {
    const initialStake = 100n * ONE_TOKEN
    await stake(staker, staking, initialStake, '30')

    for (let i = 0; i < 3; i++) {
      await advanceTime(7 * DAY)
      await staking.methods.compoundRewards()
    }

    const finalStake = await staking.methods.getStakingAccount(staker.address)
    expect(finalStake.amountStaked).toBeGreaterThan(initialStake)
  })

  describe('Edge Cases', () => {
    it('should handle zero staking amount', async () => {
      await expect(stake(staker, staking, 0n)).rejects.toThrow()
    })

    it('should handle maximum staking amount', async () => {
      const maxAmount = 2n ** 256n - 1n
      await expect(stake(staker, staking, maxAmount)).rejects.toThrow()
    })

    it('should handle multiple stakers with different durations', async () => {
      // Staker 1: 30 days
      await stake(staker1, staking, 100n * ONE_TOKEN)
      await advanceTime(30 * DAY)

      // Staker 2: 7 days
      await stake(staker2, staking, 100n * ONE_TOKEN)
      await advanceTime(7 * DAY)

      const reward1 = await staking.methods.earned(staker1.address)
      const reward2 = await staking.methods.earned(staker2.address)

      // Staker 1 should have higher rewards due to longer duration
      expect(reward1).toBeGreaterThan(reward2)
    })
  })

  describe('Pool Performance', () => {
    it('should apply performance multiplier correctly', async () => {
      await stake(staker, staking, 100n * ONE_TOKEN)

      // Set multiplier to 1.5x
      await staking.methods.updatePoolPerformance(1_500_000_000_000_000_000n)
      await advanceTime(DAY)

      const baseReward = await calculateExpectedReward(100n * ONE_TOKEN, DAY)
      const actualReward = await staking.methods.earned(staker.address)

      expect(actualReward).toBe(baseReward * 15n / 10n)
    })

    it('should handle performance multiplier changes', async () => {
      await stake(staker, staking, 100n * ONE_TOKEN)

      // Change multiplier multiple times
      const multipliers = [1.2, 1.5, 0.8].map(m => BigInt(m * 1e18))
      for (const multiplier of multipliers) {
        await staking.methods.updatePoolPerformance(multiplier)
        await advanceTime(DAY)
      }

      const rewards = await staking.methods.earned(staker.address)
      expect(rewards).toBeGreaterThan(0n)
    })
  })
})
