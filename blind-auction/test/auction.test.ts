import {
  ALPH_TOKEN_ID,
  Address,
  ONE_ALPH,
  addressFromContractId,
  groupOfAddress,
  sleep,
  subContractId
} from '@alephium/web3'
import { Auction, AuctionInstance, Bidder, BlindedBid } from '../artifacts/ts'
import {
  BidInfo,
  ZERO_ADDRESS,
  alph,
  auctionEnd,
  auctionEndFailed,
  balanceOf,
  bid,
  bidFailed,
  contractExists,
  createBidder,
  deployAuction,
  randomP2PKHAddress,
  reveal,
  revealFailed,
  transferAlphTo,
  withdraw,
  withdrawFailed
} from './utils'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import { testAddress } from '@alephium/web3-test'
import * as base58 from 'bs58'

describe('test auction', () => {
  const groupIndex = groupOfAddress(testAddress)
  const biddingDuration = 8 * 1000 // 8s
  const revealDuration = 8 * 1000 // 8s

  let auction: AuctionInstance
  let auctioneer: Address
  let beneficiaryAsset: string
  let beneficiaryAssetAmount: bigint
  let bidders: PrivateKeyWallet[]

  beforeEach(async () => {
    const now = Date.now()
    const biddingEnd = now + biddingDuration
    const revealEnd = now + biddingDuration + revealDuration
    auctioneer = randomP2PKHAddress(groupIndex)
    auction = (await deployAuction(auctioneer, biddingEnd, revealEnd)).contractInstance
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

  function getBidderContractId(bidderAddress: Address) {
    const bidderPath = base58.decode(bidderAddress)
    return subContractId(auction.contractId, bidderPath, groupIndex)
  }

  async function checkBidderState(bidder: PrivateKeyWallet, amount: bigint) {
    const bidderContractId = getBidderContractId(bidder.address)
    const bidderContract = Bidder.at(addressFromContractId(bidderContractId))
    const state = await bidderContract.fetchState()
    expect(state.asset.alphAmount).toEqual(amount + ONE_ALPH)
    expect(state.fields.address).toEqual(bidder.address)
    expect(state.fields.auction).toEqual(auction.contractId)
  }

  async function checkBlindedBid(
    bidder: PrivateKeyWallet,
    bidInfo: BidInfo,
    index: number,
    amount: bigint,
    revaled: boolean
  ) {
    const bidderContractId = getBidderContractId(bidder.address)
    const blindedBidPath = index.toString(16).padStart(16, '0')
    const blindedBidContractId = subContractId(bidderContractId, blindedBidPath, groupIndex)
    const state = await BlindedBid.at(addressFromContractId(blindedBidContractId)).fetchState()
    expect(state.asset.alphAmount).toEqual(amount + ONE_ALPH)
    expect(state.fields.data).toEqual(bidInfo.hash)
    expect(state.fields.revealed).toEqual(revaled)
    expect(state.fields.bidder).toEqual(bidderContractId)
  }

  async function assertBidderDestroyed(bidder: PrivateKeyWallet, bidSize: number) {
    const bidderContractId = getBidderContractId(bidder.address)
    for (let index = 0; index < bidSize; index++) {
      const blindedBidPath = index.toString(16).padStart(16, '0')
      const blindedBidContractId = subContractId(bidderContractId, blindedBidPath, groupIndex)
      const exists = await contractExists(addressFromContractId(blindedBidContractId))
      expect(exists).toEqual(false)
    }
    const bidderContractAddress = addressFromContractId(bidderContractId)
    const exists = await contractExists(bidderContractAddress)
    expect(exists).toEqual(false)
  }

  test('auction:bid', async () => {
    const bidder = bidders[0]
    const bidInfo0 = new BidInfo(alph(10), false, '00')
    const bidInfo1 = new BidInfo(alph(8), true, '01')
    const bidInfo2 = new BidInfo(alph(10), false, '02')
    const bidInfo3 = new BidInfo(alph(8), true, '03')
    await createBidder(bidder, auction)
    await bid(bidder, auction, bidInfo0.value, bidInfo0)
    await checkBlindedBid(bidder, bidInfo0, 0, bidInfo0.value, false)

    await bid(bidder, auction, 0n, bidInfo1)
    await checkBlindedBid(bidder, bidInfo1, 1, 0n, false)

    await bid(bidder, auction, alph(4), bidInfo2)
    await checkBlindedBid(bidder, bidInfo2, 2, alph(4), false)

    await bid(bidder, auction, 0n, bidInfo3)
    await checkBlindedBid(bidder, bidInfo3, 3, 0n, false)

    await revealFailed(
      bidder,
      auction,
      [bidInfo0, bidInfo1, bidInfo2, bidInfo3],
      Auction.consts.ErrorCodes.BiddingNotEnd
    )
  })

  test('auction:reveal invalid bidder', async () => {
    const bidder = bidders[0]
    const bidInfo0 = new BidInfo(alph(10), false, '00')
    const bidInfo1 = new BidInfo(alph(8), true, '01')
    await createBidder(bidder, auction)
    await bid(bidder, auction, alph(4), bidInfo0)
    await bid(bidder, auction, bidInfo1.value, bidInfo1)

    await sleep(10 * 1000)

    await reveal(bidder, auction, [bidInfo0, bidInfo1])
    await checkBlindedBid(bidder, bidInfo0, 0, 0n, true)
    await checkBlindedBid(bidder, bidInfo1, 1, 0n, true)
    await checkBidderState(bidder, 0n)
    await checkHighestBidder(ZERO_ADDRESS, 0n)

    await withdraw(bidder, auction)
    await assertBidderDestroyed(bidder, 2)
  }, 30000)

  test('auction:reveal one bidder', async () => {
    const bidder = bidders[0]
    const bidInfo0 = new BidInfo(alph(10), false, '00')
    const bidInfo1 = new BidInfo(alph(8), true, '01')
    const bidInfo2 = new BidInfo(alph(11), false, '02')
    await createBidder(bidder, auction)
    await bid(bidder, auction, alph(4), bidInfo0)
    await bid(bidder, auction, bidInfo1.value, bidInfo1)
    await bid(bidder, auction, alph(12), bidInfo2)

    await sleep(10 * 1000)

    await reveal(bidder, auction, [bidInfo0, bidInfo1, bidInfo2])
    await checkBlindedBid(bidder, bidInfo0, 0, 0n, true)
    await checkBlindedBid(bidder, bidInfo1, 1, 0n, true)
    await checkBlindedBid(bidder, bidInfo2, 2, 0n, true)
    await checkBidderState(bidder, bidInfo2.value)
    await checkHighestBidder(bidder.address, bidInfo2.value)

    await withdrawFailed(bidder, auction)
  }, 30000)

  test('auction:reveal', async () => {
    const [bidder0, bidder1] = bidders
    await createBidder(bidder0, auction)
    await createBidder(bidder1, auction)

    const bidInfo00 = new BidInfo(alph(10), false, '00')
    const bidInfo01 = new BidInfo(alph(8), true, '01')
    await bid(bidder0, auction, alph(14), bidInfo00)
    await bid(bidder0, auction, 0n, bidInfo01)

    const bidInfo10 = new BidInfo(alph(12), false, '00')
    const bidInfo11 = new BidInfo(alph(5), true, '01')
    await bid(bidder1, auction, alph(13), bidInfo10)
    await bid(bidder1, auction, 0n, bidInfo11)

    await sleep(10 * 1000)

    await reveal(bidder0, auction, [bidInfo00, bidInfo01])
    await checkBlindedBid(bidder0, bidInfo00, 0, 0n, true)
    await checkBlindedBid(bidder0, bidInfo01, 1, 0n, true)
    await checkBidderState(bidder0, bidInfo00.value)
    await checkHighestBidder(bidder0.address, bidInfo00.value)
    await withdrawFailed(bidder0, auction)

    await reveal(bidder1, auction, [bidInfo10, bidInfo11])
    await checkBlindedBid(bidder1, bidInfo10, 0, 0n, true)
    await checkBlindedBid(bidder1, bidInfo11, 1, 0n, true)
    await checkBidderState(bidder1, bidInfo10.value)
    await checkHighestBidder(bidder1.address, bidInfo10.value)
    await withdrawFailed(bidder1, auction)

    await withdraw(bidder0, auction)
    await assertBidderDestroyed(bidder0, 2)
  }, 30000)

  test('auction:auction end', async () => {
    const [bidder0, bidder1] = bidders
    await createBidder(bidder0, auction)
    await createBidder(bidder1, auction)

    const bidInfo00 = new BidInfo(alph(10), false, '00')
    const bidInfo01 = new BidInfo(alph(8), true, '01')
    await bid(bidder0, auction, alph(14), bidInfo00)
    await bid(bidder0, auction, 0n, bidInfo01)

    const bidInfo10 = new BidInfo(alph(12), false, '00')
    const bidInfo11 = new BidInfo(alph(5), true, '01')
    await bid(bidder1, auction, alph(13), bidInfo10)
    await bid(bidder1, auction, 0n, bidInfo11)

    await sleep(10 * 1000)

    await reveal(bidder0, auction, [bidInfo00, bidInfo01])
    await reveal(bidder1, auction, [bidInfo10, bidInfo11])
    await checkHighestBidder(bidder1.address, bidInfo10.value)
    await auctionEndFailed(bidder1, auction, Auction.consts.ErrorCodes.RevealNotEnd)

    await sleep(10 * 1000)

    await auctionEnd(bidder1, auction)
    await assertBidderDestroyed(bidder1, 2)

    const auctioneerBalance = await balanceOf(ALPH_TOKEN_ID, auctioneer)
    expect(auctioneerBalance).toEqual(bidInfo10.value)

    const beneficiaryAmount = await balanceOf(beneficiaryAsset, bidder1.address)
    expect(beneficiaryAmount).toEqual(beneficiaryAssetAmount)

    await withdraw(bidder0, auction)
    await assertBidderDestroyed(bidder0, 2)

    await auctionEndFailed(bidder1, auction, Auction.consts.ErrorCodes.AuctionEndAlreadyCalled)

    await bidFailed(bidder0, auction, 0n, bidInfo00, Auction.consts.ErrorCodes.BiddingAlreadyEnded)
    await revealFailed(bidder0, auction, [bidInfo00, bidInfo11], Auction.consts.ErrorCodes.RevealAlreadyEnded)
  }, 30000)
})
