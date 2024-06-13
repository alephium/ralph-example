# My Firsts

This project contains examples to perform your first transactions,
create your first fungible and non-fungible tokens, etc.

## Install

```
npm install
```

## Start a local devnet for testing and development

Please refer to the documentation here: https://docs.alephium.org/full-node/getting-started#devnet

## Compile

Compile the TypeScript files into JavaScript:

```
npx @alephium/cli@latest compile 
```

## Run

### First transactions

```bash
# Transfer ALPH
npx tx-node src/transfer-alph.ts

# Transfer Token
npx tx-node src/transfer-token.ts
```

### First fungible token

```bash
npx tx-node src/fungible-token.ts
```

### First NFT

```bash
npx tx-node src/non-fungible-token.ts
```
