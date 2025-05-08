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
    
    for (const _address of _addresses) {
      await transferAlphTo(_address.address, alph(1000))
      await transferTokenTo(_address.address, tokenId, 1000n)
    }

    await transferAlphTo(owner, alph(1000))
    await transferTokenTo(owner, tokenId, 1000n)
  })
  
})
