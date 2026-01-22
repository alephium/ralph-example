import {
  ALPH_TOKEN_ID,
  Address,
  ONE_ALPH,
  addressFromContractId,
  groupOfAddress,
  sleep,
  subContractId
} from '@alephium/web3'
import { LendingProtocol, LendingProtocolInstance, LendingProtocolAccount } from '../artifacts/ts'
import {
  deployLendingProtocol,
  deposit,
  depositFailed,
  withdrawal,
  balanceOf,
  randomP2PKHAddress,
  transferTokenTo,
  checkLendingProtocolAccount,
  transferAlphTo,
  alph
} from './utils'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import { testAddress } from '@alephium/web3-test'
import * as base58 from 'bs58'

describe('test lendingProtocol', () => {
  const groupIndex = groupOfAddress(testAddress)

  let lendingProtocol: LendingProtocolInstance
  let owner: Address
  let tokenId: string
  let _addresses: PrivateKeyWallet[]
  let ownerWallet: PrivateKeyWallet

  beforeEach(async () => {
    ownerWallet = PrivateKeyWallet.Random(groupIndex)
    owner = ownerWallet.address
    lendingProtocol = (await deployLendingProtocol(owner)).contractInstance

    const lendingProtocolState = await lendingProtocol.fetchState()
    tokenId = lendingProtocolState.fields.tokenId

    _addresses = Array.from(Array(2).keys()).map((_) => PrivateKeyWallet.Random(groupIndex))
    // Setup initial token balances for _addresses
    for (const _address of _addresses) {
      await transferAlphTo(_address.address, alph(1000))
      await transferTokenTo(_address.address, tokenId, 1000n)
    }

    await transferAlphTo(owner, alph(1000))
    await transferTokenTo(owner, tokenId, 1000n)
  })

  async function checkAmountDeposited(expectedAmount: bigint) {
    const state = await lendingProtocol.fetchState()
    expect(state.fields.amountDeposited).toEqual(expectedAmount)
  }

  test('deposit:failed scenarios', async () => {
    const [_address] = _addresses

    // Test lendingProtocol with 0 amount
    await depositFailed(
      _address,
      lendingProtocol,
      0n,
      tokenId,
      Number(LendingProtocol.consts.ErrorCodes.INVALID_AMOUNT)
    )
  })

  test('deposit:successful lendingProtocol', async () => {
    const [_address1, _address2] = _addresses
    const depositAmount = 100n
    // Test initial deposit
    await deposit(_address1, lendingProtocol, depositAmount, tokenId)
    // await checklendingProtocolAccount(lendingProtocol, _address1.address, depositAmount)
    await checkAmountDeposited(depositAmount)

    // Test additional deposit
    await deposit(_address1, lendingProtocol, depositAmount, tokenId)
    // await checklendingProtocolAccount(lendingProtocol, _address1.address, depositAmount * 2n)
    await checkAmountDeposited(depositAmount * 2n)

    // Test multiple _addresses
    await deposit(_address2, lendingProtocol, depositAmount, tokenId)
    // await checklendingProtocolAccount(lendingProtocol, _address2.address, depositAmount)
    await checkAmountDeposited(depositAmount * 3n)
  })

  test('withdrawal', async () => {
    const [_address] = _addresses
    const depositAmount = 100n
    await deposit(_address, lendingProtocol, depositAmount, tokenId)

    await withdrawal(_address, lendingProtocol, depositAmount)

    const finalBalance = await balanceOf(tokenId, _address.address)
    expect(finalBalance).toEqual(1000n)
  })
})
