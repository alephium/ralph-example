import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { OldCode, NewCode, OldGet, NewGet, NewSet, MigrateWithFields } from '../artifacts/ts'
import { testNodeWallet } from '@alephium/web3-test'

const migrateWithoutFields: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  const initialN = network.settings.initialN
  const deploy = await deployer.deployContract(OldCode, {
    initialFields: { n: initialN }
  })
  console.log('Old contract id: ' + deploy.contractInstance.contractId)
  console.log('Old contract address: ' + deploy.contractInstance.address)

  const signer = await testNodeWallet()
  await OldGet.execute(signer, {
    initialFields: { contract: deploy.contractInstance.contractId, expected: initialN }
  })
  const newN = 200n
  await MigrateWithFields.execute(signer, {
    initialFields: { contract: deploy.contractInstance.contractId, newCode: NewCode.contract.bytecode, newN: newN }
  })
  await NewGet.execute(signer, {
    initialFields: { contract: deploy.contractInstance.contractId, expected: newN }
  })
  await NewSet.execute(signer, {
    initialFields: { contract: deploy.contractInstance.contractId, newN: newN + 1n }
  })
  await NewGet.execute(signer, {
    initialFields: { contract: deploy.contractInstance.contractId, expected: newN + 1n }
  })
}

export default migrateWithoutFields
