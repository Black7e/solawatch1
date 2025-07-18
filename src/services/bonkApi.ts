export interface BonkWallet {
  address: string;
  volume24h: number;
  change24h: number;
  totalTrades: number;
  lastActivity: string;
}

export interface BonkSwap {
  token: string;
  action: 'BUY' | 'SELL';
  amount: number;
  time: string;
  txHash: string;
  walletAddress: string;
}

export interface BonkFundingRate {
  currentRate: number;
  change24h: number;
  nextFunding: string;
  lastUpdated: string;
}

export interface BonkMarketData {
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  holders: number;
}

export class BonkApiService {
  private coingeckoBaseUrl = 'https://api.coingecko.com/api/v3';
  private dexscreenerBaseUrl = 'https://api.dexscreener.com/latest/dex';
  private birdeyeBaseUrl = 'https://public-api.birdeye.so';

  async getBonkMarketData(): Promise<BonkMarketData> {
    try {
      // Try CoinGecko first
      const coingeckoResponse = await fetch(
        `${this.coingeckoBaseUrl}/simple/price?ids=bonk&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
      );
      
      if (coingeckoResponse.ok) {
        const data = await coingeckoResponse.json();
        return {
          price: data.bonk.usd,
          change24h: data.bonk.usd_24h_change,
          volume24h: data.bonk.usd_24h_vol,
          marketCap: data.bonk.usd_market_cap,
          liquidity: 0,
          holders: 0
        };
      } else {
        throw new Error(`CoinGecko API failed with status: ${coingeckoResponse.status}`);
      }
    } catch (error) {
      console.error('CoinGecko API error:', error);
      throw new Error(`Failed to fetch BONK market data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTrendingBonkWallets(): Promise<BonkWallet[]> {
    try {
      // Try to fetch from Birdeye API with correct endpoint
      const response = await fetch(
        `${this.birdeyeBaseUrl}/public/tokenlist?address=DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263&sort_by=v24hUSD&sort_type=desc&offset=0&limit=10`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.data?.slice(0, 5).map((wallet: any) => ({
          address: wallet.address?.slice(0, 6) + '...' + wallet.address?.slice(-4),
          volume24h: wallet.v24hUSD || 0,
          change24h: wallet.change24h || 0,
          totalTrades: wallet.txns || 0,
          lastActivity: wallet.lastTx || '2 hours ago'
        })) || [];
      } else {
        throw new Error(`Birdeye API failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Birdeye API error:', error);
      throw new Error(`Failed to fetch trending BONK wallets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTopBonkSwaps(): Promise<BonkSwap[]> {
    try {
      // Try to fetch from Jupiter API with correct endpoint
      const response = await fetch(
        'https://price.jup.ag/v4/price?ids=DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('Jupiter API response:', data);
        // For now, return empty array since Jupiter only provides price data
        return [];
      } else {
        throw new Error(`Jupiter API failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Jupiter API error:', error);
      throw new Error(`Failed to fetch BONK swaps: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getBonkFundingRate(): Promise<BonkFundingRate> {
    try {
      // Try to fetch from a DEX or CEX API that provides funding rates
      // For now, throw error since we don't have a real funding rate API
      throw new Error('Funding rate API not implemented yet');
    } catch (error) {
      console.error('Funding rate API error:', error);
      throw new Error(`Failed to fetch BONK funding rate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  formatCurrency(amount: number): string {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    } else {
      return `$${amount.toFixed(0)}`;
    }
  }

  formatPercentage(change: number): string {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  }
} 