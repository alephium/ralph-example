import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { RandomnessFetcher } from '../artifacts/ts/RandomnessFetcher'

const deployRandomnessFetcher: DeployFunction<Settings> = async (deployer: Deployer, network: Network<Settings>): Promise<void> => {
  const result = await deployer.deployContract(RandomnessFetcher, { initialFields: {
    oracle: network.settings.randomnessOracleAddress,
    randomValue: { randomness: '', signature: '', round: 0n }
  }})
  console.log(`RandomnessFetcher contract address: ${result.contractInstance.address}, contract id: ${result.contractInstance.contractId}`)
}

export default deployRandomnessFetcher
