import { web3, Project } from '@alephium/web3'
import { RewardSystem } from '../artifacts/ts'
import { deployRewardSystem, advanceTime, getTimeMultiplier, PRECISION, DAY } from './utils'

describe('RewardSystem', () => {
    let rewardSystem: RewardSystem
    let owner: string
    let staker: string
    let tokenId: string
    let rewardTokenId: string

    beforeEach(async () => {
        await Project.build()
        owner = web3.randomAddress()
        staker = web3.randomAddress()
        tokenId = web3.randomContractId()
        rewardTokenId = web3.randomContractId()
        rewardSystem = await deployRewardSystem(owner, tokenId, rewardTokenId)
    })

    describe('Staking', () => {
        it('should allow staking tokens', async () => {
            const amount = 100n * PRECISION
            await rewardSystem.methods.stake({ args: { amount }, initialFields: { sender: staker } })

            const info = await rewardSystem.methods.getStakerInfo(staker)
            expect(info.stakedAmount).toBe(amount)
        })

        it('should reject zero stake amount', async () => {
            await expect(
                rewardSystem.methods.stake({ args: { amount: 0n }, initialFields: { sender: staker } })
            ).rejects.toThrow(/InvalidAmount/)
        })
    })

    describe('Time Multipliers', () => {
        it('should apply correct multipliers based on staking duration', async () => {
            const amount = 100n * PRECISION
            await rewardSystem.methods.stake({ args: { amount }, initialFields: { sender: staker } })

            // Check 7-day multiplier
            await advanceTime(8 * DAY)
            const info7Days = await rewardSystem.methods.getStakerInfo(staker)
            const multiplier7Days = await getTimeMultiplier(BigInt(8 * DAY))
            expect(multiplier7Days).toBe(PRECISION + PRECISION / 20n)

            // Check 30-day multiplier
            await advanceTime(23 * DAY)
            const info30Days = await rewardSystem.methods.getStakerInfo(staker)
            const multiplier30Days = await getTimeMultiplier(BigInt(31 * DAY))
            expect(multiplier30Days).toBe(PRECISION + PRECISION / 10n)
        })
    })

    describe('Rewards', () => {
        it('should calculate rewards correctly', async () => {
            const amount = 100n * PRECISION
            await rewardSystem.methods.stake({ args: { amount }, initialFields: { sender: staker } })
            await advanceTime(DAY)

            await rewardSystem.methods.claimRewards({ initialFields: { sender: staker } })
            const info = await rewardSystem.methods.getStakerInfo(staker)
            expect(info.pendingRewards).toBe(0n)
        })

        it('should compound rewards', async () => {
            const amount = 100n * PRECISION
            await rewardSystem.methods.stake({ args: { amount }, initialFields: { sender: staker } })
            await advanceTime(DAY)

            const beforeInfo = await rewardSystem.methods.getStakerInfo(staker)
            await rewardSystem.methods.compoundRewards({ initialFields: { sender: staker } })
            const afterInfo = await rewardSystem.methods.getStakerInfo(staker)

            expect(afterInfo.stakedAmount).toBeGreaterThan(beforeInfo.stakedAmount)
        })
    })

    describe('Pool Performance', () => {
        it('should only allow owner to update multiplier', async () => {
            const newMultiplier = PRECISION * 2n
            await expect(
                rewardSystem.methods.updatePoolPerformance({
                    args: { newMultiplier },
                    initialFields: { sender: staker }
                })
            ).rejects.toThrow(/NotOwner/)

            await rewardSystem.methods.updatePoolPerformance({
                args: { newMultiplier },
                initialFields: { sender: owner }
            })
        })
    })
}) 