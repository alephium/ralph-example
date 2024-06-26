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
  ContractInstance,
  getContractEventsCurrentCount,
  TestContractParamsWithoutMaps,
  TestContractResultWithoutMaps,
  addStdIdToFields,
  encodeContractFields,
} from "@alephium/web3";
import { default as BidderContractJson } from "../Bidder.ral.json";
import { getContractByCodeHash } from "./contracts";

// Custom types for the contract
export namespace BidderTypes {
  export type Fields = {
    auction: HexString;
    address: Address;
    bidAmount: bigint;
  };

  export type State = ContractState<Fields>;

  export interface CallMethodTable {
    getAddress: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<Address>;
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
}

class Factory extends ContractFactory<BidderInstance, BidderTypes.Fields> {
  encodeFields(fields: BidderTypes.Fields) {
    return encodeContractFields(
      addStdIdToFields(this.contract, fields),
      this.contract.fieldsSig,
      []
    );
  }

  getInitialFieldsWithDefaultValues() {
    return this.contract.getInitialFieldsWithDefaultValues() as BidderTypes.Fields;
  }

  consts = { InvalidCaller: BigInt(0) };

  at(address: string): BidderInstance {
    return new BidderInstance(address);
  }

  tests = {
    getAddress: async (
      params: Omit<
        TestContractParamsWithoutMaps<BidderTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<Address>> => {
      return testMethod(this, "getAddress", params, getContractByCodeHash);
    },
    rebid: async (
      params: TestContractParamsWithoutMaps<
        BidderTypes.Fields,
        { amount: bigint }
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "rebid", params, getContractByCodeHash);
    },
    withdraw: async (
      params: Omit<
        TestContractParamsWithoutMaps<BidderTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "withdraw", params, getContractByCodeHash);
    },
    auctionEnd: async (
      params: TestContractParamsWithoutMaps<
        BidderTypes.Fields,
        { to: Address; amount: bigint }
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "auctionEnd", params, getContractByCodeHash);
    },
  };
}

// Use this object to test and deploy the contract
export const Bidder = new Factory(
  Contract.fromJson(
    BidderContractJson,
    "",
    "d831408521cfc16f431ff8d1ad670710032c908039f14706afaa5b13e4ec8250",
    []
  )
);

// Use this class to interact with the blockchain
export class BidderInstance extends ContractInstance {
  constructor(address: Address) {
    super(address);
  }

  async fetchState(): Promise<BidderTypes.State> {
    return fetchContractState(Bidder, this);
  }

  methods = {
    getAddress: async (
      params?: BidderTypes.CallMethodParams<"getAddress">
    ): Promise<BidderTypes.CallMethodResult<"getAddress">> => {
      return callMethod(
        Bidder,
        this,
        "getAddress",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
  };

  async multicall<Calls extends BidderTypes.MultiCallParams>(
    calls: Calls
  ): Promise<BidderTypes.MultiCallResults<Calls>> {
    return (await multicallMethods(
      Bidder,
      this,
      calls,
      getContractByCodeHash
    )) as BidderTypes.MultiCallResults<Calls>;
  }
}
