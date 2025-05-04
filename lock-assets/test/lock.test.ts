import {
  web3,
  AssetOutput,
  DUST_AMOUNT,
  ONE_ALPH,
  subContractId,
  stringToHex,
  MINIMAL_CONTRACT_DEPOSIT,
} from '@alephium/web3'
import { randomContractId, testAddress, mintToken, getSigner } from '@alephium/web3-test'
import { deployToDevnet } from '@alephium/cli'
import { LockAssets } from '../artifacts/ts'

describe('unit tests', () => {
  const testContractId = randomContractId()
  const testTokenId = testContractId
  web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)

  it('test lock alph', async () => {
    const test = async (lockAmount: bigint) => {
      const result = await LockAssets.tests.lockAlphOnly({
        blockTimeStamp: 0,
        args: { amount: lockAmount },
        inputAssets: [{ address: testAddress, asset: { alphAmount: lockAmount } }]
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
        args: { tokenId: testTokenId, amount: lockAmount },
        inputAssets: [
          {
            address: testAddress,
            asset: {
              alphAmount,
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
        args: { alphAmount, tokenId: testTokenId, tokenAmount: lockAmount },
        inputAssets: [
          {
            address: testAddress,
            asset: {
              alphAmount,
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
  web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)

  it('should lock Alph and tokens on devnet', async () => {
    const nodeProvider = web3.getCurrentNodeProvider()
    const signer = await getSigner(ONE_ALPH * 100n, 0)
    const deployments = await deployToDevnet()
    const { contractId: tokenId } = await mintToken(signer.address, 1000n)
    const deployedLockAssets = deployments.getDeployedContractResult(0, 'LockAssets')
    if (deployedLockAssets === undefined) {
      throw new Error('The LockAssets contract is not deployed on group 0')
    }
    const lockAddress = deployedLockAssets.contractInstance.address
    const lockAssetsContract = LockAssets.at(lockAddress)
    await lockAssetsContract.transact.lockAlphOnly({
      signer, args: { amount: ONE_ALPH }, attoAlphAmount: ONE_ALPH
    })
    await lockAssetsContract.transact.lockTokenOnly({
      signer,
      args: { tokenId, amount: 100n },
      attoAlphAmount: ONE_ALPH,
      tokens: [{ id: tokenId, amount: 100n }]
    })
    await lockAssetsContract.transact.lockAlphAndToken({
      signer,
      args: { tokenId, tokenAmount: 100n, alphAmount: ONE_ALPH },
      attoAlphAmount: ONE_ALPH,
      tokens: [{ id: tokenId, amount: 100n }]
    })

    const deployedTokenToBeLocked = deployments.getDeployedContractResult(0, 'TokenToBeLocked')
    if (deployedTokenToBeLocked === undefined) {
      throw new Error('The TokenToBeLocked contract is not deployed on group 0')
    }

    const tokenName = stringToHex("lockToken")
    const oneDayFromNow = BigInt(Date.now() + 86400000)
    const recipient = await getSigner()
    await lockAssetsContract.transact.mintAndLockToken({
      signer,
      args: {
        tokenContractTemplateId: deployedTokenToBeLocked.contractInstance.contractId,
        tokenName,
        recipient: recipient.address,
        amount: 2n,
        till: oneDayFromNow
       },
      attoAlphAmount: ONE_ALPH
    })

    const lockedTokenId = subContractId(deployedLockAssets.contractInstance.contractId, tokenName, 0)
    const recipientBalance = await nodeProvider.addresses.getAddressesAddressBalance(recipient.address)
    expect(recipientBalance.lockedTokenBalances).toEqual([{ id: lockedTokenId, amount: "2" }])
  }, 20000)
})
