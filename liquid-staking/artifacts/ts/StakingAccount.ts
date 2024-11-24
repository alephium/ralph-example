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
import { default as StakingAccountContractJson } from "../StakingAccount.ral.json";
import { getContractByCodeHash } from "./contracts";

// Custom types for the contract
export namespace StakingAccountTypes {
  export type Fields = {
    tokenId: HexString;
    rewardsTokenId: HexString;
    staker: Address;
    parentContractAddress: Address;
    amountStaked: bigint;
    rewardPerTokenPaid: bigint;
    rewards: bigint;
  };

  export type State = ContractState<Fields>;

  export interface CallMethodTable {
    getTokenId: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<HexString>;
    };
    getRewardsTokenId: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<HexString>;
    };
    getStaker: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<Address>;
    };
    getAmountStaked: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<bigint>;
    };
    getRewardPerTokenPaid: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<bigint>;
    };
    getRewards: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<bigint>;
    };
    setRewards: {
      params: CallContractParams<{
        newRewards: bigint;
        newRewardPerToken: bigint;
      }>;
      result: CallContractResult<null>;
    };
    stake: {
      params: CallContractParams<{ amount: bigint }>;
      result: CallContractResult<null>;
    };
    unstake: {
      params: CallContractParams<{ amount: bigint }>;
      result: CallContractResult<null>;
    };
    unstakeWithPenalty: {
      params: CallContractParams<{ amount: bigint; penalty: bigint }>;
      result: CallContractResult<null>;
    };
    claimRewards: {
      params: Omit<CallContractParams<{}>, "args">;
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
    getTokenId: {
      params: Omit<SignExecuteContractMethodParams<{}>, "args">;
      result: SignExecuteScriptTxResult;
    };
    getRewardsTokenId: {
      params: Omit<SignExecuteContractMethodParams<{}>, "args">;
      result: SignExecuteScriptTxResult;
    };
    getStaker: {
      params: Omit<SignExecuteContractMethodParams<{}>, "args">;
      result: SignExecuteScriptTxResult;
    };
    getAmountStaked: {
      params: Omit<SignExecuteContractMethodParams<{}>, "args">;
      result: SignExecuteScriptTxResult;
    };
    getRewardPerTokenPaid: {
      params: Omit<SignExecuteContractMethodParams<{}>, "args">;
      result: SignExecuteScriptTxResult;
    };
    getRewards: {
      params: Omit<SignExecuteContractMethodParams<{}>, "args">;
      result: SignExecuteScriptTxResult;
    };
    setRewards: {
      params: SignExecuteContractMethodParams<{
        newRewards: bigint;
        newRewardPerToken: bigint;
      }>;
      result: SignExecuteScriptTxResult;
    };
    stake: {
      params: SignExecuteContractMethodParams<{ amount: bigint }>;
      result: SignExecuteScriptTxResult;
    };
    unstake: {
      params: SignExecuteContractMethodParams<{ amount: bigint }>;
      result: SignExecuteScriptTxResult;
    };
    unstakeWithPenalty: {
      params: SignExecuteContractMethodParams<{
        amount: bigint;
        penalty: bigint;
      }>;
      result: SignExecuteScriptTxResult;
    };
    claimRewards: {
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
  StakingAccountInstance,
  StakingAccountTypes.Fields
> {
  encodeFields(fields: StakingAccountTypes.Fields) {
    return encodeContractFields(
      addStdIdToFields(this.contract, fields),
      this.contract.fieldsSig,
      []
    );
  }

  consts = {
    ErrorCodes: {
      UnauthorizedAccess: BigInt("0"),
      InsufficientBalance: BigInt("1"),
    },
  };

  at(address: string): StakingAccountInstance {
    return new StakingAccountInstance(address);
  }

  tests = {
    getTokenId: async (
      params: Omit<
        TestContractParamsWithoutMaps<StakingAccountTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<HexString>> => {
      return testMethod(this, "getTokenId", params, getContractByCodeHash);
    },
    getRewardsTokenId: async (
      params: Omit<
        TestContractParamsWithoutMaps<StakingAccountTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<HexString>> => {
      return testMethod(
        this,
        "getRewardsTokenId",
        params,
        getContractByCodeHash
      );
    },
    getStaker: async (
      params: Omit<
        TestContractParamsWithoutMaps<StakingAccountTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<Address>> => {
      return testMethod(this, "getStaker", params, getContractByCodeHash);
    },
    getAmountStaked: async (
      params: Omit<
        TestContractParamsWithoutMaps<StakingAccountTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<bigint>> => {
      return testMethod(this, "getAmountStaked", params, getContractByCodeHash);
    },
    getRewardPerTokenPaid: async (
      params: Omit<
        TestContractParamsWithoutMaps<StakingAccountTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<bigint>> => {
      return testMethod(
        this,
        "getRewardPerTokenPaid",
        params,
        getContractByCodeHash
      );
    },
    getRewards: async (
      params: Omit<
        TestContractParamsWithoutMaps<StakingAccountTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<bigint>> => {
      return testMethod(this, "getRewards", params, getContractByCodeHash);
    },
    setRewards: async (
      params: TestContractParamsWithoutMaps<
        StakingAccountTypes.Fields,
        { newRewards: bigint; newRewardPerToken: bigint }
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "setRewards", params, getContractByCodeHash);
    },
    stake: async (
      params: TestContractParamsWithoutMaps<
        StakingAccountTypes.Fields,
        { amount: bigint }
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "stake", params, getContractByCodeHash);
    },
    unstake: async (
      params: TestContractParamsWithoutMaps<
        StakingAccountTypes.Fields,
        { amount: bigint }
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "unstake", params, getContractByCodeHash);
    },
    unstakeWithPenalty: async (
      params: TestContractParamsWithoutMaps<
        StakingAccountTypes.Fields,
        { amount: bigint; penalty: bigint }
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(
        this,
        "unstakeWithPenalty",
        params,
        getContractByCodeHash
      );
    },
    claimRewards: async (
      params: Omit<
        TestContractParamsWithoutMaps<StakingAccountTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<bigint>> => {
      return testMethod(this, "claimRewards", params, getContractByCodeHash);
    },
  };

  stateForTest(
    initFields: StakingAccountTypes.Fields,
    asset?: Asset,
    address?: string
  ) {
    return this.stateForTest_(initFields, asset, address, undefined);
  }
}

// Use this object to test and deploy the contract
export const StakingAccount = new Factory(
  Contract.fromJson(
    StakingAccountContractJson,
    "",
    "ac101c6cddd3a5b3dd5dbd09602f23f4e0735a2dbdd25fe2d60733bcbd1fe9a9",
    []
  )
);

// Use this class to interact with the blockchain
export class StakingAccountInstance extends ContractInstance {
  constructor(address: Address) {
    super(address);
  }

  async fetchState(): Promise<StakingAccountTypes.State> {
    return fetchContractState(StakingAccount, this);
  }

  view = {
    getTokenId: async (
      params?: StakingAccountTypes.CallMethodParams<"getTokenId">
    ): Promise<StakingAccountTypes.CallMethodResult<"getTokenId">> => {
      return callMethod(
        StakingAccount,
        this,
        "getTokenId",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    getRewardsTokenId: async (
      params?: StakingAccountTypes.CallMethodParams<"getRewardsTokenId">
    ): Promise<StakingAccountTypes.CallMethodResult<"getRewardsTokenId">> => {
      return callMethod(
        StakingAccount,
        this,
        "getRewardsTokenId",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    getStaker: async (
      params?: StakingAccountTypes.CallMethodParams<"getStaker">
    ): Promise<StakingAccountTypes.CallMethodResult<"getStaker">> => {
      return callMethod(
        StakingAccount,
        this,
        "getStaker",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    getAmountStaked: async (
      params?: StakingAccountTypes.CallMethodParams<"getAmountStaked">
    ): Promise<StakingAccountTypes.CallMethodResult<"getAmountStaked">> => {
      return callMethod(
        StakingAccount,
        this,
        "getAmountStaked",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    getRewardPerTokenPaid: async (
      params?: StakingAccountTypes.CallMethodParams<"getRewardPerTokenPaid">
    ): Promise<
      StakingAccountTypes.CallMethodResult<"getRewardPerTokenPaid">
    > => {
      return callMethod(
        StakingAccount,
        this,
        "getRewardPerTokenPaid",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    getRewards: async (
      params?: StakingAccountTypes.CallMethodParams<"getRewards">
    ): Promise<StakingAccountTypes.CallMethodResult<"getRewards">> => {
      return callMethod(
        StakingAccount,
        this,
        "getRewards",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    setRewards: async (
      params: StakingAccountTypes.CallMethodParams<"setRewards">
    ): Promise<StakingAccountTypes.CallMethodResult<"setRewards">> => {
      return callMethod(
        StakingAccount,
        this,
        "setRewards",
        params,
        getContractByCodeHash
      );
    },
    stake: async (
      params: StakingAccountTypes.CallMethodParams<"stake">
    ): Promise<StakingAccountTypes.CallMethodResult<"stake">> => {
      return callMethod(
        StakingAccount,
        this,
        "stake",
        params,
        getContractByCodeHash
      );
    },
    unstake: async (
      params: StakingAccountTypes.CallMethodParams<"unstake">
    ): Promise<StakingAccountTypes.CallMethodResult<"unstake">> => {
      return callMethod(
        StakingAccount,
        this,
        "unstake",
        params,
        getContractByCodeHash
      );
    },
    unstakeWithPenalty: async (
      params: StakingAccountTypes.CallMethodParams<"unstakeWithPenalty">
    ): Promise<StakingAccountTypes.CallMethodResult<"unstakeWithPenalty">> => {
      return callMethod(
        StakingAccount,
        this,
        "unstakeWithPenalty",
        params,
        getContractByCodeHash
      );
    },
    claimRewards: async (
      params?: StakingAccountTypes.CallMethodParams<"claimRewards">
    ): Promise<StakingAccountTypes.CallMethodResult<"claimRewards">> => {
      return callMethod(
        StakingAccount,
        this,
        "claimRewards",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
  };

  transact = {
    getTokenId: async (
      params: StakingAccountTypes.SignExecuteMethodParams<"getTokenId">
    ): Promise<StakingAccountTypes.SignExecuteMethodResult<"getTokenId">> => {
      return signExecuteMethod(StakingAccount, this, "getTokenId", params);
    },
    getRewardsTokenId: async (
      params: StakingAccountTypes.SignExecuteMethodParams<"getRewardsTokenId">
    ): Promise<
      StakingAccountTypes.SignExecuteMethodResult<"getRewardsTokenId">
    > => {
      return signExecuteMethod(
        StakingAccount,
        this,
        "getRewardsTokenId",
        params
      );
    },
    getStaker: async (
      params: StakingAccountTypes.SignExecuteMethodParams<"getStaker">
    ): Promise<StakingAccountTypes.SignExecuteMethodResult<"getStaker">> => {
      return signExecuteMethod(StakingAccount, this, "getStaker", params);
    },
    getAmountStaked: async (
      params: StakingAccountTypes.SignExecuteMethodParams<"getAmountStaked">
    ): Promise<
      StakingAccountTypes.SignExecuteMethodResult<"getAmountStaked">
    > => {
      return signExecuteMethod(StakingAccount, this, "getAmountStaked", params);
    },
    getRewardPerTokenPaid: async (
      params: StakingAccountTypes.SignExecuteMethodParams<"getRewardPerTokenPaid">
    ): Promise<
      StakingAccountTypes.SignExecuteMethodResult<"getRewardPerTokenPaid">
    > => {
      return signExecuteMethod(
        StakingAccount,
        this,
        "getRewardPerTokenPaid",
        params
      );
    },
    getRewards: async (
      params: StakingAccountTypes.SignExecuteMethodParams<"getRewards">
    ): Promise<StakingAccountTypes.SignExecuteMethodResult<"getRewards">> => {
      return signExecuteMethod(StakingAccount, this, "getRewards", params);
    },
    setRewards: async (
      params: StakingAccountTypes.SignExecuteMethodParams<"setRewards">
    ): Promise<StakingAccountTypes.SignExecuteMethodResult<"setRewards">> => {
      return signExecuteMethod(StakingAccount, this, "setRewards", params);
    },
    stake: async (
      params: StakingAccountTypes.SignExecuteMethodParams<"stake">
    ): Promise<StakingAccountTypes.SignExecuteMethodResult<"stake">> => {
      return signExecuteMethod(StakingAccount, this, "stake", params);
    },
    unstake: async (
      params: StakingAccountTypes.SignExecuteMethodParams<"unstake">
    ): Promise<StakingAccountTypes.SignExecuteMethodResult<"unstake">> => {
      return signExecuteMethod(StakingAccount, this, "unstake", params);
    },
    unstakeWithPenalty: async (
      params: StakingAccountTypes.SignExecuteMethodParams<"unstakeWithPenalty">
    ): Promise<
      StakingAccountTypes.SignExecuteMethodResult<"unstakeWithPenalty">
    > => {
      return signExecuteMethod(
        StakingAccount,
        this,
        "unstakeWithPenalty",
        params
      );
    },
    claimRewards: async (
      params: StakingAccountTypes.SignExecuteMethodParams<"claimRewards">
    ): Promise<StakingAccountTypes.SignExecuteMethodResult<"claimRewards">> => {
      return signExecuteMethod(StakingAccount, this, "claimRewards", params);
    },
  };

  async multicall<Calls extends StakingAccountTypes.MultiCallParams>(
    calls: Calls
  ): Promise<StakingAccountTypes.MultiCallResults<Calls>>;
  async multicall<Callss extends StakingAccountTypes.MultiCallParams[]>(
    callss: Narrow<Callss>
  ): Promise<StakingAccountTypes.MulticallReturnType<Callss>>;
  async multicall<
    Callss extends
      | StakingAccountTypes.MultiCallParams
      | StakingAccountTypes.MultiCallParams[]
  >(callss: Callss): Promise<unknown> {
    return await multicallMethods(
      StakingAccount,
      this,
      callss,
      getContractByCodeHash
    );
  }
}
