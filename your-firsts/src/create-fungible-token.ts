import { web3 } from '@alephium/web3'
import { testNodeWallet } from '@alephium/web3-test'
import { ShinyToken } from '../artifacts/ts'

export async function createFungibleToken(issueTokenTo?: string): Promise<string> {
  web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
  const signer = await testNodeWallet()
  const issueTokenAmount = 10000n
  // Deoloy `ShinyToken` contract and issue `10000` shiny tokens to `issueTokenTo` address.
  const shinyToken = await ShinyToken.deploy(signer, {
    initialFields: {},
    issueTokenAmount,
    issueTokenTo
  })

  return shinyToken.contractInstance.contractId
}
