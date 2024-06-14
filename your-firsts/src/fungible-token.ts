import { web3 } from '@alephium/web3'
import { testNodeWallet } from '@alephium/web3-test'
import { createFungibleToken } from './create-fungible-token'

async function fungibleToken() {
  web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
  const signer = await testNodeWallet()
  const signerAddress = (await signer.getSelectedAccount()).address

  const tokenId = await createFungibleToken(signerAddress)

  const signerBalance = await web3.getCurrentNodeProvider().addresses.getAddressesAddressBalance(signerAddress)
  const signerShinyTokenBalance = signerBalance.tokenBalances!.find((token) => token.id === tokenId)
  console.log(`token issued to ${signerAddress}`, signerShinyTokenBalance)
}

fungibleToken()
