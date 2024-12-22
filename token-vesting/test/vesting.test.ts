import {
  web3,
  TestContractParams,
  addressFromContractId,
  AssetOutput,
  DUST_AMOUNT,
  groupOfAddress,
  Address,
  subContractId,
  ONE_ALPH,
  utils,
  sleep,
  ALPH_TOKEN_ID
} from '@alephium/web3'
import {
  expectAssertionError,
  getSigner,
  getSigners,
  randomContractId,
  testAddress,
  testNodeWallet
} from '@alephium/web3-test'
import { deployToDevnet } from '@alephium/cli'
import { Metadata, TokenVestingInstance } from '../artifacts/ts'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import {
  addRecipient,
  addRecipients,
  alph,
  balanceOf,
  claim,
  deployVestingContract,
  generateMilestones,
  initialize,
  MilestoneInfo
} from './utils'
import * as base58 from 'bs58'
import { ALPHTokenId } from '@alephium/web3/dist/src/codec'

describe('test vesting flow', () => {
  const groupIndex = groupOfAddress(testAddress)

  let tokenVesting: TokenVestingInstance
  let manager: PrivateKeyWallet
  let users: PrivateKeyWallet[]
  let milestones: MilestoneInfo[]

  beforeAll(async () => {
    const startTime = new Date().getTime()
    milestones = generateMilestones(startTime, 10, 0.5, 0)
    manager = await getSigner(alph(5000), groupIndex)
    tokenVesting = (await deployVestingContract(manager.address, startTime)).contractInstance
    users = await getSigners(6, alph(100), groupIndex)
  })

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
    const lockedAmount = alph(100)

    await addRecipient(manager, tokenVesting, user1.address, lockedAmount)
    const recipientsResult = await tokenVesting.view.getTotalRecipients()
    expect(recipientsResult.returns).toEqual(1n)

    await checkUserLockedAmount(user1, lockedAmount)
  }, 30000)

  test('test: admin add multiple recipients', async () => {
    const usersWallet = users.slice(1, 6)
    const addresses = usersWallet.map((user) => user.address)
    const amounts = [alph(110), alph(120), alph(130), alph(140), alph(150)]
    const totalAmount = alph(650)

    await addRecipients(manager, tokenVesting, addresses, amounts, totalAmount)

    const recipientsResult = await tokenVesting.view.getTotalRecipients()
    expect(recipientsResult.returns).toEqual(6n)
    const totalLockedResult = await tokenVesting.view.getTotalLocked()
    expect(totalLockedResult.returns).toEqual(totalAmount + alph(100))

    for (let i = 0; i < usersWallet.length; i++) {
      const user = usersWallet[i]
      const lockedAmount = amounts[i]
      await checkUserLockedAmount(user, lockedAmount)
    }
  }, 30000)

  test('test: user claim', async () => {
    const user = users[0]
    await sleep(30 * 1000)
    const claimable = await tokenVesting.view.getClaimableAmount({ args: { address: user.address } })

    await claim(user, tokenVesting)
    await checkUserTotalClaimed(user, claimable.returns)

    const lastReachedMilestone = await tokenVesting.view.getLastReachedTimestamps()
    await checkUserClaimId(user, lastReachedMilestone.returns)
  }, 300000)

  test('test: multiple user claim', async () => {
    await sleep(10 * 1000)
    for (let i = 0; i < users.length; i++) {
      const user = users[i]
      const userState = await getUserMetadata(user)
      const claimable = await tokenVesting.view.getClaimableAmount({ args: { address: user.address } })

      await claim(user, tokenVesting)
      await checkUserTotalClaimed(user, claimable.returns + userState.fields.totalClaimed)

      const lastReachedMilestone = await tokenVesting.view.getLastReachedTimestamps()
      await checkUserClaimId(user, lastReachedMilestone.returns)
    }
  }, 300000)
})
