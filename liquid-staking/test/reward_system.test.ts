import { web3, Project } from '@alephium/web3'
import { RewardSystem } from '../artifacts/ts'
import { deployRewardSystem, stake, advanceTime } from './utils'

const DAY = 86400 // seconds
const PRECISION = 1_000_000_000_000_000_000n // 1e18

describe('RewardSystem', () => {
    let rewardSystem: RewardSystem
    let staker: string
    let staker2: string

    beforeEach(async () => {
        await Project.build()
        const deployment = await deployRewardSystem()
        rewardSystem = deployment.contractInstance
        staker = web3.randomAddress()
        staker2 = web3.randomAddress()
    })

    describe('Reward Calculation', () => {
        it('should calculate base rewards correctly', async () => {
            const amount = 100n * PRECISION
            await stake(rewardSystem, staker, amount)
            await advanceTime(DAY)

            const rewards = await rewardSystem.methods.calculateRewards(staker)
            expect(rewards).toEqual(amount * 100n) // baseRate = 100
        })

        it('should apply time-weighted multipliers', async () => {
            const amount = 100n * PRECISION
            await stake(rewardSystem, staker, amount)

            // Check 7-day multiplier
            await advanceTime(8 * DAY)
            const rewards7Days = await rewardSystem.methods.calculateRewards(staker)

            // Check 30-day multiplier
            await advanceTime(23 * DAY)
            const rewards30Days = await rewardSystem.methods.calculateRewards(staker)

            expect(rewards30Days).toBeGreaterThan(rewards7Days * 3n)
        })

        it('should handle pool performance adjustments', async () => {
            const amount = 100n * PRECISION
            await stake(rewardSystem, staker, amount)

            await rewardSystem.methods.updatePoolPerformance(PRECISION * 15n / 10n) // 1.5x
            await advanceTime(DAY)

            const rewards = await rewardSystem.methods.calculateRewards(staker)
            expect(rewards).toEqual(amount * 150n) // baseRate * 1.5
        })
    })

    describe('Compounding', () => {
        it('should compound rewards correctly', async () => {
            const initialStake = 100n * PRECISION
            await stake(rewardSystem, staker, initialStake)
            await advanceTime(DAY)

            const beforeCompound = await rewardSystem.methods.getStakerInfo(staker)
            await rewardSystem.methods.compoundRewards()
            const afterCompound = await rewardSystem.methods.getStakerInfo(staker)

            expect(afterCompound.stakedAmount).toBeGreaterThan(beforeCompound.stakedAmount)
            expect(afterCompound.pendingRewards).toBe(0n)
        })

        it('should handle multiple compound operations', async () => {
            const initialStake = 100n * PRECISION
            await stake(rewardSystem, staker, initialStake)

            let currentStake = initialStake
            for (let i = 0; i < 3; i++) {
                await advanceTime(7 * DAY)
                await rewardSystem.methods.compoundRewards()
                const info = await rewardSystem.methods.getStakerInfo(staker)
                expect(info.stakedAmount).toBeGreaterThan(currentStake)
                currentStake = info.stakedAmount
            }
        })

        it('should apply time multiplier to compounded amount', async () => {
            const initialStake = 100n * PRECISION
            await stake(rewardSystem, staker, initialStake)

            // Wait for 30 days to get 1.1x multiplier
            await advanceTime(30 * DAY)
            await rewardSystem.methods.compoundRewards()

            const info = await rewardSystem.methods.getStakerInfo(staker)
            const expectedBase = initialStake * 100n * BigInt(30 * DAY) / PRECISION // base reward
            const expectedWithMultiplier = (expectedBase * 11n) / 10n // 1.1x multiplier
            expect(info.stakedAmount - initialStake).toBeGreaterThanOrEqual(expectedWithMultiplier)
        })
    })

    describe('Distribution', () => {
        it('should distribute rewards fairly', async () => {
            // Stake same amount for two stakers
            const stakeAmount = 100n * PRECISION
            await stake(rewardSystem, staker, stakeAmount)
            await stake(rewardSystem, staker2, stakeAmount)

            await advanceTime(DAY)

            const rewards1 = await rewardSystem.methods.calculateRewards(staker)
            const rewards2 = await rewardSystem.methods.calculateRewards(staker2)

            // Should be equal since same stake amount and duration
            expect(rewards1).toEqual(rewards2)
        })

        it('should handle multiple stakers with different amounts', async () => {
            await stake(rewardSystem, staker, 100n * PRECISION)
            await stake(rewardSystem, staker2, 200n * PRECISION)

            await advanceTime(DAY)

            const rewards1 = await rewardSystem.methods.calculateRewards(staker)
            const rewards2 = await rewardSystem.methods.calculateRewards(staker2)

            // Second staker should get double rewards
            expect(rewards2).toEqual(rewards1 * 2n)
        })

        it('should handle claims correctly', async () => {
            await stake(rewardSystem, staker, 100n * PRECISION)
            await advanceTime(DAY)

            const beforeBalance = await web3.getCurrentNodeProvider().addresses.getAddressBalance(staker)
            const expectedRewards = await rewardSystem.methods.calculateRewards(staker)

            await rewardSystem.methods.claimRewards()

            const afterBalance = await web3.getCurrentNodeProvider().addresses.getAddressBalance(staker)
            expect(afterBalance.tokenBalances[rewardSystem.rewardTokenId]).toEqual(expectedRewards)
        })
    })

    describe('Edge Cases', () => {
        it('should handle zero staking amount', async () => {
            await expect(stake(rewardSystem, staker, 0n)).rejects.toThrow()
        })

        it('should prevent claiming with no rewards', async () => {
            await stake(rewardSystem, staker, 100n * PRECISION)
            await rewardSystem.methods.claimRewards()
            await expect(rewardSystem.methods.claimRewards()).rejects.toThrow(/NoRewardsToClaim/)
        })

        it('should handle maximum performance multiplier', async () => {
            const maxMultiplier = PRECISION * 10n // 10x
            await rewardSystem.methods.updatePoolPerformance(maxMultiplier)

            await stake(rewardSystem, staker, 100n * PRECISION)
            await advanceTime(DAY)

            const rewards = await rewardSystem.methods.calculateRewards(staker)
            expect(rewards).not.toBe(0n)
        })

        it('should prevent invalid performance multiplier', async () => {
            await expect(rewardSystem.methods.updatePoolPerformance(0n))
                .rejects.toThrow(/InvalidMultiplier/)
        })
    })

    describe('Access Control', () => {
        it('should only allow owner to update performance multiplier', async () => {
            const nonOwner = web3.randomAddress()
            await expect(
                rewardSystem.methods.updatePoolPerformance(PRECISION * 2n, { sender: nonOwner })
            ).rejects.toThrow()
        })

        it('should only allow staker to compound their own rewards', async () => {
            await stake(rewardSystem, staker, 100n * PRECISION)
            await advanceTime(DAY)

            await expect(
                rewardSystem.methods.compoundRewards({ sender: staker2 })
            ).rejects.toThrow()
        })
    })
}) 