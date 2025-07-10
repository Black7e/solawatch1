import { Connection, PublicKey } from '@solana/web3.js';
import { isTestnet, getNetworkDisplayName } from '../config/network';

export interface SolanaTrackerTokenHolding {
  symbol: string;
  name: string;
  amount: number;
  value: number;
  price: number;
  change24h: number;
  logo?: string;
  mint: string;
  marketName?: string;
  priceError?: boolean;
}

export interface SolanaTrackerPortfolioData {
  totalValue: number;
  change24h: number;
  change24hPercent: number;
  tokens: SolanaTrackerTokenHolding[];
  nftCount: number;
  lastActivity: string;
}

export interface APIStatus {
  name: string;
  status: 'pending' | 'fetching' | 'completed' | 'error';
  progress: number;
  description: string;
}

export class SolanaTrackerService {
  private baseUrl = 'https://data.solanatracker.io';
  private apiKey?: string;
  private connection: Connection;

  constructor(connection: Connection, apiKey?: string) {
    this.connection = connection;
    this.apiKey = apiKey || import.meta.env.VITE_SOLANA_TRACKER_API_KEY;
  }

  async getPortfolioData(walletAddress: string): Promise<SolanaTrackerPortfolioData> {
    try {
      // Validate wallet address first
      try {
        new PublicKey(walletAddress);
      } catch (error) {
        throw new Error('Invalid wallet address format. Please enter a valid Solana wallet address.');
      }

      // Check if API key is provided
      if (!this.apiKey || this.apiKey === 'your_solana_tracker_api_key_here') {
        throw new Error(`Solana Tracker API key is required.

Please add your API key to the .env file:
VITE_SOLANA_TRACKER_API_KEY=your_actual_api_key_here

Get your API key at: https://docs.solanatracker.io/`);
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      };

      // Try multiple possible endpoints for wallet portfolio data
      const endpoints = [
        `${this.baseUrl}/portfolio/${walletAddress}`,
        `${this.baseUrl}/wallet/${walletAddress}/portfolio`,
        `${this.baseUrl}/wallet/${walletAddress}/holdings`,
        `${this.baseUrl}/wallet/${walletAddress}`,
        `${this.baseUrl}/wallets/${walletAddress}/portfolio`
      ];
      
      let response: Response | null = null;
      let data: any = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          response = await fetch(endpoint, {
            headers,
            signal: AbortSignal.timeout(30000) // 30 second timeout
          });
          
          if (response.ok) {
            data = await response.json();
            console.log(`Success with endpoint: ${endpoint}`);
            console.log('Response data:', JSON.stringify(data, null, 2));
            break;
          } else {
            console.log(`Endpoint ${endpoint} failed with status: ${response.status}`);
          }
        } catch (endpointError) {
          console.log(`Endpoint ${endpoint} failed with error:`, endpointError);
          continue;
        }
      }
      
      if (!response || !response.ok || !data) {
        throw new Error(`All API endpoints failed. Please check:

1. Your API key is correct: ${this.apiKey?.slice(0, 8)}...${this.apiKey?.slice(-4)}
2. The wallet address is valid: ${walletAddress}
3. The Solana Tracker API documentation for the correct endpoint

Last response status: ${response?.status || 'No response'}`);
      }

      return this.transformSolanaTrackerData(data, walletAddress);

    } catch (error) {
      console.error('Solana Tracker API failed:', error);
      
      if (error instanceof Error) {
        // Re-throw our custom error messages
        if (error.message.includes('API key') || 
            error.message.includes('Rate limit') || 
            error.message.includes('Wallet not found') ||
            error.message.includes('Invalid wallet address') ||
            error.message.includes('All API endpoints failed')) {
          throw error;
        }
        
        // Handle specific HTTP errors
        if (error.message.includes('401')) {
          throw new Error(`Authentication failed for Solana Tracker API.

Please verify your API key in the .env file:
VITE_SOLANA_TRACKER_API_KEY=your_actual_api_key_here

Get your API key at: https://docs.solanatracker.io/

Current API key: ${this.apiKey?.slice(0, 8)}...${this.apiKey?.slice(-4)}`);
        } else if (error.message.includes('429')) {
          throw new Error(`Rate limit exceeded for Solana Tracker API.

Please wait a moment and try again, or upgrade your API plan at: https://docs.solanatracker.io/`);
        } else if (error.message.includes('404')) {
          throw new Error(`Wallet not found or has no activity.

The wallet address "${walletAddress}" may be:
- Invalid or non-existent
- Empty (no tokens or transactions)
- Not yet indexed by Solana Tracker

Please verify the wallet address and try again.`);
        }
        
        // Handle network errors
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout. The Solana Tracker API is taking too long to respond.

Please try again later or check your internet connection.`);
        }
        
        if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
          throw new Error(`Network connection failed.

Please check your internet connection and try again.
If the problem persists, the Solana Tracker API may be temporarily unavailable.`);
        }
        
        throw new Error(`Portfolio analysis failed: ${error.message}

Please try again or contact support if the issue persists.`);
      } else {
        throw new Error('An unknown error occurred while fetching portfolio data. Please try again.');
      }
    }
  }

  private transformSolanaTrackerData(data: any, walletAddress: string): SolanaTrackerPortfolioData {
    const tokens: SolanaTrackerTokenHolding[] = [];
    
    console.log('Raw API response for wallet', walletAddress, ':', JSON.stringify(data, null, 2));
    
    // Check if this is a single token response (like the JSON you provided)
    // This suggests the API returned token info instead of wallet portfolio
    if (data.token && data.pools && !data.tokens && !data.holdings && !data.portfolio) {
      console.warn('Received single token response instead of wallet portfolio. This suggests the API endpoint may be incorrect.');
      
      // For now, we'll create a mock portfolio entry, but this indicates an API issue
      const tokenInfo = data.token;
      const poolInfo = data.pools && data.pools.length > 0 ? data.pools[0] : {};
      const events = data.events || {};
      
      // This is likely not the actual wallet holdings, just token metadata
      throw new Error(`API returned token metadata instead of wallet portfolio.

This suggests:
1. The wallet address "${walletAddress}" might be a token mint address instead
2. The API endpoint structure has changed
3. The wallet has no holdings

Token found: ${tokenInfo.name} (${tokenInfo.symbol})

Please verify you're using a wallet address, not a token address.`);
    }
    
    // Handle the correct wallet portfolio response structure based on your sample
    // Expected format: { tokens: [...], total: number, totalSol: number, timestamp: string }
    if (data.tokens && Array.isArray(data.tokens)) {
      data.tokens.forEach((tokenData: any) => {
        console.log('Processing token:', JSON.stringify(tokenData, null, 2));
        
        // Extract token info from nested structure
        const tokenInfo = tokenData.token || {};
        const balance = tokenData.balance || 0;
        const value = tokenData.value || 0;
        
        // Calculate price from value and balance
        const price = balance > 0 ? value / balance : 0;
        
        tokens.push({
          symbol: tokenInfo.symbol || 'UNKNOWN',
          name: tokenInfo.name || tokenInfo.symbol || 'Unknown Token',
          amount: balance,
          value: value,
          price: price,
          change24h: 0, // Not provided in this API response format
          logo: tokenInfo.image,
          mint: tokenInfo.mint || 'unknown',
          marketName: 'Solana Tracker',
          priceError: false
        });
      });
    }
    else {
      console.warn('Unknown API response structure:', JSON.stringify(data, null, 2));
      throw new Error(`Unexpected API response structure. 
      
Expected: Wallet portfolio data with tokens array: { tokens: [...], total: number, totalSol: number, timestamp: string }
Received: ${Object.keys(data).join(', ')}

This might indicate:
1. Wrong API endpoint
2. API structure has changed  
3. Wallet has no holdings
4. API returned error in unexpected format

Please check the Solana Tracker API documentation or contact support.`);
    }

    // Sort tokens by value (highest first)
    tokens.sort((a, b) => b.value - a.value);

    // Use the total value from the API response, fallback to calculated total
    const totalValue = data.total || tokens.reduce((sum, token) => sum + token.value, 0);
    
    return {
      totalValue: totalValue,
      change24h: data.change24h || 0,
      change24hPercent: data.change24hPercent || 0,
      tokens,
      nftCount: data.nftCount || 0,
      lastActivity: data.timestamp || 'Recently'
    };
  }

  // Additional Solana Tracker API methods
  async getWalletTransactions(walletAddress: string, limit: number = 50) {
    try {
      if (!this.apiKey || this.apiKey === 'your_solana_tracker_api_key_here') {
        throw new Error('Solana Tracker API key is required');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      };

      const response = await fetch(
        `${this.baseUrl}/transactions/${walletAddress}?limit=${limit}`,
        { headers }
      );

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return null;
    }
  }

  async getTokenPrice(tokenAddress: string) {
    try {
      if (!this.apiKey || this.apiKey === 'your_solana_tracker_api_key_here') {
        throw new Error('Solana Tracker API key is required');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      };

      const response = await fetch(
        `${this.baseUrl}/price/${tokenAddress}`,
        { headers }
      );

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Failed to fetch token price: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching token price:', error);
      return null;
    }
  }

  async getWalletPnL(walletAddress: string, timeframe: '24h' | '7d' | '30d' = '24h') {
    try {
      if (!this.apiKey || this.apiKey === 'your_solana_tracker_api_key_here') {
        throw new Error('Solana Tracker API key is required');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      };

      const response = await fetch(
        `${this.baseUrl}/pnl/${walletAddress}?timeframe=${timeframe}`,
        { headers }
      );

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Failed to fetch PnL data: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching PnL data:', error);
      return null;
    }
  }
}