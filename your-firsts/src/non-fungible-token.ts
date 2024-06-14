import {
  DUST_AMOUNT,
  ONE_ALPH,
  binToHex,
  encodeU256,
  stringToHex,
  subContractId,
  web3,
} from '@alephium/web3'
import { testNodeWallet } from '@alephium/web3-test'
import { AwesomeNFT, AwesomeNFTCollection } from '../artifacts/ts'

async function nonFungibleToken() {
  web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
  const signer = await testNodeWallet()

  const { contractInstance: awesomeNFTTemplate } = await AwesomeNFT.deploy(
    signer,
    { initialFields: { collectionId: '', nftIndex: 0n, uri: '' } }
  )

  const { contractInstance: nftCollection } = await AwesomeNFTCollection.deploy(
    signer,
    {
      initialFields: {
        nftTemplateId: awesomeNFTTemplate.contractId,
        collectionUri: stringToHex('https://alephium-nft.infura-ipfs.io/ipfs/QmdobfsES5tx6tdgiyiXiC5pqwyd7WQRZ8gJcM3eMHenYJ'),
        totalSupply: 0n
      },
    }
  )

  const collectionMetadata = await web3.getCurrentNodeProvider().fetchNFTCollectionMetaData(nftCollection.contractId)
  console.log(`NFT Collection URI: ${collectionMetadata.collectionUri}, totalSupply: ${collectionMetadata.totalSupply}`)

  await nftCollection.transact.mint({
    signer,
    args: { nftUri: stringToHex('https://ipfs.io/ipfs/QmSeS5DQgu7Nwm5cmwhnPnRjGgA4YZYUoJJ1vRVwB3Z8iA/1') },
    attoAlphAmount: ONE_ALPH / 10n + DUST_AMOUNT
  })

  // The NFT index is `0` since this is the first NFT we minted, we can calculate its contract id like this:
  const nftContractId = subContractId(nftCollection.contractId, binToHex(encodeU256(0n)), 0)
  const nftMetadata = await web3.getCurrentNodeProvider().fetchNFTMetaData(nftContractId)
  console.log(`NFT Token URI: ${nftMetadata.tokenUri}; collection address: ${nftMetadata.collectionId}`)
}

nonFungibleToken()