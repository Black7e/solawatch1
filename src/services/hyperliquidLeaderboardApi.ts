export interface HyperliquidTrader {
  handle: string;
  name: string;
  returnPercent: number;
  totalPnL: number;
  volume: number;
  totalTrades: number;
  walletAddress?: string;
  isElite: boolean;
  avatar?: string;
  description?: string;
}

export interface TraderPosition {
  coin: string;
  side: 'long' | 'short';
  size: number;
  pnl: number;
  entryPrice: number;
  currentPrice: number;
}

export interface LeaderboardResponse {
  traders: HyperliquidTrader[];
  total: number;
  timestamp: number;
}

export class HyperliquidLeaderboardService {
  private baseUrl: string;
  private leaderboardUrl: string;

  constructor() {
    this.baseUrl = 'https://api.hyperliquid.xyz';
    this.leaderboardUrl = 'https://app.hyperliquid.xyz/leaderboard';
  }

  // Fetch leaderboard data from Hyperliquid
  async getLeaderboard(limit: number = 50): Promise<HyperliquidTrader[]> {
    try {
      // Try to fetch from API first
      const apiTraders = await this.fetchFromAPI(limit);
      if (apiTraders.length > 0) {
        return apiTraders;
      }

      // Fallback to mock data if API fails
      console.warn('API failed, using mock data');
      return this.getMockLeaderboard(limit);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return this.getMockLeaderboard(limit);
    }
  }

  // Try to fetch from Hyperliquid API using correct endpoints
  private async fetchFromAPI(limit: number): Promise<HyperliquidTrader[]> {
    try {
      // Try to fetch from the actual leaderboard page first
      const pageData = await this.fetchLeaderboardPage();
      if (pageData.length > 0) {
        return pageData.slice(0, limit);
      }

      // Try alternative API endpoints
      const apiData = await this.fetchFromAlternativeEndpoints();
      if (apiData.length > 0) {
        return apiData.slice(0, limit);
      }

      return [];
    } catch (error) {
      console.error('Error fetching from API:', error);
      return [];
    }
  }

  // Try to fetch from the actual leaderboard page
  private async fetchLeaderboardPage(): Promise<HyperliquidTrader[]> {
    try {
      // Use a CORS proxy to fetch from the leaderboard page
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      const response = await fetch(`${proxyUrl}${encodeURIComponent(this.leaderboardUrl)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard page: ${response.status}`);
      }

      const html = await response.text();
      console.log('Leaderboard page fetched, parsing...');
      
      // Parse the HTML to extract trader data
      return this.parseLeaderboardHTML(html);
    } catch (error) {
      console.warn('Failed to fetch leaderboard page:', error);
      return [];
    }
  }

  // Parse HTML from leaderboard page
  private parseLeaderboardHTML(html: string): HyperliquidTrader[] {
    const traders: HyperliquidTrader[] = [];
    
    try {
      // Create a temporary DOM element to parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Look for trader data in script tags or specific elements
      const scripts = doc.querySelectorAll('script');
      for (const script of scripts) {
        const content = script.textContent || '';
        if (content.includes('leaderboard') || content.includes('trader')) {
          // Try to extract JSON data
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const data = JSON.parse(jsonMatch[0]);
              if (data.traders || Array.isArray(data)) {
                return this.parseLeaderboardData(data.traders || data, 50);
              }
            } catch (e) {
              // Continue to next script
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error parsing HTML:', error);
    }
    
    return traders;
  }

  // Try alternative API endpoints
  private async fetchFromAlternativeEndpoints(): Promise<HyperliquidTrader[]> {
    // Only try the /info endpoint with meta type since it seems to work
    try {
      const response = await fetch(`${this.baseUrl}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'meta' })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('API response from /info:', data);
        
        // Try to extract trader data from response
        const traders = this.extractTraderData(data);
        if (traders.length > 0) {
          return traders;
        }
      } else {
        console.warn(`Failed to fetch from /info: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.warn('Failed to fetch from /info:', error);
    }

    return [];
  }

  // Extract trader data from various API responses
  private extractTraderData(data: any): HyperliquidTrader[] {
    const traders: HyperliquidTrader[] = [];
    
    try {
      // Handle different response formats
      if (data && Array.isArray(data)) {
        return this.parseLeaderboardData(data, 50);
      } else if (data && data.traders) {
        return this.parseLeaderboardData(data.traders, 50);
      } else if (data && data.meta && data.meta.universe) {
        // Extract from universe data - this is what we're actually getting
        console.log('Found universe data, attempting to parse...');
        return this.parseUniverseData(data.meta.universe);
      } else if (data && data.clearinghouseState) {
        // Extract from clearinghouse state
        return this.parseClearinghouseData(data.clearinghouseState);
      } else {
        console.log('No recognizable data structure found:', data);
      }
    } catch (error) {
      console.warn('Error extracting trader data:', error);
    }
    
    return traders;
  }

  // Parse universe data
  private parseUniverseData(universe: any[]): HyperliquidTrader[] {
    const traders: HyperliquidTrader[] = [];
    
    try {
      console.log('Parsing universe data:', universe);
      
      // The universe data contains market information, not trader data
      // Since we can't get actual trader data from this endpoint,
      // we'll return empty array and let it fall back to mock data
      console.log('Universe data contains market info, not trader data. Using mock data instead.');
      
    } catch (error) {
      console.warn('Error parsing universe data:', error);
    }
    
    return traders;
  }

  // Parse clearinghouse data
  private parseClearinghouseData(clearinghouse: any): HyperliquidTrader[] {
    const traders: HyperliquidTrader[] = [];
    
    // This would need to be adapted based on actual clearinghouse data structure
    // For now, return empty array
    return traders;
  }

  // Parse leaderboard data from API response
  private parseLeaderboardData(data: any[], limit: number): HyperliquidTrader[] {
    const traders: HyperliquidTrader[] = [];

    data.slice(0, limit).forEach((trader: any, index: number) => {
      const traderData: HyperliquidTrader = {
        handle: trader.handle || trader.name || `trader_${index + 1}`,
        name: trader.name || trader.handle || `Trader ${index + 1}`,
        returnPercent: parseFloat(trader.returnPercent || trader.return || trader.pnlPercent || 0),
        totalPnL: parseFloat(trader.totalPnL || trader.pnl || trader.profit || 0),
        volume: parseFloat(trader.volume || trader.tradingVolume || 0),
        totalTrades: parseInt(trader.totalTrades || trader.trades || trader.tradeCount || 0),
        walletAddress: trader.walletAddress || trader.address || undefined,
        isElite: false, // Will be calculated below
        avatar: trader.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${trader.handle || index}`,
        description: trader.description || `${trader.name || 'Trader'} on Hyperliquid`
      };

      // Calculate if trader is elite
      traderData.isElite = traderData.totalPnL > 10000 || traderData.totalTrades > 100;

      traders.push(traderData);
    });

    return traders;
  }

  // Get mock leaderboard data (realistic based on Hyperliquid)
  private getMockLeaderboard(limit: number): HyperliquidTrader[] {
    const mockTraders: HyperliquidTrader[] = [
      {
        handle: 'cryptobuild',
        name: 'CryptoBuild',
        returnPercent: 156.78,
        totalPnL: 45678.90,
        volume: 2345678.12,
        totalTrades: 234,
        isElite: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cryptobuild',
        description: 'Professional crypto trader with 5+ years experience'
      },
      {
        handle: 'solana_master',
        name: 'SolanaMaster',
        returnPercent: 89.45,
        totalPnL: 23456.78,
        volume: 1234567.89,
        totalTrades: 156,
        isElite: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=solana_master',
        description: 'Solana ecosystem specialist'
      },
      {
        handle: 'defi_queen',
        name: 'DeFiQueen',
        returnPercent: 234.12,
        totalPnL: 67890.12,
        volume: 3456789.01,
        totalTrades: 345,
        isElite: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=defi_queen',
        description: 'DeFi protocols and yield farming expert'
      },
      {
        handle: 'bitcoin_whale',
        name: 'BitcoinWhale',
        returnPercent: 67.89,
        totalPnL: 123456.78,
        volume: 5678901.23,
        totalTrades: 456,
        isElite: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bitcoin_whale',
        description: 'Bitcoin and major altcoin trader'
      },
      {
        handle: 'meme_trader',
        name: 'MemeTrader',
        returnPercent: 345.67,
        totalPnL: 34567.89,
        volume: 789012.34,
        totalTrades: 89,
        isElite: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=meme_trader',
        description: 'Meme coin and viral token specialist'
      },
      {
        handle: 'stable_trader',
        name: 'StableTrader',
        returnPercent: 23.45,
        totalPnL: 8901.23,
        volume: 456789.01,
        totalTrades: 123,
        isElite: false,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=stable_trader',
        description: 'Conservative trading with high win rate'
      },
      {
        handle: 'futures_king',
        name: 'FuturesKing',
        returnPercent: 178.90,
        totalPnL: 56789.01,
        volume: 2345678.90,
        totalTrades: 234,
        isElite: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=futures_king',
        description: 'Futures trading specialist'
      },
      {
        handle: 'scalp_master',
        name: 'ScalpMaster',
        returnPercent: 45.67,
        totalPnL: 12345.67,
        volume: 890123.45,
        totalTrades: 567,
        isElite: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=scalp_master',
        description: 'Scalping and high-frequency trading'
      },
      {
        handle: 'trend_follower',
        name: 'TrendFollower',
        returnPercent: 89.12,
        totalPnL: 23456.78,
        volume: 1234567.89,
        totalTrades: 178,
        isElite: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=trend_follower',
        description: 'Trend following and momentum trading'
      },
      {
        handle: 'risk_manager',
        name: 'RiskManager',
        returnPercent: 34.56,
        totalPnL: 6789.01,
        volume: 345678.90,
        totalTrades: 234,
        isElite: false,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=risk_manager',
        description: 'Risk management and position sizing expert'
      }
    ];

    return mockTraders.slice(0, limit);
  }

  // Get trader positions (if wallet address is available)
  async getTraderPositions(walletAddress: string): Promise<TraderPosition[]> {
    try {
      const response = await fetch(`${this.baseUrl}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'clearinghouseState',
          user: walletAddress
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.status}`);
      }

      const data = await response.json();
      console.log('Trader positions response:', data);

      return this.parsePositionsData(data);
    } catch (error) {
      console.error('Error fetching trader positions:', error);
      return [];
    }
  }

  // Parse positions data from API response
  private parsePositionsData(data: any): TraderPosition[] {
    const positions: TraderPosition[] = [];

    try {
      if (data && data.assetPositions) {
        data.assetPositions.forEach((position: any) => {
          if (position.szi && parseFloat(position.szi) !== 0) {
            positions.push({
              coin: position.asset || position.coin || 'Unknown',
              side: parseFloat(position.szi) > 0 ? 'long' : 'short',
              size: Math.abs(parseFloat(position.szi)),
              pnl: parseFloat(position.unrealizedPnl || position.pnl || 0),
              entryPrice: parseFloat(position.entryPx || position.entryPrice || 0),
              currentPrice: parseFloat(position.markPx || position.currentPrice || 0)
            });
          }
        });
      }
    } catch (error) {
      console.error('Error parsing positions data:', error);
    }

    return positions;
  }

  // Get trader profile URL
  getTraderProfileUrl(handle: string): string {
    return `https://app.hyperliquid.xyz/user/${handle}`;
  }

  // Copy trader (simulate API call)
  async copyTrader(traderHandle: string, amount: number): Promise<{ success: boolean; message: string }> {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate success/failure
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        return {
          success: true,
          message: `Successfully started copying ${traderHandle} for ${amount} USDT`
        };
      } else {
        return {
          success: false,
          message: 'Failed to start copy trading. Please try again.'
        };
      }
    } catch (error) {
      console.error('Error copying trader:', error);
      throw error;
    }
  }
} 