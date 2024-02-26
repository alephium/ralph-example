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
import { LockAlphAndToken, LockAlphOnly, LockAssets, LockTokenOnly } from '../artifacts/ts'

describe('unit tests', () => {
  const testContractId = randomContractId()
  const testTokenId = testContractId
  const testContractAddress = addressFromContractId(testContractId)
  const testGasFee = 62500000000000000n // The default gas fee for unit tests

  // We initialize the fixture variables before all tests
  beforeAll(async () => {
    web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
    await Project.build()
  })

  it('test lock alph', async () => {
    const test = async (lockAmount: bigint) => {
      const result = await LockAssets.tests.lockAlphOnly({
        blockTimeStamp: 0,
        testArgs: { amount: lockAmount },
        inputAssets: [{ address: testAddress, asset: { alphAmount: testGasFee + lockAmount } }]
      })
      expect(result.txOutputs.length).toEqual(1)
      const lockedOutput = result.txOutputs[0] as AssetOutput
      expect(lockedOutput.alphAmount).toEqual(lockAmount)
      expect(lockedOutput.lockTime).toEqual(86400000)
    }
    await expect(test(DUST_AMOUNT)).resolves.not.toThrow()
    await expect(test(DUST_AMOUNT - 1n)).rejects.toThrow('VM execution error')
  })

  it('test lock token', async () => {
    const test = async (inputAmount: bigint, lockAmount: bigint, alphAmount: bigint) => {
      const result = await LockAssets.tests.lockTokenOnly({
        blockTimeStamp: 0,
        testArgs: { tokenId: testTokenId, amount: lockAmount },
        inputAssets: [
          {
            address: testAddress,
            asset: {
              alphAmount: testGasFee + alphAmount,
              tokens: [{ id: testTokenId, amount: inputAmount }]
            }
          }
        ]
      })
      expect(result.txOutputs.length).toEqual(1)
      const lockedOutput = result.txOutputs[0] as AssetOutput
      expect(lockedOutput.tokens!.length).toEqual(1)
      expect(lockedOutput.tokens![0].id).toEqual(testTokenId)
      expect(lockedOutput.tokens![0].amount).toEqual(lockAmount)
      expect(lockedOutput.alphAmount).toEqual(DUST_AMOUNT)
    }
    await expect(test(100n, 100n, DUST_AMOUNT)).resolves.not.toThrow()
    await expect(test(100n, 100n, DUST_AMOUNT - 1n)).rejects.toThrow('VM execution error')
  })

  it('test lock alph and token', async () => {
    const test = async (inputAmount: bigint, lockAmount: bigint, alphAmount: bigint, expectedOutputNum: number) => {
      const result = await LockAssets.tests.lockAlphAndToken({
        blockTimeStamp: 0,
        testArgs: { alphAmount: alphAmount, tokenId: testTokenId, tokenAmount: lockAmount },
        inputAssets: [
          {
            address: testAddress,
            asset: {
              alphAmount: testGasFee + alphAmount,
              tokens: [{ id: testTokenId, amount: inputAmount }]
            }
          }
        ]
      })
      expect(result.txOutputs.length).toEqual(expectedOutputNum) // 1 or 2
      const firstOutput = result.txOutputs[0] as AssetOutput
      expect(firstOutput.alphAmount).toEqual(DUST_AMOUNT)
      expect(firstOutput.tokens!.length).toEqual(1)
      expect(firstOutput.tokens![0].id).toEqual(testTokenId)
      expect(firstOutput.tokens![0].amount).toEqual(lockAmount)
      expect(firstOutput.lockTime).toEqual(86400000)
      if (expectedOutputNum === 2) {
        const secondOutput = result.txOutputs[1] as AssetOutput
        expect(secondOutput.alphAmount).toEqual(DUST_AMOUNT)
        expect(secondOutput.tokens!.length).toEqual(0)
        expect(secondOutput.lockTime).toEqual(86400000)
      }
    }
    await expect(test(100n, 100n, DUST_AMOUNT, 1)).resolves.not.toThrow() // Just enough dust amount for the token UTXO
    await expect(test(10n, 100n, DUST_AMOUNT, 1)).rejects.toThrow('VM execution error') // Not enough token amount to lock
    await expect(test(100n, 100n, DUST_AMOUNT - 1n, 1)).rejects.toThrow('VM execution error') // Not enough dust amount for the token UTXO
    await expect(test(100n, 100n, DUST_AMOUNT + 1n, 1)).rejects.toThrow('VM execution error') // Not enough dust amount for the alph UTXO
    await expect(test(100n, 100n, 2n * DUST_AMOUNT - 1n, 2)).rejects.toThrow('VM execution error') // Not enough dust amount for the alph UTXO
    await expect(test(100n, 100n, 2n * DUST_AMOUNT, 2)).resolves.not.toThrow() // Just enough dust amount for the alph UTXO + the token UTXO
  })
})

describe('integration tests', () => {
  beforeAll(async () => {
    web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
    await Project.build()
  })

  it('should lock Alph and tokens on devnet', async () => {
    const signer = await getSigner(ONE_ALPH * 100n, 0)
    const deployments = await deployToDevnet()
    const { contractId: tokenId } = await mintToken(signer.address, 1000n)
    const deployed = deployments.getDeployedContractResult(0, 'LockAssets')
    if (deployed === undefined) {
      throw new Error('The contract is not deployed on group 0')
    }
    const lockAddress = deployed.contractInstance.address
    await LockAlphOnly.execute(signer, {
      initialFields: { lockAssets: lockAddress, amount: ONE_ALPH },
      attoAlphAmount: ONE_ALPH
    })
    await LockTokenOnly.execute(signer, {
      initialFields: { lockAssets: lockAddress, tokenId, amount: 100n },
      attoAlphAmount: ONE_ALPH,
      tokens: [{ id: tokenId, amount: 100n }]
    })
    await LockAlphAndToken.execute(signer, {
      initialFields: { lockAssets: lockAddress, tokenId, tokenAmount: 100n, alphAmount: ONE_ALPH },
      attoAlphAmount: ONE_ALPH,
      tokens: [{ id: tokenId, amount: 100n }]
    })

  }, 20000)
})
