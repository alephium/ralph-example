import { Deployer, DeployFunction } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { GetToken, TestToken } from '../artifacts/ts'
import { DUST_AMOUNT } from '@alephium/web3'

const deployBeneficiaryAsset: DeployFunction<Settings> = async (deployer: Deployer): Promise<void> => {
  const totalSupply = 100n
  const beneficiaryAsset = await deployer.deployContract(TestToken, {
    initialFields: { totalSupply },
    issueTokenAmount: totalSupply
  })
  console.log(`Beneficiary asset contract id: ${beneficiaryAsset.contractInstance.contractId}`)
  console.log(`Beneficiary asset contract address: ${beneficiaryAsset.contractInstance.address}`)
  console.log(`Beneficiary asset amount: ${totalSupply}`)

  await deployer.runScript(GetToken, {
    initialFields: {
      token: beneficiaryAsset.contractInstance.contractId,
      amount: totalSupply
    },
    attoAlphAmount: DUST_AMOUNT
  })
}

deployBeneficiaryAsset.skip = async (_, networkId) => networkId !== 'devnet'

export default deployBeneficiaryAsset
