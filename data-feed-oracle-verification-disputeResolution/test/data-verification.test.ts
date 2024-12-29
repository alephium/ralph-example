//import { describe, before, beforeEach } from 'mocha'
import {assert} from 'chai'
import{
    web3,
    groupOfAddress,
    addressFromContractId,
    ONE_ALPH,
    ALPH_TOKEN_ID,
    ZERO_ADDRESS
} from '@alephium/web3'
import { testAddress, getSigner } from '@alephium/web3-test'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import { deployBondToken, getCurrentTime, getState, makeRequest, proposePrice, setCurrentTime, StateEnum, transferToken } from './utils'

/**data-feed-oracle test utils */
import { addOracle, alph, deployDataFeed } from './utils'
import { WeatherDataFeedInstance } from '../artifacts/ts'
import configuration from '../alephium.config'

const rules = "https://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi.ipfs.dweb.link/";
const identifier = Buffer.from('ZODIAC', 'utf8').toString('hex');
const bond = alph(1000);

describe('test data verification', () => {
    const groupIndex = groupOfAddress(testAddress);
    const fee = alph(1);

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

    let startTime;
    let defaultExpiryTime;

    let postProposalParams;

    const verifyState = async (state, requester, identifier, requestTime, ancillaryData, request) => {
      const stateFromContract = await getState(dataFeed, requester, identifier, requestTime, ancillaryData, request)
      expect(stateFromContract).toEqual(state);
    };
  

    //precomputed values
    const liveness = BigInt(7200); // 2 hours
    
    const reward = alph(1);
    const totalDefaultBond = alph(2);
    const finalFee = alph(1);
    const correctPrice = alph(-17);

    beforeAll(async function () {
      web3.setCurrentNodeProvider(configuration.networks.devnet.nodeUrl)
      owner = await getSigner(alph(100), groupIndex)
      proposer = await getSigner(alph(100), groupIndex)
      disputer = await getSigner(alph(10), groupIndex)
      rando = await getSigner(alph(10), groupIndex)
      requester = await getSigner(alph(10), groupIndex);

      console.log(`owner: ${owner.address}`)
      console.log(`proposer: ${proposer.address}`)
      console.log(`disputer: ${disputer.address}`)
      console.log(`rando: ${rando.address}`)
      console.log(`requester: ${requester.address}`)

      //oracle = await getSigner(alph(1000), groupIndex)
      //await addOracle(owner, dataFeed, oracle.address);


    })

    beforeEach(async () => {
        //deploy oracle contract
        dataFeed = (await deployDataFeed(owner.address, fee, requester.address )).contractInstance
      
        //executor = await getSigner(alph(10), groupIndex)

        //deploy governance contract
        //const governance = await deployGovernor(owner, Governance);
        
        requestTime = new Date().valueOf() ;
        requestParams = {
          proposer: ZERO_ADDRESS,
          disputer: ZERO_ADDRESS,
          currency: ALPH_TOKEN_ID,
          settled: false,
          proposedPrice: "0",
          resolvedPrice: "0",
          expirationTime: "0",
          reward: reward,
          finalFee: finalFee,
          bond: finalFee,
          customLiveness: "0"
        }

        startTime = await getCurrentTime(dataFeed);
        defaultExpiryTime = startTime + liveness;


        postProposalParams = (
          _requestParams,
          _expirationTime = defaultExpiryTime.toString(),
          _proposedPrice = correctPrice
        ) => {
          return { ..._requestParams, expirationTime: _expirationTime, proposer: proposer.address, proposedPrice: _proposedPrice };
        };
    })
    //+ve case
    describe("Proposed data correctly", function () {
      let ancillaryData = {"data": "0x"}
      beforeEach(async function () {

        await transferToken(owner, requester,  ONE_ALPH);
        //await collateral.methods.increaseAllowance(optimisticOracle.options.address, reward).send({ from: requester });
        await makeRequest(requester, dataFeed, identifier, requestTime, ancillaryData,reward, 0n, 0n, fee)
        
        await proposePrice(proposer, dataFeed, requester, identifier, requestTime, "0x", requestParams, correctPrice)
      });

      it("Settle expired proposal", async function () {
        await setCurrentTime(owner, dataFeed, defaultExpiryTime-1n);
        await verifyState(StateEnum.Proposed, requester.address, identifier, requestTime, ancillaryData, postProposalParams(requestParams));
        
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
