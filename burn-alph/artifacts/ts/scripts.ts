/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  Address,
  ExecutableScript,
  ExecuteScriptParams,
  ExecuteScriptResult,
  Script,
  SignerProvider,
  HexString,
} from "@alephium/web3";
import { default as BurnALPHScriptScriptJson } from "../BurnALPHScript.ral.json";

export const BurnALPHScript = new ExecutableScript<{
  burnALPH: HexString;
  amount: bigint;
}>(Script.fromJson(BurnALPHScriptScriptJson, ""));