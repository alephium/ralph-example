//import { describe, before, beforeEach } from 'mocha'
import{
    web3,
    groupOfAddress,
    addressFromContractId,
    ONE_ALPH
} from '@alephium/web3'
import { testAddress, getSigner } from '@alephium/web3-test'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import { approveToken, deployBondToken, makeRequest, proposePrice, transferToken } from './utils'

/**data-feed-oracle test utils */
import { addOracle, alph, deployDataFeed } from './utils'
import { WeatherDataFeedInstance } from '../artifacts/ts'

const rules = "https://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi.ipfs.dweb.link/";
const identifier = Buffer.from('ZODIAC', 'utf8').toString('hex');
const bond = alph(1000);

describe('test data verification', () => {
    const groupIndex = groupOfAddress(testAddress);
    const fee = alph(10);

    let owner: PrivateKeyWallet;
    let proposer: PrivateKeyWallet;
    let disputer: PrivateKeyWallet;
    let rando: PrivateKeyWallet;
    let requester: PrivateKeyWallet;
    let executor: PrivateKeyWallet;
    let oracle: PrivateKeyWallet;

    let dataFeed: WeatherDataFeedInstance
    let requestTime: number;
    let collateral: WeatherDataFeedInstance;
    let requestParams;

    let bondTokenId;

    //precomputed values
    const reward = alph(1);
    const totalDefaultBond = alph(2);
    const finalFee = alph(1);
    const correctPrice = alph(-17);

    beforeAll(async function () {
      web3.setCurrentNodeProvider('http://127.0.0.1:22973')
      owner = await getSigner(alph(1000), groupIndex)
      proposer = await getSigner(alph(1000), groupIndex)
      disputer = await getSigner(alph(1000), groupIndex)
      rando = await getSigner(alph(1000), groupIndex)
      requester = await getSigner(alph(1000), groupIndex);

    })

    beforeEach(async () => {
        //deploy token factory


        bondTokenId =await deployBondToken( owner);

        executor = await getSigner(alph(1000), groupIndex)
        oracle = await getSigner(alph(1000), groupIndex)
        dataFeed = (await deployDataFeed(owner.address, fee, requester.address )).contractInstance

        //deploy governance contract
        //const governance = await deployGovernor(owner, Governance);
        
        //deploy oracle contract
        await addOracle(owner, dataFeed, oracle.address);

        requestTime = new Date().valueOf() ;
        requestParams = {
          proposer: addressFromContractId('0'.repeat(64)),
          disputer: addressFromContractId('0'.repeat(64)),
          currency: collateral.contractId,
          settled: false,
          proposedPrice: "0",
          resolvedPrice: "0",
          expirationTime: "0",
          reward: reward,
          finalFee: finalFee,
          requestSettings: {
            bond: finalFee,
            customLiveness: "0",
            callbackOnPriceProposed: false,
            callbackOnPriceDisputed: false,
            callbackOnPriceSettled: false,
          }
        }
    })
    //+ve case
    describe("Proposed data correctly", function () {
      beforeEach(async function () {
        await transferToken(owner, requester, bondTokenId, 10n);
        //await collateral.methods.increaseAllowance(optimisticOracle.options.address, reward).send({ from: requester });
        await makeRequest(requester, dataFeed, identifier, requestTime, "0x", bondTokenId, reward, 0n, 0n, fee)
        
        await approveToken(proposer, dataFeed.contractId, bondTokenId, totalDefaultBond);
        await proposePrice(proposer, dataFeed, requester, identifier, requestTime, "0x", requestParams, correctPrice)
      });

      it("Settle expired proposal", async function () {
        

      })
    });

    /*
    describe("Proposed incorrectly", function () {
      beforeEach(async function () {
        await collateral.methods.transfer(requester, reward).send({ from: accounts[0] });
        await collateral.methods.increaseAllowance(optimisticOracle.options.address, reward).send({ from: requester });
        await optimisticOracle.methods
          .requestPrice(identifier, requestTime, "0x", collateral.options.address, reward, {
            bond: 0,
            customLiveness: 0,
            callbackOnPriceProposed: false,
            callbackOnPriceDisputed: false,
            callbackOnPriceSettled: false,
          })
          .send({ from: requester });
        await collateral.methods.approve(optimisticOracle.options.address, totalDefaultBond).send({ from: proposer });
        await optimisticOracle.methods
          .proposePrice(requester, identifier, requestTime, "0x", requestParams, incorrectPrice)
          .send({ from: proposer });
      });
    });
    */
})
