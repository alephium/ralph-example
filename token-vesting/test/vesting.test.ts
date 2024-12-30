import { addressFromContractId, groupOfAddress, subContractId, utils, web3 } from '@alephium/web3'
import { getSigner, getSigners, testAddress } from '@alephium/web3-test'
import { Metadata, VestingInstance } from '../artifacts/ts'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import {
  addRecipient,
  addRecipients,
  alph,
  deployVestingContract,
  generateMilestones,
  initialize,
  MilestoneInfo,
  updateNextMilestoneIndex,
  addRecipientFailed,
  initializeFailed,
  claim,
  claimFailed,
  groupIndex,
  mineBlocks
} from './utils'
import * as base58 from 'bs58'

describe('01 admin tests', () => {
  let vesting: VestingInstance
  let manager: PrivateKeyWallet
  let users: PrivateKeyWallet[]
  let milestones: MilestoneInfo[]
  let amounts: bigint[]
  let startTime: number

  beforeAll(async () => {
    startTime = new Date().getTime()
    milestones = generateMilestones(startTime, 10, 10, 0)
    manager = await getSigner(alph(5000), groupIndex)
    vesting = (await deployVestingContract(manager.address, startTime)).contractInstance
    users = await getSigners(6, alph(100), groupIndex)
    amounts = [alph(100), alph(110), alph(120), alph(130), alph(140), alph(150)]
  }, 30000)

  async function getUserMetadata(user: PrivateKeyWallet) {
    const path = utils.binToHex(base58.decode(user.address))
    const metadataContractId = subContractId(vesting.contractId, path, groupIndex)
    const metadataContract = Metadata.at(addressFromContractId(metadataContractId))
    const state = await metadataContract.fetchState()
    return state
  }

  async function checkUserLockedAmount(user: PrivateKeyWallet, lockedAmount: bigint) {
    const state = await getUserMetadata(user)
    expect(state.fields.lockedAmount).toEqual(lockedAmount)
    expect(state.fields.address).toEqual(user.address)
    expect(state.fields.vesting).toEqual(vesting.contractId)
  }

  test('test: admin initialize vesting', async () => {
    // initialize with 10 milestones
    await initialize(manager, vesting, milestones)
    const milestoneResult = await vesting.view.getTotalMilestones()
    expect(milestoneResult.returns).toEqual(10n)
  }, 30000)

  test('test: admin can initialize only once', async () => {
    // initialize with 10 milestones
    await initializeFailed(manager, vesting, milestones, 12n)
  }, 30000)

  test('test: admin add single recipient', async () => {
    const user1 = users[0]
    const lockedAmount = amounts[0]

    await addRecipient(manager, vesting, user1.address, lockedAmount)
    const recipientsResult = await vesting.view.getTotalRecipients()
    expect(recipientsResult.returns).toEqual(1n)

    await checkUserLockedAmount(user1, lockedAmount)
  }, 30000)

  test('test: admin cannot add same recipient twice', async () => {
    const user1 = users[0]
    const lockedAmount = amounts[0]
    await addRecipientFailed(manager, vesting, user1.address, lockedAmount, 8n)
  }, 30000)

  test('test: admin add multiple recipients', async () => {
    const usersWallet = users.slice(1, 6)
    const addresses = usersWallet.map((user) => user.address)
    const remAmounts = amounts.slice(1, 6)
    const totalAmount = alph(650)

    await addRecipients(manager, vesting, addresses, remAmounts, totalAmount)

    const recipientsResult = await vesting.view.getTotalRecipients()
    expect(recipientsResult.returns).toEqual(6n)
    const totalLockedResult = await vesting.view.getTotalLocked()
    expect(totalLockedResult.returns).toEqual(totalAmount + alph(100))

    for (let i = 0; i < usersWallet.length; i++) {
      const user = usersWallet[i]
      const lockedAmount = remAmounts[i]
      await checkUserLockedAmount(user, lockedAmount)
    }
  }, 30000)

  test('test: can update next milestone if no claim', async () => {
    const currentNextMilestoneRes = await vesting.view.getNextMilestone()
    // mine future blocks to complete first milestone
    await mineBlocks(10, 1000)
    await updateNextMilestoneIndex(manager, vesting, currentNextMilestoneRes.returns)
    const updatedRecordRes = await vesting.view.getNextMilestone()
    expect(updatedRecordRes.returns).toEqual(currentNextMilestoneRes.returns + 1n)
  }, 50000)
})

describe('02 cliff tests', () => {
  const groupIndex = groupOfAddress(testAddress)
  let vesting: VestingInstance
  let manager: PrivateKeyWallet
  let users: PrivateKeyWallet[]
  let milestones: MilestoneInfo[]
  let amounts: bigint[]
  let startTime: number

  beforeAll(async () => {
    startTime = new Date().getTime()
    milestones = generateMilestones(startTime, 10, 10, 0)
    manager = await getSigner(alph(5000), groupIndex)
    vesting = (await deployVestingContract(manager.address, startTime)).contractInstance
    users = await getSigners(5, alph(100), groupIndex)
    amounts = [alph(100), alph(110), alph(120), alph(130), alph(140)]
    const addresses = users.map((user) => user.address)
    const totalAmount = amounts.reduce((acc, amt) => acc + amt, 0n)
    await initialize(manager, vesting, milestones)
    await addRecipients(manager, vesting, addresses, amounts, totalAmount)
  }, 30000)

  async function getUserMetadata(user: PrivateKeyWallet) {
    const path = utils.binToHex(base58.decode(user.address))
    const metadataContractId = subContractId(vesting.contractId, path, groupIndex)
    const metadataContract = Metadata.at(addressFromContractId(metadataContractId))
    const state = await metadataContract.fetchState()
    return state
  }

  async function checkUserClaimId(user: PrivateKeyWallet, claimId: bigint) {
    const state = await getUserMetadata(user)
    expect(state.fields.claimIndex).toEqual(claimId)
    expect(state.fields.address).toEqual(user.address)
    expect(state.fields.vesting).toEqual(vesting.contractId)
  }

  async function checkUserTotalClaimed(user: PrivateKeyWallet, totalClaimed: bigint) {
    const state = await getUserMetadata(user)
    expect(state.fields.totalClaimed).toEqual(totalClaimed)
    expect(state.fields.address).toEqual(user.address)
    expect(state.fields.vesting).toEqual(vesting.contractId)
  }

  test('test: user cannot claim milestone until milestone reached', async () => {
    const user = users[0]
    const claimable = await vesting.view.getClaimableAmount({ args: { address: user.address } })
    expect(claimable.returns).toEqual(0n)
    await claimFailed(user, vesting, 11n)
  }, 300000)

  test('test: user claim milestone when milestone reached', async () => {
    // a milestone duration is set to 10 seconds
    // so we mine 10 blocks with a 1 second delay
    await mineBlocks(10, 1000)
    const user = users[0]
    const amountLocked = amounts[0]

    let percentage = (milestones[0].percentage * 100n) / BigInt(1e18)
    let expectedAmount = (percentage * amountLocked) / 100n
    let claimable = await vesting.view.getClaimableAmount({ args: { address: user.address } })
    expect(claimable.returns).toEqual(expectedAmount)

    await claim(user, vesting)
    await checkUserTotalClaimed(user, claimable.returns)

    let nextMilestoneRes = await vesting.view.getNextMilestone()
    await checkUserClaimId(user, nextMilestoneRes.returns)
    expect(nextMilestoneRes.returns).toEqual(1n)

    // so mine another 10 blocks with a 1 second delay
    // to claim second milestone
    await mineBlocks(10, 1000)

    const previouslyClaimed = (await getUserMetadata(user)).fields.totalClaimed
    percentage = ((milestones[1].percentage - milestones[0].percentage) * 100n) / BigInt(1e18)
    expectedAmount = (percentage * amountLocked) / 100n

    claimable = await vesting.view.getClaimableAmount({ args: { address: user.address } })
    expect(claimable.returns).toEqual(expectedAmount)

    await claim(user, vesting)
    await checkUserTotalClaimed(user, claimable.returns + previouslyClaimed)

    nextMilestoneRes = await vesting.view.getNextMilestone()
    expect(nextMilestoneRes.returns).toEqual(2n)
    await checkUserClaimId(user, nextMilestoneRes.returns)
  }, 300000)
})

describe('03 linear tests', () => {
  const groupIndex = groupOfAddress(testAddress)
  let vesting: VestingInstance
  let manager: PrivateKeyWallet
  let users: PrivateKeyWallet[]
  let milestones: MilestoneInfo[]
  let amounts: bigint[]
  let startTime: number

  beforeAll(async () => {
    startTime = new Date().getTime()
    milestones = generateMilestones(startTime, 10, 30, 1)
    manager = await getSigner(alph(5000), groupIndex)
    vesting = (await deployVestingContract(manager.address, startTime)).contractInstance
    users = await getSigners(5, alph(100), groupIndex)
    amounts = [alph(100), alph(110), alph(120), alph(130), alph(140)]
    const addresses = users.map((user) => user.address)
    const totalAmount = amounts.reduce((acc, amt) => acc + amt, 0n)
    await initialize(manager, vesting, milestones)
    await addRecipients(manager, vesting, addresses, amounts, totalAmount)
  }, 30000)

  async function getUserMetadata(user: PrivateKeyWallet) {
    const path = utils.binToHex(base58.decode(user.address))
    const metadataContractId = subContractId(vesting.contractId, path, groupIndex)
    const metadataContract = Metadata.at(addressFromContractId(metadataContractId))
    const state = await metadataContract.fetchState()
    return state
  }

  async function checkUserClaimId(user: PrivateKeyWallet, claimId: bigint) {
    const state = await getUserMetadata(user)
    expect(state.fields.claimIndex).toEqual(claimId)
    expect(state.fields.address).toEqual(user.address)
    expect(state.fields.vesting).toEqual(vesting.contractId)
  }

  async function checkUserTotalClaimed(user: PrivateKeyWallet, totalClaimed: bigint) {
    const state = await getUserMetadata(user)
    expect(state.fields.totalClaimed).toBeGreaterThan(totalClaimed)
    expect(state.fields.address).toEqual(user.address)
    expect(state.fields.vesting).toEqual(vesting.contractId)
  }

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

  test('test: user can claim part of when milestone not reached', async () => {
    // milestone duration is set as 30 seconds
    await mineBlocks(2, 1000)

    let currTime = await getBlockTimestamp()
    const user = users[0]
    const amountLocked = amounts[0]
    const milestone = milestones[0]

    let percentage =
      ((BigInt(currTime) - BigInt(startTime)) * milestone.percentage) / (milestone.timestamp - BigInt(startTime))

    let expectedAmount = (percentage * amountLocked) / BigInt(1e18)
    const claimable = await vesting.view.getClaimableAmount({ args: { address: user.address } })
    expect(claimable.returns).toBeGreaterThan(expectedAmount)
    await claim(user, vesting)
    await checkUserTotalClaimed(user, claimable.returns)

    // check that the nextmilestone has not updated
    let nextMilestoneRes = await vesting.view.getNextMilestone()
    await checkUserClaimId(user, nextMilestoneRes.returns)
    expect(nextMilestoneRes.returns).toEqual(0n)
  }, 300000)
})
