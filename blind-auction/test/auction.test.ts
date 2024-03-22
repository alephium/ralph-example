import { ALPH_TOKEN_ID, Address, groupOfAddress, sleep } from '@alephium/web3'
import { Auction, AuctionInstance } from '../artifacts/ts'
import {
  BidInfo,
  ZERO_ADDRESS,
  alph,
  auctionEnd,
  auctionEndFailed,
  balanceOf,
  bid,
  bidFailed,
  deployAuction,
  randomP2PKHAddress,
  reveal,
  revealFailed
} from './utils'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import { getSigners, testAddress } from '@alephium/web3-test'

describe('test auction', () => {
  const groupIndex = groupOfAddress(testAddress)
  const biddingDuration = 8 * 1000 // 8s
  const revealDuration = 8 * 1000 // 8s

  let auction: AuctionInstance
  let beneficiary: Address
  let bidders: PrivateKeyWallet[]

  beforeEach(async () => {
    const now = Date.now()
    const biddingEnd = now + biddingDuration
    const revealEnd = now + biddingDuration + revealDuration
    beneficiary = randomP2PKHAddress(groupIndex)
    bidders = await getSigners(2, alph(1000), groupIndex)
    auction = (await deployAuction(beneficiary, biddingEnd, revealEnd)).contractInstance
  })

  async function checkHighestBidder(address: Address, amount: bigint) {
    const state = await auction.fetchState()
    expect(state.fields.highestBidder).toEqual(address)
    expect(state.fields.highestBid).toEqual(amount)
  }

  async function checkBid(
    auction: AuctionInstance,
    bidder: Address,
    blindedBid: string,
    index: number,
    deposit: bigint
  ) {
    const result = await auction.methods.getBid({args: { bidder, index: BigInt(index) }})
    expect(result.returns).toEqual({ blindedBid, deposit })
  }

  async function checkBidRemoved(auction: AuctionInstance, bidder: Address, index: number) {
    try {
      await auction.methods.getBid({ args: { bidder, index: BigInt(index) } })
    } catch (error: any) {
      expect(error?.message).toContain('does not exist')
    }
  }

  async function checkBidNum(auction: AuctionInstance, bidder: Address, expected: number) {
    const result = await auction.methods.getBidNum({ args: { bidder } })
    expect(result.returns).toEqual(BigInt(expected))
  }

  test('auction:bid', async () => {
    const bidder = bidders[0]
    const bidInfo0 = new BidInfo(alph(10), false, '00')
    const bidInfo1 = new BidInfo(alph(8), true, '01')
    const bidInfo2 = new BidInfo(alph(10), false, '02')
    const bidInfo3 = new BidInfo(alph(8), true, '03')
    await checkBidNum(auction, bidder.address, 0)
    await bid(bidder, auction, bidInfo0.value, bidInfo0)
    await checkBid(auction, bidder.address, bidInfo0.hash, 0, bidInfo0.value)
    await checkBidNum(auction, bidder.address, 1)

    await bid(bidder, auction, 0n, bidInfo1)
    await checkBid(auction, bidder.address, bidInfo1.hash, 1, 0n)
    await checkBidNum(auction, bidder.address, 2)

    await bid(bidder, auction, alph(4), bidInfo2)
    await checkBid(auction, bidder.address, bidInfo2.hash, 2, alph(4))
    await checkBidNum(auction, bidder.address, 3)

    await bid(bidder, auction, 0n, bidInfo3)
    await checkBid(auction, bidder.address, bidInfo3.hash, 3, 0n)
    await checkBidNum(auction, bidder.address, 4)

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
    await bid(bidder, auction, alph(4), bidInfo0)
    await bid(bidder, auction, bidInfo1.value, bidInfo1)
    await checkBidNum(auction, bidder.address, 2)

    await sleep(10 * 1000)

    await reveal(bidder, auction, [bidInfo0, bidInfo1])
    await checkBidRemoved(auction, bidder.address, 0)
    await checkBidRemoved(auction, bidder.address, 1)
    await checkBidNum(auction, bidder.address, 0)
    await checkHighestBidder(ZERO_ADDRESS, 0n)
  }, 30000)

  test('auction:reveal one bidder', async () => {
    const bidder = bidders[0]
    const bidInfo0 = new BidInfo(alph(10), false, '00')
    const bidInfo1 = new BidInfo(alph(8), true, '01')
    const bidInfo2 = new BidInfo(alph(11), false, '02')
    await bid(bidder, auction, alph(4), bidInfo0)
    await bid(bidder, auction, bidInfo1.value, bidInfo1)
    await bid(bidder, auction, alph(12), bidInfo2)

    await sleep(10 * 1000)

    await reveal(bidder, auction, [bidInfo0, bidInfo1, bidInfo2])
    await checkBidNum(auction, bidder.address, 0)
    await checkHighestBidder(bidder.address, bidInfo2.value)
  }, 30000)

  test('auction:reveal', async () => {
    const [bidder0, bidder1] = bidders

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
    await checkHighestBidder(bidder0.address, bidInfo00.value)

    await reveal(bidder1, auction, [bidInfo10, bidInfo11])
    await checkHighestBidder(bidder1.address, bidInfo10.value)
  }, 30000)

  test('auction:auction end', async () => {
    const [bidder0, bidder1] = bidders

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

    const beneficiaryAmount = await balanceOf(ALPH_TOKEN_ID, beneficiary)
    expect(beneficiaryAmount).toEqual(alph(12))

    await checkBidNum(auction, bidder0.address, 0)
    await checkBidNum(auction, bidder1.address, 0)

    await auctionEndFailed(bidder1, auction, Auction.consts.ErrorCodes.AuctionEndAlreadyCalled)
    await bidFailed(bidder0, auction, 0n, bidInfo00, Auction.consts.ErrorCodes.BiddingAlreadyEnded)
    await revealFailed(bidder0, auction, [bidInfo00, bidInfo11], Auction.consts.ErrorCodes.RevealAlreadyEnded)
  }, 30000)
})
