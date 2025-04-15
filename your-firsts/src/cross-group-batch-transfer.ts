import { web3, ONE_ALPH } from '@alephium/web3'
import { getSigner, getSigners } from '@alephium/web3-test'

async function crossGroupBatchTransfer() {
  web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
  const nodeProvider = web3.getCurrentNodeProvider()

  const sender = await getSigner(1000n * ONE_ALPH)

  const receiversGroup0 = await getSigners(10, 0n, 0)
  const receiversGroup1 = await getSigners(10, 0n, 1)
  const allReceivers = receiversGroup0.concat(receiversGroup1)

  const txs = await nodeProvider.transactions.postTransactionsBuildTransferFromOneToManyGroups({
      fromPublicKey: sender.publicKey,
      destinations: allReceivers.map((receiver) => ({
        address: receiver.address,
        attoAlphAmount: (10n * ONE_ALPH).toString()
      }))
  })

  for (const tx of txs) {
    await sender.signAndSubmitUnsignedTx({ signerAddress: sender.address, unsignedTx: tx.unsignedTx })
  }

  for (const receiver of allReceivers) {
    const balance = await nodeProvider.addresses.getAddressesAddressBalance(receiver.address)
    console.assert(BigInt(balance.balance) === 10n * ONE_ALPH)
  }
}

crossGroupBatchTransfer()