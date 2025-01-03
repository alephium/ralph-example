import { addressFromContractId, subContractId, utils } from '@alephium/web3'
import { getSigner, getSigners } from '@alephium/web3-test'
import { Metadata, VestingInstance } from '../artifacts/ts'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import {
  addVestingSchedule,
  addVestingScheduleFailed,
  addVestingScheduleWithPercentage,
  addVestingScheduleWithPercentageFailed,
  alph,
  deployVestingContract,
  groupIndex,
  generateSchedule,
  transferTokenTo,
  balanceOf
} from './utils'
import base58 from 'bs58'

describe('VestingWallet Tests', () => {
  let vesting: VestingInstance
  let manager: PrivateKeyWallet
  let users: PrivateKeyWallet[]
  let fakeManager: PrivateKeyWallet
  const lockedAmount = alph(100n)
  const duration = 20

  beforeEach(async () => {
    manager = await getSigner(alph(5000), groupIndex)
    fakeManager = await getSigner(alph(5000), groupIndex)
    vesting = (await deployVestingContract(manager.address)).contractInstance
    users = await getSigners(3, alph(100), groupIndex)
  }, 10000)

  async function getUserMetadata(user: PrivateKeyWallet) {
    const path = utils.binToHex(base58.decode(user.address))
    const metadataContractId = subContractId(vesting.contractId, path, groupIndex)
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

  test('test: admin add schedule without cliff', async () => {
    const user1 = users[0]
    const schedule = generateSchedule(duration, false)
    const tokenIdResult = await vesting.view.getTokenId()
    await addVestingSchedule(
      manager,
      vesting,
      tokenIdResult.returns,
      user1.address,
      schedule.startTime,
      schedule.cliffTime,
      schedule.endTime,
      lockedAmount
    )

    await checkUserLockedAmount(user1, lockedAmount)
  }, 30000)

  test('test: admin add schedule with cliff', async () => {
    const user1 = users[0]
    const schedule = generateSchedule(duration, true)
    const tokenIdResult = await vesting.view.getTokenId()
    await addVestingSchedule(
      manager,
      vesting,
      tokenIdResult.returns,
      user1.address,
      schedule.startTime,
      schedule.cliffTime,
      schedule.endTime,
      lockedAmount
    )

    await checkUserLockedAmount(user1, lockedAmount)
  }, 30000)

  test('test: admin can add schedule for multiple users', async () => {
    for (let i = 0; i < users.length; i++) {
      const user = users[i]
      const schedule = generateSchedule(duration, false)
      const tokenIdResult = await vesting.view.getTokenId()
      await addVestingSchedule(
        manager,
        vesting,
        tokenIdResult.returns,
        user.address,
        schedule.startTime,
        schedule.cliffTime,
        schedule.endTime,
        lockedAmount
      )
      await checkUserLockedAmount(user, lockedAmount)
    }

    const totalSchedules = await vesting.view.getTotalVestingSchedules()

    expect(totalSchedules.returns).toEqual(3n)
  }, 30000)

  test('test: admin cannot add schedule for same user twice', async () => {
    const user1 = users[0]
    const schedule = generateSchedule(duration, false)
    const tokenIdResult = await vesting.view.getTokenId()
    await addVestingSchedule(
      manager,
      vesting,
      tokenIdResult.returns,
      user1.address,
      schedule.startTime,
      schedule.cliffTime,
      schedule.endTime,
      lockedAmount
    )

    await addVestingScheduleFailed(
      manager,
      vesting,
      tokenIdResult.returns,
      user1.address,
      schedule.startTime,
      schedule.cliffTime,
      schedule.endTime,
      lockedAmount,
      5n
    )
  }, 30000)

  test('test: not admin cannot add schedule', async () => {
    const user1 = users[0]
    const schedule = generateSchedule(duration, false)
    const tokenIdResult = await vesting.view.getTokenId()

    await transferTokenTo(manager, manager.address, fakeManager.address, tokenIdResult.returns, alph(1000))
    const balance = await balanceOf(tokenIdResult.returns, fakeManager.address)

    expect(balance).toEqual(alph(1000))

    await addVestingScheduleFailed(
      fakeManager,
      vesting,
      tokenIdResult.returns,
      user1.address,
      schedule.startTime,
      schedule.cliffTime,
      schedule.endTime,
      lockedAmount,
      0n
    )
  }, 30000)

  test('test: admin cannot add schedule with invalid cliff time', async () => {
    const user1 = users[1]
    const schedule = generateSchedule(duration, false)
    const tokenIdResult = await vesting.view.getTokenId()

    // testing with cliff time less than start time
    await addVestingScheduleFailed(
      manager,
      vesting,
      tokenIdResult.returns,
      user1.address,
      schedule.startTime,
      schedule.startTime - BigInt(1000),
      schedule.endTime,
      lockedAmount,
      1n
    )
  }, 30000)

  test('test: admin cannot add schedule with invalid end time', async () => {
    const user1 = users[0]
    const schedule = generateSchedule(duration, false)
    const tokenIdResult = await vesting.view.getTokenId()

    // testing with end time less than cliff time
    await addVestingScheduleFailed(
      manager,
      vesting,
      tokenIdResult.returns,
      user1.address,
      schedule.startTime,
      schedule.cliffTime,
      schedule.cliffTime - BigInt(1000),
      lockedAmount,
      2n
    )
  }, 30000)

  test('test: admin add schedule with percentage', async () => {
    const user1 = users[0]
    const schedule = generateSchedule(duration, true)
    const percentage = 30n
    const tokenIdResult = await vesting.view.getTokenId()

    await addVestingScheduleWithPercentage(
      manager,
      vesting,
      tokenIdResult.returns,
      user1.address,
      schedule.startTime,
      schedule.cliffTime,
      schedule.endTime,
      lockedAmount,
      percentage
    )

    const actualAmount = (lockedAmount * percentage) / 100n

    await checkUserLockedAmount(user1, actualAmount)
  }, 30000)

  test('test: admin cannot add schedule with percentage greater than 100%', async () => {
    const user1 = users[0]
    const schedule = generateSchedule(duration, true)
    const percentage = 120n
    const tokenIdResult = await vesting.view.getTokenId()

    await addVestingScheduleWithPercentageFailed(
      manager,
      vesting,
      tokenIdResult.returns,
      user1.address,
      schedule.startTime,
      schedule.cliffTime,
      schedule.endTime,
      lockedAmount,
      percentage,
      3n
    )
  }, 30000)
})
