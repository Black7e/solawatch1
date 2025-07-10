import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

// Network configuration
export const NETWORK_CONFIG = {
  // Set to 'testnet' to use testnet, 'mainnet' for mainnet
  NETWORK: (import.meta.env.VITE_NETWORK as 'mainnet' | 'testnet') || 'mainnet',
  
  // Testnet configuration
  TESTNET: {
    network: WalletAdapterNetwork.Testnet,
    rpcEndpoints: [
      // Helius testnet
      import.meta.env.VITE_HELIUS_API_KEY && 
      import.meta.env.VITE_HELIUS_API_KEY !== 'your_helius_api_key_here'
        ? `https://devnet.helius-rpc.com/?api-key=${import.meta.env.VITE_HELIUS_API_KEY}`
        : null,
      
      // Public testnet endpoints
      'https://api.testnet.solana.com',
      'https://api.devnet.solana.com'
    ].filter(Boolean) as string[],
    explorerUrl: 'https://explorer.solana.com',
    explorerCluster: '?cluster=testnet',
    jupiterApiUrl: 'https://quote-api.jup.ag/v6', // Jupiter works on testnet
    solPrice: 0.02, // Testnet SOL has no real value
    tokenMints: {
      SOL: 'So11111111111111111111111111111111111111112',
      USDC: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Testnet USDC
      USDT: 'EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS' // Testnet USDT
    }
  },
  
  // Mainnet configuration
  MAINNET: {
    network: WalletAdapterNetwork.Mainnet,
    rpcEndpoints: [
      // Solana Tracker RPC
      import.meta.env.VITE_SOLANA_TRACKER_RPC_API_KEY && 
      import.meta.env.VITE_SOLANA_TRACKER_RPC_API_KEY !== 'your_solana_tracker_rpc_api_key_here'
        ? `https://rpc-mainnet.solanatracker.io/?api_key=${import.meta.env.VITE_SOLANA_TRACKER_RPC_API_KEY}`
        : null,
      
      // Helius RPC
      import.meta.env.VITE_HELIUS_API_KEY && 
      import.meta.env.VITE_HELIUS_API_KEY !== 'your_helius_api_key_here'
        ? `https://mainnet.helius-rpc.com/?api-key=${import.meta.env.VITE_HELIUS_API_KEY}`
        : null,
      
      // Alchemy RPC
      import.meta.env.VITE_ALCHEMY_API_KEY && 
      import.meta.env.VITE_ALCHEMY_API_KEY !== 'your_alchemy_api_key_here'
        ? `https://solana-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`
        : null,
      
      // Custom endpoint
      import.meta.env.VITE_CUSTOM_RPC_ENDPOINT && 
      import.meta.env.VITE_CUSTOM_RPC_ENDPOINT !== 'https://your-custom-rpc-endpoint.com'
        ? import.meta.env.VITE_CUSTOM_RPC_ENDPOINT
        : null,
      
      // Public RPC as last resort
      'https://api.mainnet-beta.solana.com'
    ].filter(Boolean) as string[],
    explorerUrl: 'https://solscan.io',
    explorerCluster: '',
    jupiterApiUrl: 'https://quote-api.jup.ag/v6',
    solPrice: 116.78, // Approximate SOL price for calculations
    tokenMints: {
      SOL: 'So11111111111111111111111111111111111111112',
      JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
      BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
      ORCA: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
      USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    }
  }
};

// Get current network configuration
export const getCurrentNetworkConfig = () => {
  return NETWORK_CONFIG.NETWORK === 'testnet' ? NETWORK_CONFIG.TESTNET : NETWORK_CONFIG.MAINNET;
};

// Helper functions
export const isTestnet = () => NETWORK_CONFIG.NETWORK === 'testnet';
export const isMainnet = () => NETWORK_CONFIG.NETWORK === 'mainnet';

// Get explorer URL for an address
export const getExplorerUrl = (address: string, type: 'account' | 'token' | 'tx' = 'account') => {
  const config = getCurrentNetworkConfig();
  const baseUrl = config.explorerUrl;
  const cluster = config.explorerCluster;
  
  if (baseUrl.includes('solscan.io')) {
    return `${baseUrl}/${type}/${address}${cluster}`;
  } else {
    // Solana Explorer format
    return `${baseUrl}/${type}/${address}${cluster}`;
  }
};

// Get primary RPC endpoint
export const getPrimaryRpcEndpoint = () => {
  const config = getCurrentNetworkConfig();
  return config.rpcEndpoints[0] || 'https://api.mainnet-beta.solana.com';
};

// Get all RPC endpoints for fallback
export const getAllRpcEndpoints = () => {
  const config = getCurrentNetworkConfig();
  return config.rpcEndpoints;
};

// Get network display name
export const getNetworkDisplayName = () => {
  return NETWORK_CONFIG.NETWORK === 'testnet' ? 'Testnet' : 'Mainnet';
};

// Get SOL price for calculations
export const getSolPrice = () => {
  const config = getCurrentNetworkConfig();
  return config.solPrice;
};

// Get Jupiter API URL
export const getJupiterApiUrl = () => {
  const config = getCurrentNetworkConfig();
  return config.jupiterApiUrl;
};

// Get token mints for current network
export const getTokenMints = () => {
  const config = getCurrentNetworkConfig();
  return config.tokenMints;
};