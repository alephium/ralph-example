import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { RandomValueFetcher } from '../artifacts/ts'

const deployRandomValueFetcher: DeployFunction<Settings> = async (deployer: Deployer, network: Network<Settings>): Promise<void> => {
  const result = await deployer.deployContract(RandomValueFetcher, { initialFields: {
    oracle: network.settings.vrfOracleAddress,
    lastRound: 0n,
    value: {
      randomness: '',
      signature: '',
      previousSignature: ''
    }
  }})
  console.log(`RandomValueFetcher contract address: ${result.contractInstance.address}, contract id: ${result.contractInstance.contractId}`)
}

export default deployRandomValueFetcher