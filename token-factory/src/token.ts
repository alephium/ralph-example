import { Deployments } from '@alephium/cli'
import { web3, stringToHex, ONE_ALPH, MINIMAL_CONTRACT_DEPOSIT, DUST_AMOUNT, subContractId, addressFromContractId } from '@alephium/web3'
import { testNodeWallet } from '@alephium/web3-test'
import configuration from '../alephium.config'
import { TokenFactory } from '../artifacts/ts'

async function createToken() {
  web3.setCurrentNodeProvider('http://127.0.0.1:22973')

  // Attention: test wallet is used for demonstration purpose
  const signer = await testNodeWallet()

  console.log(`Balances: ${(await signer.nodeProvider.addresses.getAddressesAddressBalance((await signer.getSelectedAccount()).address)).balance}`)

  const deployments = await Deployments.load(configuration, 'devnet')
  const factory = deployments.getInstance(TokenFactory)
  if (factory === undefined) {
    console.log(`The contract is not deployed`)
    return
  }

  console.log(`Creating token...`, (await signer.getSelectedAccount()).address, factory.address)
  const result = await factory.transact.createToken({
    signer: signer,
    attoAlphAmount: MINIMAL_CONTRACT_DEPOSIT + DUST_AMOUNT, // 0.1 ALPH for the minimum storage deposit for the new token, 0.001 ALPH for the dust amount of the token output
    args: {
      symbol: stringToHex('TT'),
      name: stringToHex('Test Token'),
      decimals: 18n,
      totalSupply: 10n ** 9n * 10n ** 18n, // 1 billion
    },
  })
  console.log(`Token created by transaction: ${result.txId}`)

  const tokenId = subContractId(factory.contractId, stringToHex('TT'), (await signer.getSelectedAccount()).group)
  const tokenMetadata = await web3.getCurrentNodeProvider().fetchFungibleTokenMetaData(tokenId)
  console.log(`Token address: ${tokenId}, metadata: ${JSON.stringify(tokenMetadata)}`)
}

createToken()
