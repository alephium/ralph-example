/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, ContractFactory } from "@alephium/web3";

let contracts: ContractFactory<any>[] | undefined = undefined;

export function registerContract(factory: ContractFactory<any>) {
  if (contracts === undefined) {
    contracts = [factory];
  } else {
    contracts.push(factory);
  }
}
export function getContractByCodeHash(codeHash: string): Contract {
  const c = contracts?.find((c) => c.contract.hasCodeHash(codeHash));
  if (c === undefined) {
    throw new Error("Unknown code with code hash: " + codeHash);
  }
  return c.contract;
}
