import { testAddress, testPrivateKey } from '@alephium/web3-test'
import {
  WeatherDataFeed,
  WeatherDataFeedInstance,
  AddOracle,
  MakeRequest,
  RemoveOracle,
  CompleteRequest
} from '../artifacts/ts'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import {
  ALPH_TOKEN_ID,
  Address,
  DUST_AMOUNT,
  HexString,
  ONE_ALPH,
  SignerProvider,
  binToHex,
  groupOfAddress,
  hexToBinUnsafe,
  web3,
  contractIdFromAddress
} from '@alephium/web3'
import { randomBytes } from 'crypto'
import * as base58 from 'bs58'
import * as blake from 'blakejs'

web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
export const ZERO_ADDRESS = 'tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq'
export const defaultSigner = new PrivateKeyWallet({ privateKey: testPrivateKey })

export class BidInfo {
  value: bigint
  fake: boolean
  secret: HexString
  encoded: HexString
  hash: HexString

  constructor(value: bigint, fake: boolean, secret: HexString) {
    this.value = value
    this.fake = fake
    this.secret = secret.padStart(64, '0')

    const encodedValue = value.toString(16).padStart(64, '0')
    const encodedFake = fake ? '01' : '00'
    this.encoded = encodedValue + encodedFake + this.secret
    this.hash = binToHex(blake.blake2b(hexToBinUnsafe(this.encoded), undefined, 32))
  }
}

export async function deployDataFeed(ownerWallet: Address, fee: bigint) {
  return await WeatherDataFeed.deploy(defaultSigner, {
    initialFields: {
      ownerId: binToHex(contractIdFromAddress(ownerWallet)),
      authorizedOraclesCount: BigInt(0),
      lastRequestId: '',
      lastTimestamp: BigInt(0),
      fee: fee,
      feeWallet: ownerWallet
    }
  })
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

export async function addOracle(signer: SignerProvider, dataFeed: WeatherDataFeedInstance, oracle: Address) {
  return await AddOracle.execute(signer, {
    initialFields: { dataFeed: dataFeed.contractId, oracle },
    attoAlphAmount: ONE_ALPH * 2n
  })
}

export async function addOracleFailed(
  signer: SignerProvider,
  dataFeed: WeatherDataFeedInstance,
  oracle: Address,
  errorCode: bigint
) {
  await expectAssertionError(addOracle(signer, dataFeed, oracle), dataFeed.address, Number(errorCode))
}

export async function removeOracle(signer: SignerProvider, dataFeed: WeatherDataFeedInstance, oracle: Address) {
  return await RemoveOracle.execute(signer, {
    initialFields: { dataFeed: dataFeed.contractId, oracle },
    attoAlphAmount: DUST_AMOUNT
  })
}

export async function removeOracleFailed(
  signer: SignerProvider,
  dataFeed: WeatherDataFeedInstance,
  oracle: Address,
  errorCode: bigint
) {
  await expectAssertionError(removeOracle(signer, dataFeed, oracle), dataFeed.address, Number(errorCode))
}

export async function makeRequest(
  signer: SignerProvider,
  dataFeed: WeatherDataFeedInstance,
  lat: number,
  lon: number,
  fee: bigint
) {
  return await MakeRequest.execute(signer, {
    initialFields: {
      dataFeed: dataFeed.contractId,
      lat: BigInt(lat),
      lon: BigInt(lon),
      fee: fee
    },
    attoAlphAmount: fee + ONE_ALPH * 2n
  })
}

export async function completeRequest(
  signer: SignerProvider,
  dataFeed: WeatherDataFeedInstance,
  requestId: string,
  temp: string,
  publicKey: string,
  signature: string,
  timestamp: number
) {
  return await CompleteRequest.execute(signer, {
    initialFields: {
      dataFeed: dataFeed.contractId,
      requestId: requestId,
      temp: temp,
      publicKey: publicKey,
      signature: signature,
      timestamp: BigInt(timestamp)
    },
    attoAlphAmount: DUST_AMOUNT
  })
}

export async function completeRequestFailed(
  signer: SignerProvider,
  dataFeed: WeatherDataFeedInstance,
  requestId: string,
  temp: string,
  publicKey: string,
  signature: string,
  timestamp: number,
  errorCode: bigint
) {
  await expectAssertionError(
    completeRequest(signer, dataFeed, requestId, temp, publicKey, signature, timestamp),
    dataFeed.address,
    Number(errorCode)
  )
}

export function alph(amount: bigint | number): bigint {
  return BigInt(amount) * ONE_ALPH
}

export async function balanceOf(tokenId: string, address = testAddress): Promise<bigint> {
  const balances = await web3.getCurrentNodeProvider().addresses.getAddressesAddressBalance(address)
  if (tokenId === ALPH_TOKEN_ID) return BigInt(balances.balance)
  const balance = balances.tokenBalances?.find((t) => t.id === tokenId)
  return balance === undefined ? 0n : BigInt(balance.amount)
}

async function expectAssertionError(p: Promise<unknown>, address: string, errorCode: number): Promise<void> {
  await expect(p).rejects.toThrowError(
    new RegExp(`Assertion Failed in Contract @ ${address}, Error Code: ${errorCode}`, 'mg')
  )
}
