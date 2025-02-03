import {
  ALPH_TOKEN_ID,
  Address,
  ONE_ALPH,
  addressFromContractId,
  binToHex,
  groupOfAddress,
  sleep,
  subContractId
} from '@alephium/web3'
import { Auction, AuctionInstance, Bidder } from '../artifacts/ts'
import {
  alph,
  auctionEnd,
  auctionEndFailed,
  balanceOf,
  bid,
  bidFailed,
  deployAuction,
  randomP2PKHAddress,
  transferAlphTo,
  withdraw,
  withdrawFailed
} from './utils'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import { testAddress } from '@alephium/web3-test'
import * as base58 from 'bs58'

describe('test auction', () => {
  const groupIndex = groupOfAddress(testAddress)
  const auctionDuration = 10 * 1000 // 10s

  let auction: AuctionInstance
  let auctioneer: Address
  let beneficiaryAsset: string
  let beneficiaryAssetAmount: bigint
  let bidders: PrivateKeyWallet[]

  beforeEach(async () => {
    const auctionEndTime = Date.now() + auctionDuration
    auctioneer = randomP2PKHAddress(groupIndex)
    auction = (await deployAuction(auctioneer, auctionEndTime)).contractInstance
    const auctionState = await auction.fetchState()
    beneficiaryAsset = auctionState.fields.beneficiaryAsset
    beneficiaryAssetAmount = auctionState.fields.beneficiaryAssetAmount
    bidders = Array.from(Array(2).keys()).map((_) => PrivateKeyWallet.Random(groupIndex))
    for (const bidder of bidders) {
      await transferAlphTo(bidder.address, alph(1000))
    }
  })

  async function checkHighestBidder(address: Address, amount: bigint) {
    const state = await auction.fetchState()
    expect(state.fields.highestBidder).toEqual(address)
    expect(state.fields.highestBid).toEqual(amount)
  }

  async function checkBidderState(bidder: PrivateKeyWallet, amount: bigint) {
    const path = binToHex(base58.decode(bidder.address))
    const bidderContractId = subContractId(auction.contractId, path, groupIndex)
    const bidderContract = Bidder.at(addressFromContractId(bidderContractId))
    const state = await bidderContract.fetchState()
    expect(state.asset.alphAmount).toEqual(amount + ONE_ALPH)
    expect(state.fields.address).toEqual(bidder.address)
    expect(state.fields.auction).toEqual(auction.contractId)
  }

  test('bid:update highest bidder', async () => {
    const [bidder0, bidder1] = bidders
    await bid(bidder0, auction, alph(10))
    await checkHighestBidder(bidder0.address, alph(10))
    await checkBidderState(bidder0, alph(10))

    await bid(bidder1, auction, alph(11))
    await checkHighestBidder(bidder1.address, alph(11))
    await checkBidderState(bidder1, alph(11))

    await bid(bidder0, auction, alph(12))
    await checkHighestBidder(bidder0.address, alph(12))
    await checkBidderState(bidder0, alph(12))

    await auctionEndFailed(bidder0, auction, Auction.consts.ErrorCodes.AuctionNotYetEnded)
  })

  test('bid:withdraw', async () => {
    const [bidder0, bidder1] = bidders
    await bid(bidder0, auction, alph(10))
    await checkHighestBidder(bidder0.address, alph(10))
    await withdrawFailed(bidder0, auction)

    await bid(bidder1, auction, alph(11))
    await checkHighestBidder(bidder1.address, alph(11))
    await withdraw(bidder0, auction)
    await withdrawFailed(bidder1, auction)

    await bid(bidder0, auction, alph(12))
    await checkHighestBidder(bidder0.address, alph(12))

    await withdraw(bidder1, auction)
    await checkHighestBidder(bidder0.address, alph(12))

    await auctionEndFailed(bidder0, auction, Auction.consts.ErrorCodes.AuctionNotYetEnded)
  })

  test('bid:auction end', async () => {
    const [bidder0, bidder1] = bidders
    await bid(bidder0, auction, alph(10))
    await bid(bidder1, auction, alph(11))

    await sleep(11 * 1000)

    await auctionEnd(bidder1, auction)
    const auctioneerBalance = await balanceOf(ALPH_TOKEN_ID, auctioneer)
    expect(auctioneerBalance).toEqual(alph(11))

    const beneficiaryAmount = await balanceOf(beneficiaryAsset, bidder1.address)
    expect(beneficiaryAmount).toEqual(beneficiaryAssetAmount)

    await auctionEndFailed(bidder0, auction, Auction.consts.ErrorCodes.AuctionEndAlreadyCalled)

    await bidFailed(bidder0, auction, alph(12))
    await withdraw(bidder0, auction)
  }, 30000)
})
