# SolWatcher - On-Chain Intelligence for Real-Time Traders

A React application for tracking, analyzing, and copying high-performance portfolios from smart wallets on Solana.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Keys (Recommended)

Create a `.env` file in the project root and add your API keys. **Note: At least one API key is required for the app to function.**

```env
# Solana Tracker Data API Key (Required for primary features)
VITE_SOLANA_TRACKER_API_KEY=your_solana_tracker_api_key_here

# Solana Tracker RPC API Key (Recommended for best performance)
VITE_SOLANA_TRACKER_RPC_API_KEY=your_solana_tracker_rpc_api_key_here

# Helius API Key (Recommended - Free tier available)
VITE_HELIUS_API_KEY=your_helius_api_key_here

# Alchemy API Key (Optional - Alternative RPC provider)
VITE_ALCHEMY_API_KEY=your_alchemy_api_key_here

# Custom RPC Endpoint (Optional)
VITE_CUSTOM_RPC_ENDPOINT=https://your-custom-rpc-endpoint.com
```

### 3. Get Your API Keys

#### Solana Tracker (Primary - Recommended)
1. Go to [https://docs.solanatracker.io/](https://docs.solanatracker.io/)
2. Sign up for a Data API key
3. Copy your Data API key and add it to `.env` as `VITE_SOLANA_TRACKER_API_KEY`
4. Go to [https://docs.solanatracker.io/solana-rpc](https://docs.solanatracker.io/solana-rpc)
5. Get your RPC API key and add it to `.env` as `VITE_SOLANA_TRACKER_RPC_API_KEY`

#### Helius (Recommended)
1. Go to [https://helius.xyz](https://helius.xyz)
2. Sign up for a free account
3. Create a new project
4. Copy your API key and add it to `.env` as `VITE_HELIUS_API_KEY`

#### Alchemy (Alternative)
1. Go to [https://alchemy.com](https://alchemy.com)
2. Sign up for a free account
3. Create a new Solana app
4. Copy your API key and add it to `.env` as `VITE_ALCHEMY_API_KEY`

### 4. Start Development Server
```bash
npm run dev
```

### 5. Testing on Testnet (Optional)

To test the application on Solana testnet instead of mainnet:

1. Add this to your `.env` file:
```env
VITE_NETWORK=testnet
```

2. Restart the development server:
```bash
npm run dev
```

**Testnet Features:**
- Uses Solana testnet RPC endpoints
- Shows "Testnet" indicator in the header
- Links to testnet explorer
- Uses testnet token addresses
- SOL has no real value (for testing only)
- Portfolio copy trading works with testnet tokens

**Getting Testnet SOL:**
1. Use the [Solana Faucet](https://faucet.solana.com/) to get testnet SOL
2. Connect your wallet to testnet in your wallet settings
3. Request testnet SOL for testing

To switch back to mainnet, remove `VITE_NETWORK=testnet` from your `.env` file and restart.

## Features

- **Portfolio Analysis**: Real-time analysis of any Solana wallet
- **Copy Trading**: One-click portfolio replication using Jupiter DEX
- **Smart Wallet Tracking**: Follow top-performing traders
- **Live Data**: Real-time on-chain data from multiple RPC providers

## API Providers

The app uses multiple API and RPC providers for reliability. **At least one API key must be configured:**

1. **Solana Tracker API** (Primary) - Comprehensive portfolio and trading data
2. **Solana Tracker RPC** (Primary) - Optimized Solana RPC endpoint
3. **Helius RPC** (Fallback) - Reliable, fast, generous free tier
4. **Alchemy RPC** (Fallback) - Enterprise-grade infrastructure
5. **Public RPC** (Emergency fallback) - Only used if no API keys are provided

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SOLANA_TRACKER_API_KEY` | Solana Tracker Data API key | **Required** |
| `VITE_SOLANA_TRACKER_RPC_API_KEY` | Solana Tracker RPC API key | Recommended |
| `VITE_HELIUS_API_KEY` | Helius RPC API key | Optional (fallback) |
| `VITE_ALCHEMY_API_KEY` | Alchemy RPC API key | Optional |
| `VITE_CUSTOM_RPC_ENDPOINT` | Custom RPC endpoint URL | Optional |
| `VITE_NETWORK` | Network to use (`mainnet` or `testnet`) | Optional (defaults to `mainnet`) |

## Production Deployment

For production deployment:

1. Sign up for your own API keys (don't use demo keys)
2. Set environment variables in your hosting platform
3. Build the project: `npm run build`
4. Deploy the `dist` folder

## Troubleshooting

### 403 Errors
If you're getting 403 "Access forbidden" errors:
1. **Required**: Add your Solana Tracker Data API key to `.env` as `VITE_SOLANA_TRACKER_API_KEY`
2. **Recommended**: Add your Solana Tracker RPC API key to `.env` as `VITE_SOLANA_TRACKER_RPC_API_KEY`
3. **Optional**: Add fallback API keys (Helius, Alchemy) for redundancy
4. Make sure the `.env` file is in the project root
5. Restart the development server

### Rate Limiting
If you're hitting rate limits:
1. Upgrade to a paid API plan
2. Add multiple API keys for load balancing
3. Implement request caching (not included in this demo)

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Blockchain**: Solana Web3.js + Wallet Adapter
- **DEX Integration**: Jupiter Swap API
- **Data Sources**: Solana Tracker API, Helius, Alchemy, Public RPC
- **Build Tool**: Vite