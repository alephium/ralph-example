import { Airdrop } from '../artifacts/ts'
import { NodeProvider, ONE_ALPH, Project, web3 } from '@alephium/web3'
import { randomContractAddress, testPrivateKey } from '@alephium/web3-test'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import { generateMnemonic } from 'bip39'

describe('unit tests', () => {
  const tokenId = '1a281053ba8601a658368594da034c2e99a0fb951b86498d05e76aedfe666800'
  let defaultSigner: PrivateKeyWallet
  let nodeProvider

  beforeAll(async () => {
    const nodeUrl = 'http://127.0.0.1:22973'
    nodeProvider = new NodeProvider(nodeUrl)
    web3.setCurrentNodeProvider(nodeUrl, undefined, fetch)
    await Project.build()
    defaultSigner = new PrivateKeyWallet({ privateKey: testPrivateKey })
  })

  const contractAddress = randomContractAddress()

  it('should airdrop 10 addresses', async () => {
    const addresses: string[] = []
    const genAmt = 10

    for (let i = 0; i < genAmt; i++) {
      const wallet = PrivateKeyWallet.FromMnemonicWithGroup(
        generateMnemonic(),
        0,
        undefined,
        undefined,
        undefined,
        nodeProvider
      )

      const address = (await wallet.getSelectedAccount()).address
      addresses.push(address)
    }

    const airdropResponse = await Airdrop.tests.disperse10({
      address: contractAddress,
      initialFields: {},
      testArgs: {
        tokenId: tokenId,
        amountPerAddress: BigInt(1),
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        addresses: addresses
      },
      initialAsset: {
        alphAmount: ONE_ALPH,
        tokens: []
      },
      inputAssets: [
        {
          address: defaultSigner.address,
          asset: {
            alphAmount: ONE_ALPH,
            tokens: [
              {
                id: tokenId,
                amount: BigInt(700)
              }
            ]
          }
        }
      ]
    })
    const validRecipients = addresses.every((address) =>
      airdropResponse.txOutputs.some((out) => out.address === address && out.tokens![0].amount === BigInt(1))
    )
    expect(validRecipients).toBeTruthy()
  }, 100000)

  it('should airdrop 25 addresses', async () => {
    const addresses: string[] = []
    const genAmt = 25

    for (let i = 0; i < genAmt; i++) {
      const wallet = PrivateKeyWallet.FromMnemonicWithGroup(
        generateMnemonic(),
        0,
        undefined,
        undefined,
        undefined,
        nodeProvider
      )

      const address = (await wallet.getSelectedAccount()).address
      addresses.push(address)
    }

    const airdropResponse = await Airdrop.tests.disperse25({
      address: contractAddress,
      initialFields: {},
      testArgs: {
        tokenId: tokenId,
        amountPerAddress: BigInt(1),
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        addresses: addresses
      },
      initialAsset: {
        alphAmount: ONE_ALPH,
        tokens: []
      },
      inputAssets: [
        {
          address: defaultSigner.address,
          asset: {
            alphAmount: ONE_ALPH,
            tokens: [
              {
                id: tokenId,
                amount: BigInt(25)
              }
            ]
          }
        }
      ]
    })
    const validRecipients = addresses.every((address) =>
      airdropResponse.txOutputs.some((out) => out.address === address && out.tokens![0].amount === BigInt(1))
    )
    expect(validRecipients).toBeTruthy()
  }, 100000)

  it('should airdrop 50 addresses', async () => {
    const addresses: string[] = []
    const genAmt = 50

    for (let i = 0; i < genAmt; i++) {
      const wallet = PrivateKeyWallet.FromMnemonicWithGroup(
        generateMnemonic(),
        0,
        undefined,
        undefined,
        undefined,
        nodeProvider
      )

      const address = (await wallet.getSelectedAccount()).address
      addresses.push(address)
    }

    const airdropResponse = await Airdrop.tests.disperse50({
      address: contractAddress,
      initialFields: {},
      testArgs: {
        tokenId: tokenId,
        amountPerAddress: BigInt(1),
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        addresses: addresses
      },
      initialAsset: {
        alphAmount: ONE_ALPH,
        tokens: []
      },
      inputAssets: [
        {
          address: defaultSigner.address,
          asset: {
            alphAmount: ONE_ALPH,
            tokens: [
              {
                id: tokenId,
                amount: BigInt(50)
              }
            ]
          }
        }
      ]
    })
    const validRecipients = addresses.every((address) =>
      airdropResponse.txOutputs.some((out) => out.address === address && out.tokens![0].amount === BigInt(1))
    )
    expect(validRecipients).toBeTruthy()
  }, 100000)

  it('should airdrop 100 addresses', async () => {
    const addresses: string[] = []
    const genAmt = 100

    for (let i = 0; i < genAmt; i++) {
      const wallet = PrivateKeyWallet.FromMnemonicWithGroup(
        generateMnemonic(),
        0,
        undefined,
        undefined,
        undefined,
        nodeProvider
      )

      const address = (await wallet.getSelectedAccount()).address
      addresses.push(address)
    }

    const airdropResponse = await Airdrop.tests.disperse100({
      address: contractAddress,
      initialFields: {},
      testArgs: {
        tokenId: tokenId,
        amountPerAddress: BigInt(1),
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        addresses: addresses
      },
      initialAsset: {
        alphAmount: ONE_ALPH,
        tokens: []
      },
      inputAssets: [
        {
          address: defaultSigner.address,
          asset: {
            alphAmount: ONE_ALPH,
            tokens: [
              {
                id: tokenId,
                amount: BigInt(100)
              }
            ]
          }
        }
      ]
    })
    const validRecipients = addresses.every((address) =>
      airdropResponse.txOutputs.some((out) => out.address === address && out.tokens![0].amount === BigInt(1))
    )
    expect(validRecipients).toBeTruthy()
  }, 100000)
})