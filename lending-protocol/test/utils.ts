import { expectAssertionError, testAddress, testPrivateKey } from '@alephium/web3-test'
import { 
  LendingProtocol, 
  LendingProtocolInstance, 
  LendingProtocolAccount,
  Deposit,
  Withdrawal,
} from '../artifacts/ts'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import { 
  ALPH_TOKEN_ID, 
  Address, 
  DUST_AMOUNT, 
  ONE_ALPH, 
  SignerProvider, 
  groupOfAddress,
  web3,
  waitForTxConfirmation,
  addressFromContractId,
  subContractId
} from '@alephium/web3'
import { randomBytes } from 'crypto'
import * as base58 from 'bs58'

web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
export const ZERO_ADDRESS = 'tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq'
export const defaultSigner = new PrivateKeyWallet({ privateKey: testPrivateKey })

async function waitTxConfirmed<T extends { txId: string }>(promise: Promise<T>): Promise<T> {
  const result = await promise
  await waitForTxConfirmation(result.txId, 1, 1000)
  return result
}

export function randomP2PKHAddress(groupIndex = 0): string {
  const prefix = Buffer.from([0x00])
  const bytes = Buffer.concat([prefix, randomBytes(32)])
  const address = base58.encode(bytes)
  if (groupOfAddress(address) === groupIndex) {
    return address
  }
  return randomP2PKHAddress(groupIndex)
}

export async function deployLendingProtocolAccountTemplate(tokenId: string) {
  return await LendingProtocolAccount.deploy(defaultSigner, {
    initialFields: {
      tokenId,
      _address: ZERO_ADDRESS,
      parentContractAddress: ZERO_ADDRESS,
      amountDeposited: 0n,
      rewards: 0n,
    }
  })
}

export async function deployTestTokens(amount: bigint) {
  const lendingProtocolToken = await deployTestToken(amount)
  const rewardsToken = await deployTestToken(amount)
  return { lendingProtocolToken, rewardsToken }
}

export async function deployLendingProtocol(
  owner: Address
) {
  const { lendingProtocolToken } = await deployTestTokens(1000000n)
  
  const accountTemplate = await deployLendingProtocolAccountTemplate(
    lendingProtocolToken.contractInstance.contractId
  )

  return await LendingProtocol.deploy(defaultSigner, {
    initialFields: {
      tokenId: lendingProtocolToken.contractInstance.contractId,
      lendingProtocolAccountTemplateId: accountTemplate.contractInstance.contractId,
      amountDeposited: 0n,
      owner_: owner
    },
    initialTokenAmounts: [
      { id: lendingProtocolToken.contractInstance.contractId, amount: 1000000n }
    ]
  })
}

export async function transferTokenTo(to: Address, tokenId: string, amount: bigint) {
  return await waitTxConfirmed(
    defaultSigner.signAndSubmitTransferTx({
      signerAddress: testAddress,
      destinations: [
        { 
          address: to, 
          attoAlphAmount: ONE_ALPH,
          tokens: [{ id: tokenId, amount: amount }]
        }
      ]
    })
  )
}

export async function transferAlphTo(to: Address, amount: bigint) {
  return await waitTxConfirmed(
    defaultSigner.signAndSubmitTransferTx({
      signerAddress: testAddress,
      destinations: [{ address: to, attoAlphAmount: amount }]
    })
  )
}

export function alph(amount: bigint | number): bigint {
  return BigInt(amount) * ONE_ALPH
}

export async function deposit(
  signer: SignerProvider,
  lendingProtocol: LendingProtocolInstance,
  amount: bigint,
  tokenId: string
) {
  return await Deposit.execute(signer, {
    initialFields: {
      lendingProtocol: lendingProtocol.contractId,
      amount
    },
    tokens: [{ id: tokenId, amount }],
    attoAlphAmount: ONE_ALPH
  })
}

export async function depositFailed(
  signer: SignerProvider,
  lendingProtocol: LendingProtocolInstance,
  amount: bigint,
  tokenId: string,
  errorCode: number
) {
  await expectAssertionError(
    deposit(signer, lendingProtocol, amount, tokenId),
    lendingProtocol.address,
    errorCode
  )
}

export async function withdrawal(
  signer: SignerProvider,
  lendingProtocol: LendingProtocolInstance,
  amount: bigint,
) {
  return await Withdrawal.execute(signer, {
    initialFields: {
      lendingProtocol: lendingProtocol.contractId,
      amount
    }
  })
}

export async function checkLendingProtocolAccount(
  lendingProtocol: LendingProtocolInstance,
  _address: Address, 
  expectedAmount: bigint
) {
  const groupIndex = groupOfAddress(_address)
  const path = base58.decode(_address)
  const accountId = subContractId(lendingProtocol.contractId, path, groupIndex)
  const lendingProtocolAccount = LendingProtocolAccount.at(addressFromContractId(accountId))
  const state = await lendingProtocolAccount.fetchState()
  expect(state.fields.amountDeposited).toEqual(expectedAmount)
}

export async function balanceOf(tokenId: string, address = testAddress): Promise<bigint> {
  const balances = await web3.getCurrentNodeProvider().addresses.getAddressesAddressBalance(address)
  if (tokenId === ALPH_TOKEN_ID) return BigInt(balances.balance)
  const balance = balances.tokenBalances?.find((t) => t.id === tokenId)
  return balance === undefined ? 0n : BigInt(balance.amount)
}
