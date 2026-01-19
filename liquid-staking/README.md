# Liquid Staking Contract

A smart contract implementation for liquid staking on Alephium blockchain.

## Overview

This contract implements a liquid staking system with the following features:

- Token staking with flexible amounts
- Time-based reward multipliers
- Performance-based reward adjustments
- Compound staking support
- Flexible withdrawal system

## Contract Features

### Staking

- Users can stake tokens at any time
- Multiple stakes from the same user are combined
- Automatic reward calculation based on stake duration

### Rewards

- Base reward rate adjustable by owner
- Time-based multipliers:
  - 100% base rate for < 7 days
  - 105% for 7-30 days
  - 110% for > 30 days
- Pool performance multiplier (adjustable by owner)
- Rewards are calculated and distributed in a separate reward token

### Withdrawal

- Flexible withdrawal amounts
- Automatic reward claiming during withdrawal
- Complete or partial withdrawal options

## Contract Structure

### State Variables

- `tokenId`: The staking token identifier
- `rewardTokenId`: The reward token identifier
- `baseRewardRate`: Annual reward rate in basis points
- `poolPerformanceMultiplier`: Performance multiplier in basis points
- `owner`: Contract owner address

### Key Functions

- `stake(amount: U256)`: Stake tokens
- `withdraw(amount: U256)`: Withdraw staked tokens
- `claimRewards()`: Claim accumulated rewards
- `updatePoolPerformance(newMultiplier: U256)`: Update pool performance multiplier

## Development

### Prerequisites

- Node.js (version specified in package.json)
- Alephium development environment

### Setup

```bash
# Install dependencies
npm install

# Build contracts
npm run build

# Run tests
npm test
```

### Error Codes

- `InvalidAmount` (0): Invalid amount specified
- `NoStakeFound` (1): No stake found for the caller
- `NoRewardsToClaim` (2): No rewards available to claim
- `InvalidMultiplier` (3): Invalid performance multiplier value

## License

[License Type]
