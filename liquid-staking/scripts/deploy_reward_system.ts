import { Deployer } from '@alephium/cli'
import { Settings } from '../alephium.config'

const deployRewardSystem: DeployFunction<Settings> = async (deployer: Deployer) => {
    // Deploy reward system
    const rewardSystem = await deployer.deployContract('RewardSystem', {
        initialFields: {
            tokenId: stakingToken.contractId,
            rewardTokenId: rewardToken.contractId,
            baseRewardRate: 1000000000000n, // 0.0001 per second
            poolPerformanceMultiplier: 1000000000000000000n // 1.0
        }
    })
}

export default deployRewardSystem 