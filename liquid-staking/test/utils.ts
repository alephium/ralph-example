import { expectAssertionError, testAddress, testPrivateKey } from '@alephium/web3-test'
import { 
  Staking, 
  StakingInstance, 
  StakingAccount,
  TestToken,
  GetToken,
  Stake,
  Unstake,
  ClaimRewards,
  SetRewardRate,
  UpdateStartTime
} from '../artifacts/ts'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import { 
  ALPH_TOKEN_ID, 
  Address, 
  DUST_AMOUNT, 
  ONE_ALPH, 
  SignerProvider, 
  groupOfAddress,
  web3,
  waitForTxConfirmation,
  addressFromContractId,
  subContractId
} from '@alephium/web3'
import { randomBytes } from 'crypto'
import * as base58 from 'bs58'

web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
export const ZERO_ADDRESS = 'tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq'
export const defaultSigner = new PrivateKeyWallet({ privateKey: testPrivateKey })

async function waitTxConfirmed<T extends { txId: string }>(promise: Promise<T>): Promise<T> {
  const result = await promise
  await waitForTxConfirmation(result.txId, 1, 1000)
  return result
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

export async function deployTestToken(totalSupply: bigint) {
  const testToken = await TestToken.deploy(defaultSigner, {
    initialFields: {
      totalSupply: totalSupply
    },
    issueTokenAmount: totalSupply
  })
  await GetToken.execute(defaultSigner, {
    initialFields: {
      token: testToken.contractInstance.contractId,
      amount: totalSupply
    },
    attoAlphAmount: DUST_AMOUNT
  })
  return testToken
}

export async function deployStakingAccountTemplate(tokenId: string, rewardsTokenId: string) {
  return await StakingAccount.deploy(defaultSigner, {
    initialFields: {
      tokenId,
      rewardsTokenId,
      staker: ZERO_ADDRESS,
      parentContractAddress: ZERO_ADDRESS,
      amountStaked: 0n,
      rewardPerTokenPaid: 0n,
      rewards: 0n,
    }
  })
}

export async function deployTestTokens(amount: bigint) {
  const stakingToken = await deployTestToken(amount)
  const rewardsToken = await deployTestToken(amount)
  return { stakingToken, rewardsToken }
}

export async function deployStaking(
  owner: Address,
  startTime: number,
  duration: number,
  penaltyPercent: bigint,
  rewardRate: bigint
) {
  const { stakingToken, rewardsToken } = await deployTestTokens(1000000n)
  
  const accountTemplate = await deployStakingAccountTemplate(
    stakingToken.contractInstance.contractId, 
    rewardsToken.contractInstance.contractId
  )

  return await Staking.deploy(defaultSigner, {
    initialFields: {
      tokenId: stakingToken.contractInstance.contractId,
      rewardsTokenId: rewardsToken.contractInstance.contractId,
      stakingAccountTemplateId: accountTemplate.contractInstance.contractId,
      rewardRate,
      totalAmountStaked: 0n,
      rewardPerTokenStored: 0n,
      lastUpdateTime: 0n,
      startTime: BigInt(startTime),
      duration: BigInt(duration),
      earlyUnstakePenaltyPercent: penaltyPercent,
      owner_: owner
    },
    initialTokenAmounts: [
      { id: rewardsToken.contractInstance.contractId, amount: 1000000n }
    ]
  })
}

export async function transferTokenTo(to: Address, tokenId: string, amount: bigint) {
  return await waitTxConfirmed(
    defaultSigner.signAndSubmitTransferTx({
      signerAddress: testAddress,
      destinations: [
        { 
          address: to, 
          attoAlphAmount: ONE_ALPH,
          tokens: [{ id: tokenId, amount: amount }]
        }
      ]
    })
  )
}


export async function transferAlphTo(to: Address, amount: bigint) {
  return await waitTxConfirmed(
    defaultSigner.signAndSubmitTransferTx({
      signerAddress: testAddress,
      destinations: [{ address: to, attoAlphAmount: amount }]
    })
  )
}

export function alph(amount: bigint | number): bigint {
  return BigInt(amount) * ONE_ALPH
}

export async function stake(
  signer: SignerProvider,
  staking: StakingInstance,
  amount: bigint,
  tokenId: string
) {
  return await Stake.execute(signer, {
    initialFields: {
      staking: staking.contractId,
      amount
    },
    tokens: [{ id: tokenId, amount }],
    attoAlphAmount: ONE_ALPH
  })
}

export async function updateStartTime(staking: StakingInstance, owner: SignerProvider) {
  return await UpdateStartTime.execute(owner, {
    initialFields: {
      staking: staking.contractId
    }
  })
}

export async function stakeFailed(
  signer: SignerProvider,
  staking: StakingInstance,
  amount: bigint,
  tokenId: string,
  errorCode: number
) {
  await expectAssertionError(
    stake(signer, staking, amount, tokenId),
    staking.address,
    errorCode
  )
}

export async function unstake(
  signer: SignerProvider,
  staking: StakingInstance,
  amount: bigint,
) {
  return await Unstake.execute(signer, {
    initialFields: {
      staking: staking.contractId,
      amount
    }
  })
}

export async function unstakeFailed(
  signer: SignerProvider,
  staking: StakingInstance,
  amount: bigint,
  errorCode: number
) {
  await expectAssertionError(
    unstake(signer, staking, amount),
    staking.address,
    errorCode
  )
}

export async function claimRewards(
  signer: SignerProvider,
  staking: StakingInstance
) {
  return await ClaimRewards.execute(signer, {
    initialFields: {
      staking: staking.contractId
    },
    attoAlphAmount: ONE_ALPH
  })
}

export async function claimRewardsFailed(
  signer: SignerProvider,
  staking: StakingInstance,
  errorCode: number
) {
  await expectAssertionError(
    claimRewards(signer, staking),
    staking.address,
    errorCode
  )
}

export async function setRewardRate(
  signer: SignerProvider,
  staking: StakingInstance,
  rewardRate: bigint
) {
  return await SetRewardRate.execute(signer, {
    initialFields: {
      staking: staking.contractId,
      rewardRate
    }
  })
}

export async function setRewardRateFailed(
  signer: SignerProvider,
  staking: StakingInstance,
  rate: bigint
) {
  await expectAssertionError(
    setRewardRate(signer, staking, rate),
    staking.address,
    Number(Staking.consts.PermissionsErrorCodes.Forbidden)
  )
}

export async function checkStakingAccount(
  staking: StakingInstance,
  staker: Address, 
  expectedAmount: bigint
) {
  const groupIndex = groupOfAddress(staker)
  const path = base58.decode(staker)
  const accountId = subContractId(staking.contractId, path, groupIndex)
  const stakingAccount = StakingAccount.at(addressFromContractId(accountId))
  const state = await stakingAccount.fetchState()
  expect(state.fields.amountStaked).toEqual(expectedAmount)
}

export async function balanceOf(tokenId: string, address = testAddress): Promise<bigint> {
  const balances = await web3.getCurrentNodeProvider().addresses.getAddressesAddressBalance(address)
  if (tokenId === ALPH_TOKEN_ID) return BigInt(balances.balance)
  const balance = balances.tokenBalances?.find((t) => t.id === tokenId)
  return balance === undefined ? 0n : BigInt(balance.amount)
}

export async function getRewards(staking: StakingInstance, staker: Address): Promise<bigint> {
  const groupIndex = groupOfAddress(staker)
  const path = base58.decode(staker)
  const accountId = subContractId(staking.contractId, path, groupIndex)
  const stakingAccount = StakingAccount.at(addressFromContractId(accountId))
  const state = await stakingAccount.fetchState()
  return state.fields.rewards
} 