# SolaWatch - Solana Portfolio Tracker & Token Swapper

A comprehensive Solana portfolio tracking and token swapping application with trending tokens, cart functionality, and portfolio copying features.

## Features

- **Portfolio Analysis**: Track your Solana portfolio performance
- **Trending Tokens**: Discover trending tokens with risk analysis
- **Quick Buy**: Purchase individual tokens with SOL or USDC
- **Cart System**: Build and execute multi-token purchases
- **Portfolio Copying**: Copy successful trader portfolios
- **Wallet Integration**: Support for Phantom and other Solana wallets
- **Risk Analysis**: Comprehensive risk assessment for tokens

## Fee System

The application includes a **1% fee** on all swaps that is automatically sent to the fee wallet address: `ATMZV7kBh4ntquvW5vVbH6DCzgxdXTrs2MwgjF2TNy9h`

### How Fees Work

- **Fee Percentage**: 1% of the total swap amount
- **Fee Wallet**: `ATMZV7kBh4ntquvW5vVbH6DCzgxdXTrs2MwgjF2TNy9h`
- **Transparency**: Fee calculations are displayed in real-time before each swap
- **Automatic**: Fees are automatically deducted and sent during swap execution

### Fee Display

When you enter an amount to swap, you'll see:
- **Original Amount**: Your input amount
- **Fee (1%)**: The fee being deducted
- **Net Amount**: The amount actually used for the swap

### Supported Operations

Fees apply to:
- Quick Buy modal (individual token purchases)
- Cart purchases (multi-token purchases)
- Portfolio copying (batch portfolio replication)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (see Configuration section)
4. Start the development server:
   ```bash
   npm run dev
   ```

## Configuration

Create a `.env` file with the following variables:

```env
# Network Configuration
VITE_NETWORK=mainnet

# RPC Endpoints
VITE_HELIUS_API_KEY=your_helius_api_key_here
VITE_SOLANA_TRACKER_RPC_API_KEY=your_solana_tracker_rpc_api_key_here
VITE_ALCHEMY_API_KEY=your_alchemy_api_key_here
VITE_CUSTOM_RPC_ENDPOINT=https://your-custom-rpc-endpoint.com

# Fee Configuration (optional - defaults to 1% fee enabled)
VITE_FEE_ENABLED=true
VITE_FEE_PERCENTAGE=1
VITE_FEE_WALLET_ADDRESS=ATMZV7kBh4ntquvW5vVbH6DCzgxdXTrs2MwgjF2TNy9h
```

## Usage

1. **Connect Wallet**: Use Phantom or any Solana wallet
2. **Browse Trending Tokens**: View trending tokens with risk analysis
3. **Quick Buy**: Click "Quick Buy" on any token for instant purchase
4. **Add to Cart**: Use the cart icon to build multi-token purchases
5. **Portfolio Analysis**: Analyze your current portfolio performance
6. **Copy Portfolios**: Replicate successful trader portfolios

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Solana**: @solana/web3.js, @solana/wallet-adapter
- **Swapping**: Jupiter Aggregator API
- **Data**: Solana Tracker API, Jupiter Token List
- **Authentication**: X (Twitter) OAuth 2.0 with Netlify Functions
- **Deployment**: Netlify

## Credits

### Core Development
- **Lead Developer**: Tony Huynh
- **Project**: SolaWatch - Solana Portfolio Tracker & Token Swapper

### Key Technologies & APIs
- **Jupiter Aggregator**: Best-in-class Solana DEX aggregator for token swaps
- **Solana Tracker**: Portfolio and market data provider
- **Helius**: High-performance Solana RPC provider
- **Netlify**: Serverless functions and hosting platform
- **X (Twitter)**: OAuth authentication provider

### Open Source Libraries
- **React**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Fast build tool and dev server
- **Solana Web3.js**: Solana blockchain interaction
- **Solana Wallet Adapter**: Wallet integration

### Design & UX
- **UI/UX Design**: Modern, responsive design with dark theme
- **User Experience**: Intuitive portfolio tracking and token discovery
- **Accessibility**: Designed for all users

### Special Thanks
- Solana community for blockchain infrastructure
- Jupiter team for DEX aggregation technology
- Netlify team for serverless platform
- All contributors and beta testers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue on GitHub.