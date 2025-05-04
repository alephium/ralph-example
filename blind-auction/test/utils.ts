import { testAddress, testPrivateKey, expectAssertionError } from '@alephium/web3-test'
import { Auction, AuctionEnd, AuctionInstance, NewBid, Reveal } from '../artifacts/ts'
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
  web3
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

export async function deployAuction(beneficiary: Address, biddingEnd: number, revealEnd: number) {
  return await Auction.deploy(defaultSigner, {
    initialFields: {
      beneficiary,
      biddingEnd: BigInt(biddingEnd),
      revealEnd: BigInt(revealEnd),
      highestBidder: ZERO_ADDRESS,
      highestBid: 0n,
      ended: false
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

export async function bid(signer: SignerProvider, auction: AuctionInstance, amount: bigint, bidInfo: BidInfo) {
  return await NewBid.execute({
    signer,
    initialFields: { auction: auction.contractId, blindedBid: bidInfo.hash, amount },
    attoAlphAmount: amount + ONE_ALPH * 2n
  })
}

export async function bidFailed(
  signer: SignerProvider,
  auction: AuctionInstance,
  amount: bigint,
  bidInfo: BidInfo,
  errorCode: bigint
) {
  await expectAssertionError(bid(signer, auction, amount, bidInfo), auction.address, Number(errorCode))
}

export async function reveal(signer: SignerProvider, auction: AuctionInstance, bidInfos: BidInfo[]) {
  const encodedValues = bidInfos.map((bidInfo) => bidInfo.value.toString(16).padStart(64, '0')).join('')
  const encodedFakes = bidInfos.map((bidInfo) => (bidInfo.fake ? '01' : '00')).join('')
  const encodedSecrets = bidInfos.map((bidInfo) => bidInfo.secret).join('')
  return await Reveal.execute({
    signer,
    initialFields: {
      auction: auction.contractId,
      values: encodedValues,
      fakes: encodedFakes,
      secrets: encodedSecrets
    },
    attoAlphAmount: ONE_ALPH
  })
}

export async function revealFailed(
  signer: SignerProvider,
  auction: AuctionInstance,
  bidInfos: BidInfo[],
  errorCode: bigint
) {
  await expectAssertionError(reveal(signer, auction, bidInfos), auction.address, Number(errorCode))
}

export async function auctionEnd(signer: SignerProvider, auction: AuctionInstance) {
  return await AuctionEnd.execute({
    signer,
    initialFields: { auction: auction.contractId },
    attoAlphAmount: DUST_AMOUNT
  })
}

export async function auctionEndFailed(signer: SignerProvider, auction: AuctionInstance, errorCode: bigint) {
  await expectAssertionError(auctionEnd(signer, auction), auction.address, Number(errorCode))
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
