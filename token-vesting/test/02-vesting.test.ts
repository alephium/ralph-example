import { addressFromContractId, subContractId, utils } from '@alephium/web3'
import { expectAssertionError, getSigner } from '@alephium/web3-test'
import { Metadata, VestingInstance } from '../artifacts/ts'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import {
  addVestingSchedule,
  alph,
  deployVestingContract,
  claim,
  claimFailed,
  groupIndex,
  mineBlocks,
  generateSchedule,
  balanceOf,
  endVesting,
  endVestingFailed
} from './utils'
import base58 from 'bs58'

describe('TimeFunctionality Tests', () => {
  let vesting: VestingInstance
  let manager: PrivateKeyWallet
  let fakeManager: PrivateKeyWallet
  let user: PrivateKeyWallet
  const lockedAmount = alph(100)
  let tokenId: string

  beforeEach(async () => {
    manager = await getSigner(alph(5000), groupIndex)
    fakeManager = await getSigner(alph(100), groupIndex)
    vesting = (await deployVestingContract(manager.address)).contractInstance
    user = await getSigner(alph(50), groupIndex)

    // generates schedule with cliff
    const duration = 10
    const schedule = generateSchedule(duration, true)
    const tokenIdResult = await vesting.view.getTokenId()
    tokenId = tokenIdResult.returns
    await addVestingSchedule(
      manager,
      vesting,
      tokenId,
      user.address,
      schedule.startTime,
      schedule.cliffTime,
      schedule.endTime,
      lockedAmount
    )
  }, 10000)

  async function getUserMetadata(user: PrivateKeyWallet) {
    const path = utils.binToHex(base58.decode(user.address))
    const metadataContractId = subContractId(vesting.contractId, path, groupIndex)
    addressFromContractId(metadataContractId)
    const metadataContract = Metadata.at(addressFromContractId(metadataContractId))
    const state = await metadataContract.fetchState()
    return state
  }

  async function checkUserLockedAmount(user: PrivateKeyWallet, lockedAmount: bigint) {
    const state = await getUserMetadata(user)
    expect(state.fields.totalAmount).toEqual(lockedAmount)
    expect(state.fields.address).toEqual(user.address)
    expect(state.fields.vesting).toEqual(vesting.contractId)
  }

  async function checkUserClaimedAmount(user: PrivateKeyWallet, claimedAmount: bigint) {
    const state = await getUserMetadata(user)
    expect(state.fields.totalClaimed).toBeGreaterThanOrEqual(claimedAmount)
    expect(state.fields.address).toEqual(user.address)
    expect(state.fields.vesting).toEqual(vesting.contractId)
  }

  test('user cannot claim if cliff not reached', async () => {
    await checkUserLockedAmount(user, lockedAmount)
    await claimFailed(user, vesting, 8n)
  }, 30000)

  test('user can claim part if cliff exceeded', async () => {
    await checkUserLockedAmount(user, lockedAmount)

    // mine 4 blocks for 4 seconds as cliff is 20% of duration i.e 2 seconds + startime
    await mineBlocks(4, 1000)

    const prevBalance = await balanceOf(tokenId, user.address)
    const vestingSchedule = await vesting.view.getUserVestingSchedule({ args: { address: user.address } })
    const claimable = vestingSchedule.returns.totalAmountVested - vestingSchedule.returns.totalClaimed

    await claim(user, vesting)
    const currBalance = await balanceOf(tokenId, user.address)
    expect(currBalance).toBeGreaterThanOrEqual(prevBalance + claimable)
    await checkUserClaimedAmount(user, claimable)
    expect(claimable).toBeLessThan(vestingSchedule.returns.lockedAmount)
  }, 30000)

  test('user can claim all after vesting period', async () => {
    await checkUserLockedAmount(user, lockedAmount)

    await mineBlocks(12, 1000)

    const prevBalance = await balanceOf(tokenId, user.address)
    const vestingSchedule = await vesting.view.getUserVestingSchedule({ args: { address: user.address } })
    const claimable = vestingSchedule.returns.totalAmountVested - vestingSchedule.returns.totalClaimed

    await claim(user, vesting)
    const currBalance = await balanceOf(tokenId, user.address)
    expect(currBalance).toEqual(prevBalance + claimable)
    await checkUserClaimedAmount(user, claimable)
    expect(claimable).toEqual(vestingSchedule.returns.lockedAmount)
  }, 30000)

  test('admin can get refund before cliff', async () => {
    await checkUserLockedAmount(user, lockedAmount)
    const prevBalance = await balanceOf(tokenId, manager.address)
    await endVesting(manager, vesting, user.address, manager.address)
    const currBalance = await balanceOf(tokenId, manager.address)
    expect(currBalance).toBeGreaterThanOrEqual(prevBalance + lockedAmount)
  }, 30000)

  test('admin can get refund after cliff', async () => {
    await checkUserLockedAmount(user, lockedAmount)
    await mineBlocks(4, 1000)

    const vestingSchedule = await vesting.view.getUserVestingSchedule({ args: { address: user.address } })
    const refundable = vestingSchedule.returns.lockedAmount - vestingSchedule.returns.totalAmountVested
    const prevBalance = await balanceOf(tokenId, manager.address)
    await endVesting(manager, vesting, user.address, manager.address)
    const currBalance = await balanceOf(tokenId, manager.address)

    // by time claim, refundable would have reduced by a short amount
    expect(currBalance).toBeGreaterThan(prevBalance)
    expect(currBalance).toBeLessThanOrEqual(prevBalance + refundable)
  }, 30000)

  test('user gets claimable after cliff when vesting ended', async () => {
    await checkUserLockedAmount(user, lockedAmount)

    await mineBlocks(4, 1000)

    const vestingSchedule = await vesting.view.getUserVestingSchedule({ args: { address: user.address } })
    const claimable = vestingSchedule.returns.totalAmountVested - vestingSchedule.returns.totalClaimed
    const prevBalance = await balanceOf(tokenId, user.address)
    await endVesting(manager, vesting, user.address, manager.address)
    const currBalance = await balanceOf(tokenId, user.address)
    expect(currBalance).toBeGreaterThanOrEqual(prevBalance + claimable)
  }, 30000)

  test('schedule is removed when vesting is ended', async () => {
    await checkUserLockedAmount(user, lockedAmount)

    await endVesting(manager, vesting, user.address, manager.address)

    await expectAssertionError(
      vesting.view.getUserVestingSchedule({ args: { address: user.address } }),
      vesting.address,
      6
    )
  }, 30000)

  test('non admin can not end vesting', async () => {
    await checkUserLockedAmount(user, lockedAmount)
    await endVestingFailed(fakeManager, vesting, user.address, manager.address, 0n)
  }, 30000)
})
