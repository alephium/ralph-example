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
import { default as BurnALPHContractJson } from "../BurnALPH.ral.json";
import { getContractByCodeHash, registerContract } from "./contracts";

// Custom types for the contract
export namespace BurnALPHTypes {
  export type State = Omit<ContractState<any>, "fields">;

  export interface CallMethodTable {
    burn: {
      params: CallContractParams<{ from: Address; amount: bigint }>;
      result: CallContractResult<null>;
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
    burn: {
      params: SignExecuteContractMethodParams<{
        from: Address;
        amount: bigint;
      }>;
      result: SignExecuteScriptTxResult;
    };
  }
  export type SignExecuteMethodParams<T extends keyof SignExecuteMethodTable> =
    SignExecuteMethodTable[T]["params"];
  export type SignExecuteMethodResult<T extends keyof SignExecuteMethodTable> =
    SignExecuteMethodTable[T]["result"];
}

class Factory extends ContractFactory<BurnALPHInstance, {}> {
  encodeFields() {
    return encodeContractFields({}, this.contract.fieldsSig, []);
  }

  at(address: string): BurnALPHInstance {
    return new BurnALPHInstance(address);
  }

  tests = {
    burn: async (
      params: Omit<
        TestContractParamsWithoutMaps<never, { from: Address; amount: bigint }>,
        "initialFields"
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "burn", params, getContractByCodeHash);
    },
  };

  stateForTest(initFields: {}, asset?: Asset, address?: string) {
    return this.stateForTest_(initFields, asset, address, undefined);
  }
}

// Use this object to test and deploy the contract
export const BurnALPH = new Factory(
  Contract.fromJson(
    BurnALPHContractJson,
    "",
    "59308e31f3f450eee919ae338ed0d477a49eaa19eac964c32b35438714207fb7",
    []
  )
);
registerContract(BurnALPH);

// Use this class to interact with the blockchain
export class BurnALPHInstance extends ContractInstance {
  constructor(address: Address) {
    super(address);
  }

  async fetchState(): Promise<BurnALPHTypes.State> {
    return fetchContractState(BurnALPH, this);
  }

  view = {
    burn: async (
      params: BurnALPHTypes.CallMethodParams<"burn">
    ): Promise<BurnALPHTypes.CallMethodResult<"burn">> => {
      return callMethod(BurnALPH, this, "burn", params, getContractByCodeHash);
    },
  };

  transact = {
    burn: async (
      params: BurnALPHTypes.SignExecuteMethodParams<"burn">
    ): Promise<BurnALPHTypes.SignExecuteMethodResult<"burn">> => {
      return signExecuteMethod(BurnALPH, this, "burn", params);
    },
  };
}
