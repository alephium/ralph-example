/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  Address,
  Contract,
  ContractState,
  TestContractResult,
  HexString,
  ContractFactory,
  EventSubscribeOptions,
  EventSubscription,
  CallContractParams,
  CallContractResult,
  TestContractParams,
  ContractEvent,
  subscribeContractEvent,
  subscribeContractEvents,
  testMethod,
  callMethod,
  multicallMethods,
  fetchContractState,
  Asset,
  ContractInstance,
  getContractEventsCurrentCount,
  TestContractParamsWithoutMaps,
  TestContractResultWithoutMaps,
  SignExecuteContractMethodParams,
  SignExecuteScriptTxResult,
  signExecuteMethod,
  addStdIdToFields,
  encodeContractFields,
  Narrow,
} from "@alephium/web3";
import { default as AwesomeNFTContractJson } from "../AwesomeNFT.ral.json";
import { getContractByCodeHash, registerContract } from "./contracts";

// Custom types for the contract
export namespace AwesomeNFTTypes {
  export type Fields = {
    collectionId: HexString;
    nftIndex: bigint;
    uri: HexString;
  };

  export type State = ContractState<Fields>;

  export interface CallMethodTable {
    getTokenUri: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<HexString>;
    };
    getCollectionIndex: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<[HexString, bigint]>;
    };
  }
  export type CallMethodParams<T extends keyof CallMethodTable> =
    CallMethodTable[T]["params"];
  export type CallMethodResult<T extends keyof CallMethodTable> =
    CallMethodTable[T]["result"];
  export type MultiCallParams = Partial<{
    [Name in keyof CallMethodTable]: CallMethodTable[Name]["params"];
  }>;
  export type MultiCallResults<T extends MultiCallParams> = {
    [MaybeName in keyof T]: MaybeName extends keyof CallMethodTable
      ? CallMethodTable[MaybeName]["result"]
      : undefined;
  };
  export type MulticallReturnType<Callss extends MultiCallParams[]> = {
    [index in keyof Callss]: MultiCallResults<Callss[index]>;
  };

  export interface SignExecuteMethodTable {
    getTokenUri: {
      params: Omit<SignExecuteContractMethodParams<{}>, "args">;
      result: SignExecuteScriptTxResult;
    };
    getCollectionIndex: {
      params: Omit<SignExecuteContractMethodParams<{}>, "args">;
      result: SignExecuteScriptTxResult;
    };
  }
  export type SignExecuteMethodParams<T extends keyof SignExecuteMethodTable> =
    SignExecuteMethodTable[T]["params"];
  export type SignExecuteMethodResult<T extends keyof SignExecuteMethodTable> =
    SignExecuteMethodTable[T]["result"];
}

class Factory extends ContractFactory<
  AwesomeNFTInstance,
  AwesomeNFTTypes.Fields
> {
  encodeFields(fields: AwesomeNFTTypes.Fields) {
    return encodeContractFields(
      addStdIdToFields(this.contract, fields),
      this.contract.fieldsSig,
      []
    );
  }

  at(address: string): AwesomeNFTInstance {
    return new AwesomeNFTInstance(address);
  }

  tests = {
    getTokenUri: async (
      params: Omit<
        TestContractParamsWithoutMaps<AwesomeNFTTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<HexString>> => {
      return testMethod(this, "getTokenUri", params, getContractByCodeHash);
    },
    getCollectionIndex: async (
      params: Omit<
        TestContractParamsWithoutMaps<AwesomeNFTTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<[HexString, bigint]>> => {
      return testMethod(
        this,
        "getCollectionIndex",
        params,
        getContractByCodeHash
      );
    },
  };

  stateForTest(
    initFields: AwesomeNFTTypes.Fields,
    asset?: Asset,
    address?: string
  ) {
    return this.stateForTest_(initFields, asset, address, undefined);
  }
}

// Use this object to test and deploy the contract
export const AwesomeNFT = new Factory(
  Contract.fromJson(
    AwesomeNFTContractJson,
    "",
    "4897086210869e612d82995b765a447c5319a55a56e8a0c3c07b4d9ca81e15b1",
    []
  )
);
registerContract(AwesomeNFT);

// Use this class to interact with the blockchain
export class AwesomeNFTInstance extends ContractInstance {
  constructor(address: Address) {
    super(address);
  }

  async fetchState(): Promise<AwesomeNFTTypes.State> {
    return fetchContractState(AwesomeNFT, this);
  }

  view = {
    getTokenUri: async (
      params?: AwesomeNFTTypes.CallMethodParams<"getTokenUri">
    ): Promise<AwesomeNFTTypes.CallMethodResult<"getTokenUri">> => {
      return callMethod(
        AwesomeNFT,
        this,
        "getTokenUri",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    getCollectionIndex: async (
      params?: AwesomeNFTTypes.CallMethodParams<"getCollectionIndex">
    ): Promise<AwesomeNFTTypes.CallMethodResult<"getCollectionIndex">> => {
      return callMethod(
        AwesomeNFT,
        this,
        "getCollectionIndex",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
  };

  transact = {
    getTokenUri: async (
      params: AwesomeNFTTypes.SignExecuteMethodParams<"getTokenUri">
    ): Promise<AwesomeNFTTypes.SignExecuteMethodResult<"getTokenUri">> => {
      return signExecuteMethod(AwesomeNFT, this, "getTokenUri", params);
    },
    getCollectionIndex: async (
      params: AwesomeNFTTypes.SignExecuteMethodParams<"getCollectionIndex">
    ): Promise<
      AwesomeNFTTypes.SignExecuteMethodResult<"getCollectionIndex">
    > => {
      return signExecuteMethod(AwesomeNFT, this, "getCollectionIndex", params);
    },
  };

  async multicall<Calls extends AwesomeNFTTypes.MultiCallParams>(
    calls: Calls
  ): Promise<AwesomeNFTTypes.MultiCallResults<Calls>>;
  async multicall<Callss extends AwesomeNFTTypes.MultiCallParams[]>(
    callss: Narrow<Callss>
  ): Promise<AwesomeNFTTypes.MulticallReturnType<Callss>>;
  async multicall<
    Callss extends
      | AwesomeNFTTypes.MultiCallParams
      | AwesomeNFTTypes.MultiCallParams[]
  >(callss: Callss): Promise<unknown> {
    return await multicallMethods(
      AwesomeNFT,
      this,
      callss,
      getContractByCodeHash
    );
  }
}
