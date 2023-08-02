import { Deployer, DeployFunction } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { Bidder, BlindedBid } from '../artifacts/ts'
import { ZERO_ADDRESS } from '@alephium/web3'

const deployTemplate: DeployFunction<Settings> = async (deployer: Deployer): Promise<void> => {
  await deployer.deployContract(BlindedBid, {
    initialFields: { bidder: '', data: '', deposit: 0n, revealed: false }
  })

  await deployer.deployContract(Bidder, {
    initialFields: {
      blindedBidTemplateId: '',
      auction: '',
      address: ZERO_ADDRESS,
      blindedBidSize: 0n
    }
  })
}

export default deployTemplate
