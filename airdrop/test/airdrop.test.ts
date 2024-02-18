import { Airdrop, AirdropInstance, DisperseAirdrop10 } from '../artifacts/ts'
import { DUST_AMOUNT, ONE_ALPH, Project, web3 } from '@alephium/web3'
import { testPrivateKey } from '@alephium/web3-test'
import { PrivateKeyWallet } from '@alephium/web3-wallet'

describe('unit tests', () => {
  const tokenId = '1a281053ba8601a658368594da034c2e99a0fb951b86498d05e76aedfe666800'
  let airdrop: AirdropInstance
  let defaultSigner: PrivateKeyWallet

  beforeAll(async () => {
    web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
    await Project.build()
    defaultSigner = new PrivateKeyWallet({ privateKey: testPrivateKey })
    // airdrop = (
    //   await Airdrop.deploy(defaultSigner, {
    //     initialFields: {
    //       selfOwner: defaultSigner.address
    //     }
    //   })
    // ).contractInstance
  })

  it('disperse10', async () => {
    // const result = await DisperseAirdrop10.execute(defaultSigner, {
    //   initialFields: {
    //     airdrop: airdrop.contractId,
    //     tokenId,
    //     amountPerAddress: BigInt(1)
    //   },
    //   attoAlphAmount: DUST_AMOUNT * BigInt(11),
    //   tokens: [
    //     {
    //       id: tokenId,
    //       amount: BigInt(10)
    //     }
    //   ],
    // })
    //
    // console.log(result)

    const result = await Airdrop.tests.deposit({
      initialFields: {
        selfOwner: defaultSigner.address
      },
      testArgs: {
        tokenId,
        amount: BigInt(10000)
      },
      initialAsset: {
        alphAmount: ONE_ALPH,
        tokens: [
          {
            id: '1a281053ba8601a658368594da034c2e99a0fb951b86498d05e76aedfe666800',
            amount: BigInt(10000)
          }
        ]
      },
      inputAssets: [
        {
          address: defaultSigner.address,
          asset: {
            alphAmount: DUST_AMOUNT * BigInt(11),
            tokens: [
              {
                id: '1a281053ba8601a658368594da034c2e99a0fb951b86498d05e76aedfe666800',
                amount: BigInt(10000)
              }
            ]
          }
        }
      ]
    })

    // testDeposit()
    // const result = await Airdrop.tests.disperse10({
    //   initialFields: {
    //     selfOwner: defaultSigner.address
    //   },
    //   testArgs: {
    //     tokenId: '1a281053ba8601a658368594da034c2e99a0fb951b86498d05e76aedfe666800',
    //     amountPerAddress: BigInt(1),
    //     addresses: [
    //       '1EDcGs3Tj5uA76WPnzi8RY4UxKpseAhKLfzEPwTx71MPg',
    //       '1GTJfYF95hVvmLHe44i44NDLccvwWByddrepGVaTKVkew',
    //       '123VnEBARzoZhy7ykvKhqw1KHsQWgPhr1UMwquXVV7t4q',
    //       '1CEv7vNzQqf84Zx65XGaxRkweQPPsiPeGQVcN6PBLhN12',
    //       '154rcEJECc9rutY8tAZj1uN49i9D8yByLRiQbmq4sWFzF',
    //       '1DmAk8jnnxkJ6ow3HSwT7gBszadDbJu2mheE2jCEmNvs7',
    //       '1GfQU1jzBLCabcUShiCiaa1M5y1yxqyRDms2NvcjrysN8',
    //       '13tbqfPFwgRxfiGYF5RuPM5RNzaFBvHbdhH92b4MvZMBu',
    //       '1E9XXEufrMA8BSjwpnFv3Hj2FKKWz4VYEChEkn1DQjBcS',
    //       '1ASwwXkXURjxZ3oCSX8seX49V8VojpN6GE3LQVbn9sivb'
    //     ]
    //   },
    //   initialAsset: {
    //     alphAmount: ONE_ALPH,
    //     tokens: [
    //       {
    //         id: '1a281053ba8601a658368594da034c2e99a0fb951b86498d05e76aedfe666800',
    //         amount: BigInt(10000)
    //       }
    //     ]
    //   },
    //   inputAssets: [
    //     {
    //       address: defaultSigner.address,
    //       asset: {
    //         alphAmount: DUST_AMOUNT * BigInt(11),
    //         tokens: [
    //           {
    //             id: '1a281053ba8601a658368594da034c2e99a0fb951b86498d05e76aedfe666800',
    //             amount: BigInt(10)
    //           }
    //         ]
    //       }
    //     }
    //   ]
    // })

    console.log(result)
  })
})
