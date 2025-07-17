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

      // If no API data, throw error instead of using mock data
      throw new Error('No leaderboard data available from Hyperliquid API');
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error; // Re-throw to let the UI handle the error
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
      // Try multiple CORS proxies
      const proxies = [
        'https://api.allorigins.win/raw?url=',
        'https://cors-anywhere.herokuapp.com/',
        'https://thingproxy.freeboard.io/fetch/'
      ];

      for (const proxy of proxies) {
        try {
          const response = await fetch(`${proxy}${encodeURIComponent(this.leaderboardUrl)}`);
          
          if (response.ok) {
            const html = await response.text();
            console.log('Leaderboard page fetched, parsing...');
            
            // Parse the HTML to extract trader data
            const traders = this.parseLeaderboardHTML(html);
            if (traders.length > 0) {
              return traders;
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch with proxy ${proxy}:`, error);
          continue;
        }
      }

      // If all proxies fail, try direct fetch (might work in some environments)
      try {
        const response = await fetch(this.leaderboardUrl);
        if (response.ok) {
          const html = await response.text();
          console.log('Leaderboard page fetched directly, parsing...');
          return this.parseLeaderboardHTML(html);
        }
      } catch (error) {
        console.warn('Failed to fetch leaderboard page directly:', error);
      }

      return [];
    } catch (error) {
      console.warn('Failed to fetch leaderboard page:', error);
      return [];
    }
  }

  // Parse HTML from leaderboard page
  private parseLeaderboardHTML(html: string): HyperliquidTrader[] {
    const traders: HyperliquidTrader[] = [];
    
    try {
      // Look for JSON data in script tags
      const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
      if (scriptMatches) {
        for (const script of scriptMatches) {
          const content = script.replace(/<script[^>]*>([\s\S]*?)<\/script>/i, '$1');
          
          // Look for leaderboard data patterns
          const patterns = [
            /leaderboard.*?\[([\s\S]*?)\]/i,
            /traders.*?\[([\s\S]*?)\]/i,
            /users.*?\[([\s\S]*?)\]/i,
            /window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/i,
            /window\.leaderboardData\s*=\s*({[\s\S]*?});/i
          ];

          for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match) {
              try {
                const data = JSON.parse(match[1]);
                if (Array.isArray(data)) {
                  return this.parseLeaderboardData(data, 50);
                } else if (data && typeof data === 'object') {
                  // Try to find trader data in nested objects
                  const traderData = this.extractTraderDataFromObject(data);
                  if (traderData.length > 0) {
                    return traderData;
                  }
                }
              } catch (e) {
                // Continue to next pattern
              }
            }
          }
        }
      }

      // Look for data in JSON-LD scripts
      const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
      if (jsonLdMatches) {
        for (const jsonLd of jsonLdMatches) {
          const content = jsonLd.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i, '$1');
          try {
            const data = JSON.parse(content);
            const traderData = this.extractTraderDataFromObject(data);
            if (traderData.length > 0) {
              return traderData;
            }
          } catch (e) {
            // Continue to next JSON-LD
          }
        }
      }

    } catch (error) {
      console.warn('Error parsing HTML:', error);
    }
    
    return traders;
  }

  // Extract trader data from nested objects
  private extractTraderDataFromObject(obj: any): HyperliquidTrader[] {
    const traders: HyperliquidTrader[] = [];
    
    try {
      // Recursively search for trader-like data
      const searchForTraders = (data: any, path: string = ''): void => {
        if (!data || typeof data !== 'object') return;
        
        if (Array.isArray(data)) {
          // Check if this array contains trader data
          if (data.length > 0 && data[0] && typeof data[0] === 'object') {
            const firstItem = data[0];
            if (firstItem.handle || firstItem.name || firstItem.username || firstItem.address) {
              const traderData = this.parseLeaderboardData(data, 50);
              if (traderData.length > 0) {
                traders.push(...traderData);
              }
            }
          }
          
          // Recursively search array items
          data.forEach((item, index) => {
            searchForTraders(item, `${path}[${index}]`);
          });
        } else {
          // Search object properties
          Object.keys(data).forEach(key => {
            const value = data[key];
            if (key.toLowerCase().includes('trader') || key.toLowerCase().includes('user') || key.toLowerCase().includes('leaderboard')) {
              searchForTraders(value, `${path}.${key}`);
            } else {
              searchForTraders(value, `${path}.${key}`);
            }
          });
        }
      };
      
      searchForTraders(obj);
    } catch (error) {
      console.warn('Error extracting trader data from object:', error);
    }
    
    return traders;
  }

  // Try alternative API endpoints
  private async fetchFromAlternativeEndpoints(): Promise<HyperliquidTrader[]> {
    // Try different API endpoints that might contain leaderboard data
    const endpoints = [
      { url: '/info', method: 'POST', body: { type: 'meta' } },
      { url: '/info', method: 'POST', body: { type: 'leaderboard' } },
      { url: '/info', method: 'POST', body: { type: 'traders' } },
      { url: '/info', method: 'POST', body: { type: 'users' } },
      { url: '/leaderboard', method: 'GET' },
      { url: '/traders', method: 'GET' },
      { url: '/users', method: 'GET' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint.url}`, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: endpoint.method === 'POST' ? JSON.stringify(endpoint.body) : undefined
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`API response from ${endpoint.url}:`, data);
          
          // Try to extract trader data from response
          const traders = this.extractTraderData(data);
          if (traders.length > 0) {
            return traders;
          }
        } else {
          console.warn(`Failed to fetch from ${endpoint.url}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${endpoint.url}:`, error);
        continue;
      }
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
      } else if (data && data.users) {
        return this.parseLeaderboardData(data.users, 50);
      } else if (data && data.leaderboard) {
        return this.parseLeaderboardData(data.leaderboard, 50);
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
      // we'll return empty array
      console.log('Universe data contains market info, not trader data.');
      
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
        handle: trader.handle || trader.name || trader.username || `trader_${index + 1}`,
        name: trader.name || trader.handle || trader.username || `Trader ${index + 1}`,
        returnPercent: parseFloat(trader.returnPercent || trader.return || trader.pnlPercent || trader.performance || 0),
        totalPnL: parseFloat(trader.totalPnL || trader.pnl || trader.profit || trader.totalProfit || 0),
        volume: parseFloat(trader.volume || trader.tradingVolume || trader.totalVolume || 0),
        totalTrades: parseInt(trader.totalTrades || trader.trades || trader.tradeCount || trader.numTrades || 0),
        walletAddress: trader.walletAddress || trader.address || trader.publicKey || undefined,
        isElite: false, // Will be calculated below
        avatar: trader.avatar || trader.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${trader.handle || index}`,
        description: trader.description || trader.bio || `${trader.name || 'Trader'} on Hyperliquid`
      };

      // Calculate if trader is elite
      traderData.isElite = traderData.totalPnL > 10000 || traderData.totalTrades > 100;

      traders.push(traderData);
    });

    return traders;
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