import { expectAssertionError, testAddress, testPrivateKey } from '@alephium/web3-test'
import {
  Auction,
  AuctionEnd,
  AuctionInstance,
  Bid,
  Bidder,
  BlindedBid,
  CreateBidder,
  GetToken,
  Reveal,
  TestToken,
  Withdraw
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
  web3
} from '@alephium/web3'
import { randomBytes } from 'crypto'
import * as base58 from 'bs58'
import { waitTxConfirmed as _waitTxConfirmed } from '@alephium/cli'
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

export async function deployBlindedBidTemplate() {
  return await BlindedBid.deploy(defaultSigner, {
    initialFields: {
      bidder: '',
      data: '',
      deposit: 0n,
      revealed: false
    }
  })
}

export async function deployBidderTemplate() {
  return await Bidder.deploy(defaultSigner, {
    initialFields: {
      blindedBidTemplateId: '',
      auction: '',
      address: ZERO_ADDRESS,
      blindedBidSize: 0n
    }
  })
}

export async function createBidder(signer: SignerProvider, auction: AuctionInstance) {
  return await CreateBidder.execute(signer, {
    initialFields: { auction: auction.contractId },
    attoAlphAmount: ONE_ALPH
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

export async function deployAuction(auctioneer: Address, biddingEnd: number, revealEnd: number) {
  const blindedBidTemplate = await deployBlindedBidTemplate()
  const bidderTemplate = await deployBidderTemplate()
  const testTokenAmount = 100n
  const testToken = await deployTestToken(testTokenAmount)

  return await Auction.deploy(defaultSigner, {
    initialFields: {
      blindedBidTemplateId: blindedBidTemplate.contractInstance.contractId,
      bidderTemplateId: bidderTemplate.contractInstance.contractId,
      auctioneer,
      beneficiaryAsset: testToken.contractInstance.contractId,
      beneficiaryAssetAmount: testTokenAmount,
      biddingEnd: BigInt(biddingEnd),
      revealEnd: BigInt(revealEnd),
      highestBidder: ZERO_ADDRESS,
      highestBid: 0n,
      ended: false
    },
    initialTokenAmounts: [{ id: testToken.contractInstance.contractId, amount: testTokenAmount }]
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

async function waitTxConfirmed<T extends { txId: string }>(promise: Promise<T>): Promise<T> {
  const result = await promise
  await _waitTxConfirmed(web3.getCurrentNodeProvider(), result.txId, 1, 1000)
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

export async function bid(signer: SignerProvider, auction: AuctionInstance, amount: bigint, bidInfo: BidInfo) {
  return await Bid.execute(signer, {
    initialFields: { auction: auction.contractId, blindedBid: bidInfo.hash, amount },
    attoAlphAmount: amount + ONE_ALPH
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

export async function withdraw(signer: SignerProvider, auction: AuctionInstance) {
  return await Withdraw.execute(signer, { initialFields: { auction: auction.contractId } })
}

export async function withdrawFailed(signer: SignerProvider, auction: AuctionInstance) {
  await expectAssertionError(
    withdraw(signer, auction),
    auction.address,
    Number(Auction.consts.ErrorCodes.HighestBidderNotAllowedToWithdraw)
  )
}

export async function reveal(signer: SignerProvider, auction: AuctionInstance, bidInfos: BidInfo[]) {
  const encodedValues = bidInfos.map((bidInfo) => bidInfo.value.toString(16).padStart(64, '0')).join('')
  const encodedFakes = bidInfos.map((bidInfo) => (bidInfo.fake ? '01' : '00')).join('')
  const encodedSecrets = bidInfos.map((bidInfo) => bidInfo.secret).join('')
  return await Reveal.execute(signer, {
    initialFields: {
      auction: auction.contractId,
      values: encodedValues,
      fakes: encodedFakes,
      secrets: encodedSecrets
    }
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
  return await AuctionEnd.execute(signer, {
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

export async function contractExists(address: string): Promise<boolean> {
  try {
    const nodeProvider = web3.getCurrentNodeProvider()
    await nodeProvider.contracts.getContractsAddressState(address, {
      group: groupOfAddress(address)
    })
    return true
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('KeyNotFound')) {
      return false
    }
    throw error
  }
}
