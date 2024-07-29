import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { Airdrop } from '../artifacts/ts'
import { ONE_ALPH } from '@alephium/web3'

// This deploy function will be called by cli deployment tool automatically
// Note that deployment scripts should prefixed with numbers (starting from 0)
const deployAirdrop: DeployFunction<Settings> = async (deployer: Deployer, network: Network<Settings>): Promise<void> => {
  const result = await deployer.deployContract(Airdrop, {
    initialFields: {},
    initialAttoAlphAmount: ONE_ALPH
  })
  console.log('airdrop contract id: ' + result.contractInstance.contractId)
  console.log('airdrop contract address: ' + result.contractInstance.address)
}

export default deployAirdrop