import { Deployments } from '@alephium/cli'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import { web3, stringToHex ,MINIMAL_CONTRACT_DEPOSIT, DUST_AMOUNT, Address, ONE_ALPH, SignerProvider, subContractId} from '@alephium/web3'
import { WeatherDataFeed,WeatherDataFeedInstance,TokenFactory } from '../artifacts/ts'
import { testPrivateKey } from '@alephium/web3-test'
import { AddOracle, ApproveToken, MakeRequest, ProposePrice } from '../artifacts/ts/scripts'
import configuration from '../alephium.config'



export const defaultSigner = new PrivateKeyWallet({ privateKey: testPrivateKey })

export async function didContractThrow(promise) {
    try { 
        await promise;
    }
    catch (error: any) {
        return !!error.message.match(/[invalid opcode|out of gas|revert]/);
    }
    return false;
}

export async function makeRequest(
    signer: SignerProvider,
    dataFeed: WeatherDataFeedInstance,
    identifier: string,
    timestamp: number,
    ancillaryData: string,
    currency: string,
    reward: bigint,
    bond: bigint,
    customLiveness: bigint,
    fee: bigint
  ) {
    return await MakeRequest.execute(signer, {
      initialFields: {
        dataFeed: dataFeed.contractId,
        identifier: identifier,
        timestamp: BigInt(timestamp),
        ancillaryData: ancillaryData,
        currency: currency,
        reward: reward,
        bond: bond,
        customLiveness: customLiveness,
        fee: fee
      },
      attoAlphAmount: fee + ONE_ALPH * 2n
    })
  }


//referenced from https://github.com/alephium/ralph-example/pull/48, may merch later
export async function deployDataFeed(ownerWallet: Address, fee: bigint, timerAddress: Address) {
    return await WeatherDataFeed.deploy(defaultSigner, {
      initialFields: {
        owner: ownerWallet,
        authorizedOraclesCount: BigInt(0),
        lastRequestId: '',
        lastTimestamp: BigInt(0),
        fee: fee,
        feeWallet: ownerWallet,
        defaultLiveness: 0n,
        timerAddress: timerAddress
      }
    })
}

export async function deployBondToken(signer: PrivateKeyWallet){
    const deployments = await Deployments.load(configuration, 'devnet')
    const factory = deployments.getInstance(TokenFactory)
    if (factory === undefined) {
        throw new Error(`The contract ${TokenFactory} is not deployed`)
    }
    const bondToken = await factory.transact.createToken({
        signer: signer,
        attoAlphAmount: MINIMAL_CONTRACT_DEPOSIT + DUST_AMOUNT, // 0.1 ALPH for the minimum storage deposit for the new token, 0.001 ALPH for the dust amount of the token output
        args: {
          symbol: stringToHex('BOND'),
          name: stringToHex('BOND'),
          decimals: 18n,
          totalSupply: 10n ** 9n * 10n ** 18n, // 1 billion
        }
    }) 
    return subContractId(factory.contractId, stringToHex('BOND'), (await signer.getSelectedAccount()).group) 
}

/**
 * 
 * @param sender 
 * @param receiver 
 * @param tokenId 
 * @param amount 
 * @returns receiver's token balance
 */
export async function transferToken( sender: PrivateKeyWallet, receiver:PrivateKeyWallet, tokenId: string, amount: bigint) {
    await sender.signAndSubmitTransferTx({
        signerAddress: sender.address,
        destinations: [
          { address: receiver.address, attoAlphAmount: DUST_AMOUNT, tokens: [{ id: tokenId, amount: amount }] }
        ]
    })

    const { tokenBalances } = await web3.getCurrentNodeProvider().addresses.getAddressesAddressBalance(receiver.address)
    return tokenBalances;
}

export async function approveToken(approver: PrivateKeyWallet, approvedTo : Address, token: string, amount: bigint) {

  return await ApproveToken.execute(approver, {
      initialFields: {
        fromAddress: approvedTo,
        token: token,
        amount: amount
      },
      attoAlphAmount: DUST_AMOUNT
    })
}

export async function proposePrice(signer: SignerProvider, dataFeed: WeatherDataFeedInstance, requester: PrivateKeyWallet, identifier: string, timestamp: number, ancillaryData: string, requestParams: any, price: bigint) {
    return await ProposePrice.execute(signer, {
      initialFields: {
        dataFeed: dataFeed.contractId,
        requester: requester.address,
        identifier: identifier,
        timestamp: BigInt(timestamp),
        ancillaryData: ancillaryData,
        requestParams: requestParams,
        price: price
      },
      attoAlphAmount: DUST_AMOUNT
    })
}

export function alph(amount: bigint | number): bigint {
  return BigInt(amount) * ONE_ALPH
}

export async function addOracle(signer: SignerProvider, dataFeed: WeatherDataFeedInstance, oracle: Address) {
  return await AddOracle.execute(signer, {
    initialFields: { dataFeed: dataFeed.contractId, oracle },
    attoAlphAmount: ONE_ALPH * 2n
  })
}