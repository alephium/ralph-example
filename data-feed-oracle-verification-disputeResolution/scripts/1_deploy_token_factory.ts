//referenced from token-factory/scripts/1_deploy_token_factory.ts
import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { TokenFactory } from '../artifacts/ts'

const deployTokenFactory: DeployFunction<undefined> = async (
  deployer: Deployer,
): Promise<void> => {
  const tokenTemplate = deployer.getDeployContractResult('Token')
  const result = await deployer.deployContract(TokenFactory, {
    initialFields: {
      tokenTemplate: tokenTemplate.contractInstance.contractId
    }
  })
  console.log('Token template id: ' + result.contractInstance.contractId)
}

export default deployTokenFactory
