import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { TokenToBeLocked } from '../artifacts/ts'

const deployContract: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  const result = await deployer.deployContract(TokenToBeLocked, {
    initialFields: {}
  })
  console.log('TokenToBeLocked template id: ' + result.contractInstance.contractId)
}

export default deployContract
