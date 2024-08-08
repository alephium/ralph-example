import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { PriceFetcher } from '../artifacts/ts/PriceFetcher'

const deployPriceFetcher: DeployFunction<Settings> = async (deployer: Deployer, network: Network<Settings>): Promise<void> => {
  const result = await deployer.deployContract(PriceFetcher, { initialFields: {
    oracle: network.settings.assetOracleAddress,
    btcPrice: 0n,
    ethPrice: 0n,
    usdcPrice: 0n,
    alphPrice: 0n,
    ayinPrice: 0n
  }})
  console.log(`PriceFetcher contract address: ${result.contractInstance.address}, contract id: ${result.contractInstance.contractId}`)
}

export default deployPriceFetcher
