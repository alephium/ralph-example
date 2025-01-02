import { expectAssertionError, testAddress, testPrivateKey } from '@alephium/web3-test'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import {
  AddVestingSchedule,
  AddVestingScheduleWithPercentage,
  Claim,
  Metadata,
  Vesting,
  VestingInstance
} from '../artifacts/ts'
import {
  web3,
  ALPH_TOKEN_ID,
  Address,
  ONE_ALPH,
  SignerProvider,
  groupOfAddress,
  waitForTxConfirmation,
  sleep
} from '@alephium/web3'
import { randomBytes } from 'crypto'
import * as base58 from 'bs58'

web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
export const ZERO_ADDRESS = 'tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq'
export const defaultSigner = new PrivateKeyWallet({ privateKey: testPrivateKey })
export const groupIndex = groupOfAddress(testAddress)

export async function deployMetadataTemplate() {
  return await Metadata.deploy(defaultSigner, {
    initialFields: {
      vesting: '',
      address: ZERO_ADDRESS,
      startTime: 0n,
      cliffTime: 0n,
      endTime: 0n,
      totalAmount: 0n,
      totalClaimed: 0n
    }
  })
}

export async function deployVestingContract(manager: Address) {
  const metadataTemplate = await deployMetadataTemplate()
  return await Vesting.deploy(defaultSigner, {
    initialFields: {
      metadataTemplateId: metadataTemplate.contractInstance.contractId,
      manager,
      totalSchedules: 0n
    }
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
    })
  )
}

export async function addVestingSchedule(
  signer: SignerProvider,
  vesting: VestingInstance,
  recipient: Address,
  startTime: bigint,
  cliffTime: bigint,
  endTime: bigint,
  totalAmount: bigint
) {
  return await AddVestingSchedule.execute(signer, {
    initialFields: { vesting: vesting.contractId, recipient, startTime, cliffTime, endTime, totalAmount },
    attoAlphAmount: totalAmount + 5n * ONE_ALPH
  })
}

export async function addVestingScheduleWithPercentage(
  signer: SignerProvider,
  vesting: VestingInstance,
  recipient: Address,
  startTime: bigint,
  cliffTime: bigint,
  endTime: bigint,
  totalAmount: bigint,
  percentage: bigint
) {
  return await AddVestingScheduleWithPercentage.execute(signer, {
    initialFields: { vesting: vesting.contractId, recipient, startTime, cliffTime, endTime, totalAmount, percentage },
    attoAlphAmount: totalAmount + 5n * ONE_ALPH
  })
}

export async function addVestingScheduleFailed(
  signer: SignerProvider,
  vesting: VestingInstance,
  recipient: Address,
  startTime: bigint,
  cliffTime: bigint,
  endTime: bigint,
  totalAmount: bigint,
  errorCode: bigint
) {
  await expectAssertionError(
    addVestingSchedule(signer, vesting, recipient, startTime, cliffTime, endTime, totalAmount),
    vesting.address,
    Number(errorCode)
  )
}

export async function addVestingScheduleWithPercentageFailed(
  signer: SignerProvider,
  vesting: VestingInstance,
  recipient: Address,
  startTime: bigint,
  cliffTime: bigint,
  endTime: bigint,
  totalAmount: bigint,
  percentage: bigint,
  errorCode: bigint
) {
  await expectAssertionError(
    addVestingScheduleWithPercentage(
      signer,
      vesting,
      recipient,
      startTime,
      cliffTime,
      endTime,
      totalAmount,
      percentage
    ),
    vesting.address,
    Number(errorCode)
  )
}

export async function claim(signer: SignerProvider, vesting: VestingInstance) {
  return await Claim.execute(signer, {
    initialFields: {
      vesting: vesting.contractId
    }
  })
}

export async function claimFailed(signer: SignerProvider, vesting: VestingInstance, errorCode: bigint) {
  await expectAssertionError(claim(signer, vesting), vesting.address, Number(errorCode))
}

export async function balanceOf(tokenId: string, address = testAddress): Promise<bigint> {
  const balances = await web3.getCurrentNodeProvider().addresses.getAddressesAddressBalance(address)
  if (tokenId === ALPH_TOKEN_ID) return BigInt(balances.balance)
  const balance = balances.tokenBalances?.find((t) => t.id === tokenId)
  return balance === undefined ? 0n : BigInt(balance.amount)
}

export function alph(amount: bigint | number): bigint {
  return BigInt(amount) * ONE_ALPH
}
export async function mineBlock() {
  const nodeProvider = web3.getCurrentNodeProvider()
  return await nodeProvider.miners.postMinersCpuMiningMineOneBlock({ fromGroup: groupIndex, toGroup: groupIndex })
}

export async function mineBlocks(numBlocks: number, delay: number) {
  // waitTime would be noOfBlocks * delay
  for (let i = 0; i < numBlocks; i++) {
    await mineBlock()
    await sleep(delay)
  }
}

export function generateSchedule(durationInSecs: number, cliff: boolean) {
  const currentTime = Date.now()
  // create startTime 5 secs ahead
  const startTime = currentTime + 5000
  let cliffTime = startTime
  if (cliff) {
    // cliff of 20% of duration
    const percentage = (durationInSecs * 20) / 100
    cliffTime = startTime + percentage * 1000
  }
  const endTime = startTime + durationInSecs * 1000
  return {
    startTime: BigInt(startTime),
    cliffTime: BigInt(cliffTime),
    endTime: BigInt(endTime)
  }
}
