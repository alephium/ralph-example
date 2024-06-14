import { web3, ONE_ALPH } from '@alephium/web3'
import { getSigners } from '@alephium/web3-test'

async function transferAlph() {
  web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
  const nodeProvider = web3.getCurrentNodeProvider()

  const [sender, receiver] = await getSigners(2)
  const { balance: receiverBalanceBefore } = await nodeProvider.addresses.getAddressesAddressBalance(receiver.address)

  // Transfer ALPH from sender to receiver
  await sender.signAndSubmitTransferTx({
    signerAddress: sender.address,
    destinations: [{ address: receiver.address, attoAlphAmount: 10n * ONE_ALPH }]
  })

  const { balance: receiverBalanceAfter } = await nodeProvider.addresses.getAddressesAddressBalance(receiver.address)

  console.log(`receiver balance before: ${receiverBalanceBefore}, after: ${receiverBalanceAfter}`)
}

transferAlph()