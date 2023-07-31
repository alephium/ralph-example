import { Deployer, DeployFunction } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { Bidder } from '../artifacts/ts'
import { ZERO_ADDRESS } from '@alephium/web3'

const deployTemplate: DeployFunction<Settings> = async (deployer: Deployer): Promise<void> => {
  await deployer.deployContract(Bidder, {
    initialFields: {
      auction: '',
      address: ZERO_ADDRESS,
      bidAmount: 0n
    }
  })
}

export default deployTemplate
