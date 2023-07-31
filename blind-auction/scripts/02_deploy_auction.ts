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

  const blindedBidTemplate = deployer.getDeployContractResult('BlindedBid')
  const bidderTemplate = deployer.getDeployContractResult('Bidder')
  const settings = network.settings
  const auction = await deployer.deployContract(Auction, {
    initialFields: {
      blindedBidTemplateId: blindedBidTemplate.contractInstance.contractId,
      bidderTemplateId: bidderTemplate.contractInstance.contractId,
      auctioneer: settings.auctioneer,
      beneficiaryAsset: settings.beneficiaryAsset,
      beneficiaryAssetAmount: settings.beneficiaryAssetAmount,
      biddingEnd: BigInt(settings.biddingEnd),
      revealEnd: BigInt(settings.revealEnd),
      highestBidder: ZERO_ADDRESS,
      highestBid: 0n,
      ended: false
    },
    initialTokenAmounts: [{ id: settings.beneficiaryAsset, amount: settings.beneficiaryAssetAmount }]
  })

  console.log(`Auction contract id: ${auction.contractInstance.contractId}`)
  console.log(`Auction contract address: ${auction.contractInstance.address}`)
}

export default deployAuction
