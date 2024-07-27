import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Token } from '../artifacts/ts'

const deployTokenTemplate: DeployFunction<undefined> = async (
  deployer: Deployer,
): Promise<void> => {
  const result = await deployer.deployContract(Token, {
    initialFields: {
      symbol: '',
      name: '',
      decimals: 0n,
      totalSupply: 0n,
    }
  })
  console.log('Token template id: ' + result.contractInstance.contractId)
}

export default deployTokenTemplate
