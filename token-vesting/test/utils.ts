import { expectAssertionError, testAddress, testPrivateKey } from '@alephium/web3-test'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import { GetToken, Metadata, TestToken } from '../artifacts/ts'
import {
  web3,
  ALPH_TOKEN_ID,
  Address,
  DUST_AMOUNT,
  ONE_ALPH,
  SignerProvider,
  groupOfAddress,
  waitForTxConfirmation
} from '@alephium/web3'
import { randomBytes } from 'crypto'
import * as base58 from 'bs58'

web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
export const ZERO_ADDRESS = 'tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq'
export const defaultSigner = new PrivateKeyWallet({ privateKey: testPrivateKey })

export async function deployMetadataTemplate() {
  return await Metadata.deploy(defaultSigner, {
    initialFields: {
      vesting: '',
      address: ZERO_ADDRESS,
      lockedAmount: 0n,
      totalClaimed: 0n,
      claimIndex: 0n,
      lastProcessedTimestamp: 0n
    }
  })
}

export async function deployTestToken(totalSupply: bigint) {
  const testToken = await TestToken.deploy(defaultSigner, {
    initialFields: {
      totalSupply: totalSupply
    },
    issueTokenAmount: totalSupply
  })
  await GetToken.execute(defaultSigner, {
    initialFields: {
      token: testToken.contractInstance.contractId,
      amount: totalSupply
    },
    attoAlphAmount: DUST_AMOUNT
  })
  return testToken
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

async function waitTxConfirmed<T extends { txId: string }>(promise: Promise<T>): Promise<T> {
  const result = await promise
  await waitForTxConfirmation(result.txId, 1, 1000)
  return result
}

export async function transferAlphTo(to: Address, amount: bigint) {
  return await waitTxConfirmed(
    defaultSigner.signAndSubmitTransferTx({
      signerAddress: testAddress,
      destinations: [{ address: to, attoAlphAmount: amount }]
    })
  )
}

export async function balanceOf(tokenId: string, address = testAddress): Promise<bigint> {
  const balances = await web3.getCurrentNodeProvider().addresses.getAddressesAddressBalance(address)
  if (tokenId === ALPH_TOKEN_ID) return BigInt(balances.balance)
  const balance = balances.tokenBalances?.find((t) => t.id === tokenId)
  return balance === undefined ? 0n : BigInt(balance.amount)
}
