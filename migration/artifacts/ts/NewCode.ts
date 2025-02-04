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
import { default as NewCodeContractJson } from "../NewCode.ral.json";
import { getContractByCodeHash, registerContract } from "./contracts";

// Custom types for the contract
export namespace NewCodeTypes {
  export type Fields = {
    n: bigint;
  };

  export type State = ContractState<Fields>;

  export interface CallMethodTable {
    get: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<bigint>;
    };
    set: {
      params: CallContractParams<{ m: bigint }>;
      result: CallContractResult<bigint>;
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
    get: {
      params: Omit<SignExecuteContractMethodParams<{}>, "args">;
      result: SignExecuteScriptTxResult;
    };
    set: {
      params: SignExecuteContractMethodParams<{ m: bigint }>;
      result: SignExecuteScriptTxResult;
    };
  }
  export type SignExecuteMethodParams<T extends keyof SignExecuteMethodTable> =
    SignExecuteMethodTable[T]["params"];
  export type SignExecuteMethodResult<T extends keyof SignExecuteMethodTable> =
    SignExecuteMethodTable[T]["result"];
}

class Factory extends ContractFactory<NewCodeInstance, NewCodeTypes.Fields> {
  encodeFields(fields: NewCodeTypes.Fields) {
    return encodeContractFields(
      addStdIdToFields(this.contract, fields),
      this.contract.fieldsSig,
      []
    );
  }

  at(address: string): NewCodeInstance {
    return new NewCodeInstance(address);
  }

  tests = {
    get: async (
      params: Omit<
        TestContractParamsWithoutMaps<NewCodeTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<bigint>> => {
      return testMethod(this, "get", params, getContractByCodeHash);
    },
    set: async (
      params: TestContractParamsWithoutMaps<NewCodeTypes.Fields, { m: bigint }>
    ): Promise<TestContractResultWithoutMaps<bigint>> => {
      return testMethod(this, "set", params, getContractByCodeHash);
    },
  };

  stateForTest(
    initFields: NewCodeTypes.Fields,
    asset?: Asset,
    address?: string
  ) {
    return this.stateForTest_(initFields, asset, address, undefined);
  }
}

// Use this object to test and deploy the contract
export const NewCode = new Factory(
  Contract.fromJson(
    NewCodeContractJson,
    "",
    "5ab600c02f43c3e503464bcd10a714a49fe69a69d72ef6ad69a3c07700127c39",
    []
  )
);
registerContract(NewCode);

// Use this class to interact with the blockchain
export class NewCodeInstance extends ContractInstance {
  constructor(address: Address) {
    super(address);
  }

  async fetchState(): Promise<NewCodeTypes.State> {
    return fetchContractState(NewCode, this);
  }

  view = {
    get: async (
      params?: NewCodeTypes.CallMethodParams<"get">
    ): Promise<NewCodeTypes.CallMethodResult<"get">> => {
      return callMethod(
        NewCode,
        this,
        "get",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    set: async (
      params: NewCodeTypes.CallMethodParams<"set">
    ): Promise<NewCodeTypes.CallMethodResult<"set">> => {
      return callMethod(NewCode, this, "set", params, getContractByCodeHash);
    },
  };

  transact = {
    get: async (
      params: NewCodeTypes.SignExecuteMethodParams<"get">
    ): Promise<NewCodeTypes.SignExecuteMethodResult<"get">> => {
      return signExecuteMethod(NewCode, this, "get", params);
    },
    set: async (
      params: NewCodeTypes.SignExecuteMethodParams<"set">
    ): Promise<NewCodeTypes.SignExecuteMethodResult<"set">> => {
      return signExecuteMethod(NewCode, this, "set", params);
    },
  };

  async multicall<Calls extends NewCodeTypes.MultiCallParams>(
    calls: Calls
  ): Promise<NewCodeTypes.MultiCallResults<Calls>>;
  async multicall<Callss extends NewCodeTypes.MultiCallParams[]>(
    callss: Narrow<Callss>
  ): Promise<NewCodeTypes.MulticallReturnType<Callss>>;
  async multicall<
    Callss extends NewCodeTypes.MultiCallParams | NewCodeTypes.MultiCallParams[]
  >(callss: Callss): Promise<unknown> {
    return await multicallMethods(NewCode, this, callss, getContractByCodeHash);
  }
}
