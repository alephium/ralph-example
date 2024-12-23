import { addressFromContractId, groupOfAddress, sleep, subContractId, utils, web3 } from '@alephium/web3'
import { getSigner, getSigners, testAddress } from '@alephium/web3-test'
import { Metadata, TokenVestingInstance } from '../artifacts/ts'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import {
  addRecipient,
  addRecipients,
  alph,
  claim,
  deployVestingContract,
  generateMilestones,
  initialize,
  MilestoneInfo,
  claimFailed,
  updateNextMilestoneIndex
} from './utils'
import * as base58 from 'bs58'

describe('test cliff vesting flow', () => {
  const groupIndex = groupOfAddress(testAddress)
  let tokenVesting: TokenVestingInstance
  let manager: PrivateKeyWallet
  let users: PrivateKeyWallet[]
  let milestones: MilestoneInfo[]
  let amounts: bigint[]
  let startTime: number

  beforeAll(async () => {
    startTime = new Date().getTime()
    milestones = generateMilestones(startTime, 10, 0.5, 0)
    manager = await getSigner(alph(5000), groupIndex)
    tokenVesting = (await deployVestingContract(manager.address, startTime)).contractInstance
    users = await getSigners(6, alph(100), groupIndex)
    amounts = [alph(100), alph(110), alph(120), alph(130), alph(140), alph(150)]
  })

  async function getBlockTimestamp() {
    const nodeProvider = web3.getCurrentNodeProvider()
    const blockinfo = await nodeProvider.blockflow.getBlockflowChainInfo({ fromGroup: groupIndex, toGroup: groupIndex })
    const hashes = await nodeProvider.blockflow.getBlockflowHashes({
      fromGroup: groupIndex,
      toGroup: groupIndex,
      height: blockinfo.currentHeight
    })
    const block = await nodeProvider.blockflow.getBlockflowBlocksBlockHash(hashes.headers[0])
    return block.timestamp
  }

  async function mineBlock() {
    const nodeProvider = web3.getCurrentNodeProvider()
    return await nodeProvider.miners.postMinersCpuMiningMineOneBlock({ fromGroup: groupIndex, toGroup: groupIndex })
  }

  async function mineBlocks(numBlocks: number, delay: number) {
    // waitTime would be noOfBlocks * delay
    for (let i = 0; i < numBlocks; i++) {
      await mineBlock()
      await sleep(delay)
    }
  }

  async function getUserMetadata(user: PrivateKeyWallet) {
    const path = utils.binToHex(base58.decode(user.address))
    const metadataContractId = subContractId(tokenVesting.contractId, path, groupIndex)
    const metadataContract = Metadata.at(addressFromContractId(metadataContractId))
    const state = await metadataContract.fetchState()
    return state
  }

  async function checkUserClaimId(user: PrivateKeyWallet, claimId: bigint) {
    const state = await getUserMetadata(user)
    expect(state.fields.claimIndex).toEqual(claimId)
    expect(state.fields.address).toEqual(user.address)
    expect(state.fields.vesting).toEqual(tokenVesting.contractId)
  }

  async function checkUserTotalClaimed(user: PrivateKeyWallet, totalClaimed: bigint) {
    const state = await getUserMetadata(user)
    expect(state.fields.totalClaimed).toEqual(totalClaimed)
    expect(state.fields.address).toEqual(user.address)
    expect(state.fields.vesting).toEqual(tokenVesting.contractId)
  }

  async function checkUserLockedAmount(user: PrivateKeyWallet, lockedAmount: bigint) {
    const state = await getUserMetadata(user)
    expect(state.fields.lockedAmount).toEqual(lockedAmount)
    expect(state.fields.address).toEqual(user.address)
    expect(state.fields.vesting).toEqual(tokenVesting.contractId)
  }

  test('test: admin initialize vesting', async () => {
    // initialize with 10 milestones
    await initialize(manager, tokenVesting, milestones)
    const milestoneResult = await tokenVesting.view.getTotalMilestones()
    expect(milestoneResult.returns).toEqual(10n)
  }, 30000)

  test('test: admin add single recipient', async () => {
    const user1 = users[0]
    const lockedAmount = amounts[0]

    await addRecipient(manager, tokenVesting, user1.address, lockedAmount)
    const recipientsResult = await tokenVesting.view.getTotalRecipients()
    expect(recipientsResult.returns).toEqual(1n)

    await checkUserLockedAmount(user1, lockedAmount)
  }, 30000)

  test('test: admin add multiple recipients', async () => {
    const usersWallet = users.slice(1, 6)
    const addresses = usersWallet.map((user) => user.address)
    const remAmounts = amounts.slice(1, 6)
    const totalAmount = alph(650)

    await addRecipients(manager, tokenVesting, addresses, remAmounts, totalAmount)

    const recipientsResult = await tokenVesting.view.getTotalRecipients()
    expect(recipientsResult.returns).toEqual(6n)
    const totalLockedResult = await tokenVesting.view.getTotalLocked()
    expect(totalLockedResult.returns).toEqual(totalAmount + alph(100))

    for (let i = 0; i < usersWallet.length; i++) {
      const user = usersWallet[i]
      const lockedAmount = remAmounts[i]
      await checkUserLockedAmount(user, lockedAmount)
    }
  }, 30000)

  test('test: user cannot claim milestone until milestone reached', async () => {
    const user = users[0]
    const claimable = await tokenVesting.view.getClaimableAmount({ args: { address: user.address } })
    expect(claimable.returns).toEqual(0n)
    await claimFailed(user, tokenVesting, 11n)
  }, 300000)

  test('test: user claim milestone when milestone reached', async () => {
    // a milestone duration is set to 30 seconds
    // so we mine 30 blocks with a 1 second delay
    await mineBlocks(30, 1000)
    const user = users[0]
    const amountLocked = amounts[0]

    let percentage = (milestones[0].percentage * 100n) / BigInt(1e18)
    let expectedAmount = (percentage * amountLocked) / 100n
    let claimable = await tokenVesting.view.getClaimableAmount({ args: { address: user.address } })
    expect(claimable.returns).toEqual(expectedAmount)

    await claim(user, tokenVesting)
    await checkUserTotalClaimed(user, claimable.returns)

    let nextMilestoneRes = await tokenVesting.view.getNextMilestone()
    await checkUserClaimId(user, nextMilestoneRes.returns)
    expect(nextMilestoneRes.returns).toEqual(1n)

    // so mine another 30 blocks with a 1 second delay
    // to claim second milestone
    await mineBlocks(30, 1000)

    const previouslyClaimed = (await getUserMetadata(user)).fields.totalClaimed
    percentage = ((milestones[1].percentage - milestones[0].percentage) * 100n) / BigInt(1e18)
    expectedAmount = (percentage * amountLocked) / 100n

    claimable = await tokenVesting.view.getClaimableAmount({ args: { address: user.address } })
    expect(claimable.returns).toEqual(expectedAmount)

    await claim(user, tokenVesting)
    await checkUserTotalClaimed(user, claimable.returns + previouslyClaimed)

    nextMilestoneRes = await tokenVesting.view.getNextMilestone()
    expect(nextMilestoneRes.returns).toEqual(2n)
    await checkUserClaimId(user, nextMilestoneRes.returns)
  }, 300000)
})
