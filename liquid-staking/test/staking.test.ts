import {
  ALPH_TOKEN_ID,
  Address,
  ONE_ALPH,
  addressFromContractId,
  groupOfAddress,
  sleep,
  subContractId
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
  updateStartTime
} from './utils'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import { testAddress } from '@alephium/web3-test'
import * as base58 from 'bs58'

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
