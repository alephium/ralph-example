/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, ContractFactory } from "@alephium/web3";
import { Staking, StakingAccount } from ".";

let contracts: ContractFactory<any>[] | undefined = undefined;
export function getContractByCodeHash(codeHash: string): Contract {
  if (contracts === undefined) {
    contracts = [Staking, StakingAccount];
  }
  const c = contracts.find((c) => c.contract.hasCodeHash(codeHash));
  if (c === undefined) {
    throw new Error("Unknown code with code hash: " + codeHash);
  }
  return c.contract;
}
