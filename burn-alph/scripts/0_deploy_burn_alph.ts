import { Deployer, DeployFunction } from '@alephium/cli'
import { BurnALPH } from '../artifacts/ts'

const deployBurnALPH: DeployFunction = async (deployer: Deployer): Promise<void> => {
  const result = await deployer.deployContract(
    BurnALPH,
    { initialFields: {} }
  )
  console.log('BurnALPH contract address: ' + result.contractInstance.address)
  console.log('BurnALPH contract id: ' + result.contractInstance.contractId)
}

export default deployBurnALPH
