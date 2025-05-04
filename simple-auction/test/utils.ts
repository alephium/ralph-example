import { expectAssertionError, testAddress, testPrivateKey } from '@alephium/web3-test'
import { Auction, AuctionEnd, AuctionInstance, Bid, Bidder, GetToken, TestToken, Withdraw } from '../artifacts/ts'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import { ALPH_TOKEN_ID, Address, DUST_AMOUNT, ONE_ALPH, SignerProvider, groupOfAddress, web3, waitForTxConfirmation, SignTransferTxResult } from '@alephium/web3'
import { randomBytes } from 'crypto'
import * as base58 from 'bs58'

web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
export const ZERO_ADDRESS = 'tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq'
export const defaultSigner = new PrivateKeyWallet({ privateKey: testPrivateKey })

export async function deployBidderTemplate() {
  return await Bidder.deploy(defaultSigner, {
    initialFields: {
      auction: '',
      address: ZERO_ADDRESS,
      bidAmount: 0n
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
  await GetToken.execute({
    signer: defaultSigner,
    initialFields: {
      token: testToken.contractInstance.contractId,
      amount: totalSupply
    },
    attoAlphAmount: DUST_AMOUNT
  })
  return testToken
}

export async function deployAuction(auctioneer: Address, auctionEndTime: number) {
  const bidderTemplate = await deployBidderTemplate()
  const testTokenAmount = 100n
  const testToken = await deployTestToken(testTokenAmount)

  return await Auction.deploy(defaultSigner, {
    initialFields: {
      bidderTemplateId: bidderTemplate.contractInstance.contractId,
      auctioneer,
      beneficiaryAsset: testToken.contractInstance.contractId,
      beneficiaryAssetAmount: testTokenAmount,
      auctionEndTime: BigInt(auctionEndTime),
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
  await waitForTxConfirmation(result.txId, 1, 1000)
  return result
}

export async function transferAlphTo(to: Address, amount: bigint) {
  return await waitTxConfirmed(
    defaultSigner.signAndSubmitTransferTx({
      signerAddress: testAddress,
      destinations: [{ address: to, attoAlphAmount: amount }]
    }) as Promise<SignTransferTxResult>
  )
}

export async function bid(signer: SignerProvider, auction: AuctionInstance, amount: bigint) {
  return await Bid.execute({
    signer,
    initialFields: { auction: auction.contractId, amount },
    attoAlphAmount: amount + ONE_ALPH
  })
}

export async function bidFailed(signer: SignerProvider, auction: AuctionInstance, amount: bigint) {
  await expectAssertionError(
    bid(signer, auction, amount),
    auction.address,
    Number(Auction.consts.ErrorCodes.AuctionAlreadyEnded)
  )
}

export async function withdraw(signer: SignerProvider, auction: AuctionInstance) {
  return await Withdraw.execute({
    signer,
    initialFields: { auction: auction.contractId }
  })
}

export async function withdrawFailed(signer: SignerProvider, auction: AuctionInstance) {
  await expectAssertionError(
    withdraw(signer, auction),
    auction.address,
    Number(Auction.consts.ErrorCodes.HighestBidderNotAllowedToWithdraw)
  )
}

export async function auctionEnd(signer: SignerProvider, auction: AuctionInstance) {
  return await AuctionEnd.execute({
    signer,
    initialFields: { auction: auction.contractId }
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
