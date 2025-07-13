# solawatch1 — On-Chain Intelligence for Real-Time Solana Traders

A modern React + TypeScript dApp for tracking, analyzing, and copying high-performance portfolios from smart wallets on Solana.  
Now optimized for efficient API usage with batching and persistent caching.

---

## 🚀 Features

- **Portfolio Analysis**: Real-time analysis of any Solana wallet, including token balances, values, and price changes.
- **Copy Trading**: One-click portfolio replication using Jupiter DEX.
- **Smart Wallet Tracking**: Follow and analyze top-performing traders.
- **Live Data**: Real-time on-chain data from multiple RPC providers.
- **Efficient API Usage**:  
  - Token info and prices are fetched in large batches (20 at a time).
  - Persistent localStorage cache (24h) for token metadata and prices.
  - Dramatically reduced API calls, even for large portfolios or repeat visits.

---

## 🛠️ Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Keys

Create a `.env` file in the project root and add your API keys.  
**At least one API key is required for the app to function.**

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

- **Solana Tracker**: [Get API Key](https://docs.solanatracker.io/)
- **Helius**: [Get API Key](https://helius.xyz)
- **Alchemy**: [Get API Key](https://alchemy.com)

### 4. Start Development Server

```bash
npm run dev
```

### 5. Testing on Testnet (Optional)

Add to your `.env`:

```env
VITE_NETWORK=testnet
```

Restart the dev server:

```bash
npm run dev
```

---

## ⚡️ API Usage Optimization

- **Batch Fetching**: Token metadata and prices are fetched in batches of 20.
- **Persistent Caching**: All token info and prices are cached in localStorage for 24 hours.
- **Reduced API Calls**: Only uncached tokens are fetched; repeat visits are much faster and lighter on API usage.
- **Fallbacks**: If batch endpoints fail, the app gracefully falls back to per-token fetches.

---

## 🧩 Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Blockchain**: Solana Web3.js, Wallet Adapter
- **DEX Integration**: Jupiter Swap API
- **Data Sources**: Solana Tracker API, Helius, Alchemy, Public RPC
- **Build Tool**: Vite

---

## 🧑‍💻 Environment Variables

| Variable                             | Description                         | Required                       |
| ------------------------------------ | ----------------------------------- | ------------------------------ |
| VITE_SOLANA_TRACKER_API_KEY          | Solana Tracker Data API key         | **Required**                   |
| VITE_SOLANA_TRACKER_RPC_API_KEY      | Solana Tracker RPC API key          | Recommended                    |
| VITE_HELIUS_API_KEY                  | Helius RPC API key                  | Optional (fallback)            |
| VITE_ALCHEMY_API_KEY                 | Alchemy RPC API key                 | Optional                       |
| VITE_CUSTOM_RPC_ENDPOINT             | Custom RPC endpoint URL             | Optional                       |
| VITE_NETWORK                         | Network to use (mainnet or testnet) | Optional (defaults to mainnet) |

---

## 🛠️ Troubleshooting

### 403 Errors

- Ensure your Solana Tracker Data API key is set in `.env`.
- Add your Solana Tracker RPC API key for best performance.
- Add fallback API keys (Helius, Alchemy) for redundancy.
- Restart the dev server after changes.

### Rate Limiting

- Upgrade to a paid API plan if needed.
- Add multiple API keys for load balancing.
- Benefit from built-in request batching and persistent caching.

---

## 🏗️ Production Deployment

1. Sign up for your own API keys (do not use demo keys).
2. Set environment variables in your hosting platform.
3. Build the project:

   ```bash
   npm run build
   ```

4. Deploy the `dist` folder.

---

## 📄 License

MIT

---

## 📫 Contact

For questions or support, open an issue or contact the maintainer via [GitHub](https://github.com/Black7e/solawatch1).

---