import {
  web3,
  Project,
  addressFromContractId,
  AssetOutput,
  DUST_AMOUNT,
  ONE_ALPH,
} from '@alephium/web3'
import { randomContractId, testAddress, mintToken, getSigner } from '@alephium/web3-test'
import { deployToDevnet } from '@alephium/cli'
import { BurnToken } from '../artifacts/ts'

web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
const nodeProvider = web3.getCurrentNodeProvider()

describe('integration tests', () => {
  beforeAll(async () => {
    await Project.build()
  })

  it('should burn tokens on devnet', async () => {
    const signer = await getSigner(ONE_ALPH * 100n, 0)
    const { contractId: tokenId } = await mintToken(signer.address, 100n)

    const balanceBefore = (await nodeProvider.addresses.getAddressesAddressUtxos(signer.address)).utxos
    console.log('balanceBefore', JSON.stringify(balanceBefore))
    expect(balanceBefore.length).toBe(2)
    expect(balanceBefore.some((utxo) => utxo.tokens?.length == 1)).toBe(true)
    await BurnToken.execute(signer, {
      initialFields: { tokenId, amount: 100n },
      tokens: [{ id: tokenId, amount: 100n }]
    })
    const balanceAfter = (await nodeProvider.addresses.getAddressesAddressUtxos(signer.address)).utxos
    console.log('balanceAfter', JSON.stringify(balanceAfter))
    expect(balanceAfter.length).toBe(2)
    expect(balanceAfter.every((utxo) => utxo.tokens === undefined)).toBe(true)
  }, 20000)
})
