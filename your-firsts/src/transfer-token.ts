import { web3, DUST_AMOUNT } from '@alephium/web3'
import { getSigners } from '@alephium/web3-test'
import { createFungibleToken } from './create-fungible-token'

async function transferToken() {
  web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)

  const [sender, receiver] = await getSigners(2)
  const tokenId = await createFungibleToken(sender.address)

  // Transfer token from sender to receiver
  await sender.signAndSubmitTransferTx({
    signerAddress: sender.address,
    destinations: [
      { address: receiver.address, attoAlphAmount: DUST_AMOUNT, tokens: [{ id: tokenId, amount: 10n }] }
    ]
  })

  const { tokenBalances } = await web3.getCurrentNodeProvider().addresses.getAddressesAddressBalance(receiver.address)
  console.log(`token balance for receiver ${receiver.address}`, tokenBalances)
}

transferToken()