import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { Auction } from '../artifacts/ts'
import { ZERO_ADDRESS } from '@alephium/web3'

const deployAuction: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  if (network.settings === undefined) {
    throw new Error('No settings specified')
  }

  const settings = network.settings
  const auction = await deployer.deployContract(Auction, {
    initialFields: {
      beneficiary: settings.beneficiary,
      biddingEnd: BigInt(settings.biddingEnd),
      revealEnd: BigInt(settings.revealEnd),
      highestBidder: ZERO_ADDRESS,
      highestBid: 0n,
      ended: false
    }
  })

  console.log(`Auction contract id: ${auction.contractInstance.contractId}`)
  console.log(`Auction contract address: ${auction.contractInstance.address}`)
}

export default deployAuction
