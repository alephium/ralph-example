import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { LockAssets } from '../artifacts/ts'

const deployContract: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  const result = await deployer.deployContract(LockAssets, {
    initialFields: {}
  })
  console.log('Contract address: ' + result.contractInstance.address)
}

export default deployContract
