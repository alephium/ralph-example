import {
  addressFromContractId,
  ALPH_TOKEN_ID,
  DUST_AMOUNT,
  groupOfAddress,
  subContractId,
  utils,
  web3
} from '@alephium/web3'
import { expectAssertionError, getSigner, getSigners, testAddress } from '@alephium/web3-test'
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
  const tolerance = alph(1)

  beforeEach(async () => {
    manager = await getSigner(alph(5000), groupIndex)
    fakeManager = await getSigner(alph(100), groupIndex)
    vesting = (await deployVestingContract(manager.address)).contractInstance
    user = await getSigner(alph(50), groupIndex)

    // generates schedule with cliff
    const duration = 10
    const schedule = generateSchedule(duration, true)
    await addVestingSchedule(
      manager,
      vesting,
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

    const prevBalance = await balanceOf(ALPH_TOKEN_ID, user.address)
    const vestingSchedule = await vesting.view.getUserVestingSchedule({ args: { address: user.address } })
    const claimable = vestingSchedule.returns.totalAmountVested - vestingSchedule.returns.totalClaimed

    await claim(user, vesting)
    const currBalance = await balanceOf(ALPH_TOKEN_ID, user.address)
    expect(currBalance).toBeGreaterThan(prevBalance + claimable - DUST_AMOUNT)
    await checkUserClaimedAmount(user, claimable)
    expect(claimable).toBeLessThan(vestingSchedule.returns.lockedAmount)
  }, 30000)

  test('user can claim all after vesting period', async () => {
    await checkUserLockedAmount(user, lockedAmount)

    await mineBlocks(12, 1000)

    const prevBalance = await balanceOf(ALPH_TOKEN_ID, user.address)
    const vestingSchedule = await vesting.view.getUserVestingSchedule({ args: { address: user.address } })
    const claimable = vestingSchedule.returns.totalAmountVested - vestingSchedule.returns.totalClaimed

    await claim(user, vesting)
    const currBalance = await balanceOf(ALPH_TOKEN_ID, user.address)
    expect(currBalance).toBeGreaterThan(prevBalance)
    await checkUserClaimedAmount(user, claimable)
    expect(claimable).toEqual(vestingSchedule.returns.lockedAmount)
  }, 30000)

  test('admin can get refund before cliff', async () => {
    await checkUserLockedAmount(user, lockedAmount)

    const prevBalance = await balanceOf(ALPH_TOKEN_ID, manager.address)
    await endVesting(manager, vesting, user.address, manager.address)
    const currBalance = await balanceOf(ALPH_TOKEN_ID, manager.address)
    expect(currBalance + tolerance).toBeGreaterThanOrEqual(prevBalance + lockedAmount)
  }, 30000)

  // test('admin can get refund after cliff', async () => {
  //   await checkUserLockedAmount(user, lockedAmount)
  //   await mineBlocks(4, 1000)

  //   const vestingSchedule = await vesting.view.getUserVestingSchedule({ args: { address: user.address } })
  //   const refundable = vestingSchedule.returns.lockedAmount - vestingSchedule.returns.totalAmountVested

  //   const prevBalance = await balanceOf(ALPH_TOKEN_ID, manager.address)
  //   await endVesting(manager, vesting, user.address, manager.address)
  //   const currBalance = await balanceOf(ALPH_TOKEN_ID, manager.address)

  //   expect(currBalance + tolerance).toBeGreaterThanOrEqual(prevBalance + refundable)
  // }, 30000)

  // test('user gets claimable after cliff when vesting ended', async () => {
  //   await checkUserLockedAmount(user, lockedAmount)

  //   await mineBlocks(4, 1000)

  //   const vestingSchedule = await vesting.view.getUserVestingSchedule({ args: { address: user.address } })
  //   const claimable = vestingSchedule.returns.totalAmountVested - vestingSchedule.returns.totalClaimed

  //   const prevBalance = await balanceOf(ALPH_TOKEN_ID, user.address)
  //   await endVestingFailed(fakeManager, vesting, user.address, manager.address, 0n)
  //   const currBalance = await balanceOf(ALPH_TOKEN_ID, user.address)
  //   expect(currBalance + tolerance).toBeGreaterThan(prevBalance + claimable)
  // }, 30000)

  test('schedule is removed when vesting is ended', async () => {
    await checkUserLockedAmount(user, lockedAmount)

    await endVesting(manager, vesting, user.address, manager.address)

    await expectAssertionError(
      vesting.view.getUserVestingSchedule({ args: { address: user.address } }),
      vesting.address,
      6
    )
  }, 30000)
})
