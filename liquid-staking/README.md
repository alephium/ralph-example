# Alephium Liquid Staking Reward System

A reward system implementation for liquid staking on Alephium blockchain with time-weighted rewards and performance multipliers.

## Features

- 🕒 Time-weighted rewards
  - 1.05x multiplier for 7+ days staking
  - 1.1x multiplier for 30+ days staking
- 📈 Pool performance adjustments
- 🔄 Compound rewards
- ⚖️ Fair reward distribution

## Contract Overview

The reward system implements:

```ralph
Contract RewardSystem(
    tokenId: ByteVec,
    rewardTokenId: ByteVec,
    mut baseRewardRate: U256,
    mut poolPerformanceMultiplier: U256,
    owner: Address
)
```

### Key Functions

- `stake(amount: U256)`: Stake tokens
- `withdraw(amount: U256)`: Withdraw staked tokens
- `claimRewards()`: Claim accumulated rewards
- `compoundRewards()`: Compound rewards into stake
- `updatePoolPerformance(newMultiplier: U256)`: Update pool performance multiplier

## Development

### Prerequisites

- Node.js v16+
- Docker
- npm

### Setup

```bash
# Install dependencies
npm install

# Start local devnet
npm run devnet

# Build contracts
npm run build

# Run tests
npm test
```

### Testing

Tests cover:

- Staking functionality
- Time-weighted multipliers
- Reward calculations
- Pool performance adjustments
- Access control

```bash
# Run all tests
npm test

# Run specific test file
npm test reward_system.test.ts
```

## Project Structure

```
liquid-staking/
├── contracts/
│   └── reward_system.ral     # Main reward contract
├── test/
│   ├── reward_system.test.ts # Contract tests
│   └── utils.ts              # Test utilities
└── alephium.config.ts        # Project configuration
```
