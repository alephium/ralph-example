## Devnet

1. deploy the beneficiary asset: `npx @alephium/cli deploy -n devnet --to 0`
2. modify the `settings` for devnet `in alephium.config.ts`
3. deploy the `Auction` contract: `npx @alephium/cli deploy -n devnet --from 1`

## Testnet & Mainnet

1. modify the `settings` for testnet/mainnet in `alephium.config.ts`
2. deploy the contracts: `NODE_URL=... PRIVATE_KEYS=... npx @alephium/cli deploy -n testnet/mainnet`