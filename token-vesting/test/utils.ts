import { expectAssertionError, testAddress, testPrivateKey } from '@alephium/web3-test'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import {
  AddRecipient,
  AddRecipients,
  Claim,
  Initialize,
  Metadata,
  TokenVesting,
  TokenVestingInstance,
  UpdateLastReachedMilestone
} from '../artifacts/ts'
import {
  web3,
  ALPH_TOKEN_ID,
  Address,
  ONE_ALPH,
  SignerProvider,
  groupOfAddress,
  waitForTxConfirmation
} from '@alephium/web3'
import { randomBytes } from 'crypto'
import * as base58 from 'bs58'

web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
export const ZERO_ADDRESS = 'tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq'
export const defaultSigner = new PrivateKeyWallet({ privateKey: testPrivateKey })

export interface MilestoneInfo {
  timestamp: bigint
  ramp: bigint
  percentage: bigint
}

export async function deployMetadataTemplate() {
  return await Metadata.deploy(defaultSigner, {
    initialFields: {
      vesting: '',
      address: ZERO_ADDRESS,
      lockedAmount: 0n,
      totalClaimed: 0n,
      claimIndex: 0n,
      lastProcessedTimestamp: 0n
    }
  })
}

export async function deployVestingContract(manager: Address, startTime: number) {
  const metadataTemplate = await deployMetadataTemplate()
  return await TokenVesting.deploy(defaultSigner, {
    initialFields: {
      metadataTemplateId: metadataTemplate.contractInstance.contractId,
      manager,
      startTime: BigInt(startTime),
      totalMilestones: 0n,
      totalAmountLocked: 0n,
      totalAmountUnlocked: 0n,
      totalRecipients: 0n,
      lastReachedMilestone: 0n
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

export async function initialize(
  signer: SignerProvider,
  vestContract: TokenVestingInstance,
  milestones: MilestoneInfo[]
) {
  return await Initialize.execute(signer, {
    initialFields: { vestingContract: vestContract.contractId, milestonesArr: milestones as any },
    attoAlphAmount: 10n * ONE_ALPH
  })
}

export async function addRecipient(
  signer: SignerProvider,
  vestContract: TokenVestingInstance,
  recipient: Address,
  amount: bigint
) {
  return await AddRecipient.execute(signer, {
    initialFields: { vestingContract: vestContract.contractId, recipient, amount },
    attoAlphAmount: amount + 2n * ONE_ALPH
  })
}

export async function addRecipients(
  signer: SignerProvider,
  vestContract: TokenVestingInstance,
  addresses: Address[],
  amounts: bigint[],
  totalAmount: bigint
) {
  return await AddRecipients.execute(signer, {
    initialFields: {
      vestingContract: vestContract.contractId,
      addresses: addresses as any,
      amounts: amounts as any,
      totalAmount
    },
    attoAlphAmount: totalAmount * 2n + 5n * ONE_ALPH
  })
}

export async function updateLastMilestoneReached(
  signer: SignerProvider,
  vestContract: TokenVestingInstance,
  startIndex: bigint
) {
  return await UpdateLastReachedMilestone.execute(signer, {
    initialFields: {
      vestingContract: vestContract.contractId,
      startIndex: startIndex
    }
  })
}

export async function claim(signer: SignerProvider, vestContract: TokenVestingInstance) {
  return await Claim.execute(signer, {
    initialFields: {
      vestingContract: vestContract.contractId
    }
  })
}

export async function balanceOf(tokenId: string, address = testAddress): Promise<bigint> {
  const balances = await web3.getCurrentNodeProvider().addresses.getAddressesAddressBalance(address)
  if (tokenId === ALPH_TOKEN_ID) return BigInt(balances.balance)
  const balance = balances.tokenBalances?.find((t) => t.id === tokenId)
  return balance === undefined ? 0n : BigInt(balance.amount)
}

export function generateMilestones(
  startTime: number,
  count: number,
  intervalMinutes: number,
  ramp: 0 | 1
): MilestoneInfo[] {
  const data: MilestoneInfo[] = []
  const intervalMillis = intervalMinutes * 60 * 1000

  for (let i = 0; i < count; i++) {
    const timestamp = BigInt(startTime + i * intervalMillis)
    const percentage = i === count - 1 ? 100 : (100 / count) * (i + 1)

    data.push({
      timestamp,
      percentage: BigInt(Math.round((percentage * 1e18) / 100)),
      ramp: BigInt(ramp)
    })
  }

  return data
}

export function alph(amount: bigint | number): bigint {
  return BigInt(amount) * ONE_ALPH
}
