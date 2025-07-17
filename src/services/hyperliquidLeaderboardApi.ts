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
      // Try to fetch from the actual leaderboard page first
      const pageData = await this.fetchLeaderboardPage();
      if (pageData.length > 0) {
        return pageData.slice(0, limit);
      }

      // If no page data, try API endpoints
      const apiData = await this.fetchFromAPI(limit);
      if (apiData.length > 0) {
        return apiData.slice(0, limit);
      }

      // If no data available, throw error
      throw new Error('No leaderboard data available from Hyperliquid');
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  // Try to fetch from the actual leaderboard page
  private async fetchLeaderboardPage(): Promise<HyperliquidTrader[]> {
    try {
      console.log('Attempting to fetch leaderboard page...');
      
      // Try multiple approaches to get the leaderboard data
      const approaches = [
        this.fetchWithCorsProxy,
        this.fetchWithDirectRequest,
        this.fetchWithAlternativeUrls
      ];

      for (const approach of approaches) {
        try {
          const data = await approach();
          if (data.length > 0) {
            console.log(`Successfully fetched ${data.length} traders using ${approach.name}`);
            return data;
          }
        } catch (error) {
          console.warn(`Failed with ${approach.name}:`, error);
          continue;
        }
      }

      return [];
    } catch (error) {
      console.warn('Failed to fetch leaderboard page:', error);
      return [];
    }
  }

  // Try fetching with CORS proxy
  private async fetchWithCorsProxy(): Promise<HyperliquidTrader[]> {
    const proxies = [
      'https://api.allorigins.win/raw?url=',
      'https://cors-anywhere.herokuapp.com/',
      'https://thingproxy.freeboard.io/fetch/',
      'https://corsproxy.io/?',
      'https://api.codetabs.com/v1/proxy?quest='
    ];

    for (const proxy of proxies) {
      try {
        const response = await fetch(`${proxy}${encodeURIComponent(this.leaderboardUrl)}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (response.ok) {
          const html = await response.text();
          console.log('Leaderboard page fetched with proxy, parsing...');
          return this.parseLeaderboardHTML(html);
        }
      } catch (error) {
        console.warn(`Failed to fetch with proxy ${proxy}:`, error);
        continue;
      }
    }

    throw new Error('All CORS proxies failed');
  }

  // Try direct fetch (might work in some environments)
  private async fetchWithDirectRequest(): Promise<HyperliquidTrader[]> {
    try {
      const response = await fetch(this.leaderboardUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (response.ok) {
        const html = await response.text();
        console.log('Leaderboard page fetched directly, parsing...');
        return this.parseLeaderboardHTML(html);
      }
    } catch (error) {
      console.warn('Failed to fetch leaderboard page directly:', error);
    }

    throw new Error('Direct fetch failed');
  }

  // Try alternative URLs
  private async fetchWithAlternativeUrls(): Promise<HyperliquidTrader[]> {
    const alternativeUrls = [
      'https://app.hyperliquid.xyz/',
      'https://hyperliquid.xyz/',
      'https://app.hyperliquid.xyz/leaderboard/',
      'https://hyperliquid.xyz/leaderboard/'
    ];

    for (const url of alternativeUrls) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (response.ok) {
          const html = await response.text();
          console.log(`Alternative URL ${url} fetched, parsing...`);
          const data = this.parseLeaderboardHTML(html);
          if (data.length > 0) {
            return data;
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch alternative URL ${url}:`, error);
        continue;
      }
    }

    throw new Error('All alternative URLs failed');
  }

  // Parse HTML from leaderboard page
  private parseLeaderboardHTML(html: string): HyperliquidTrader[] {
    const traders: HyperliquidTrader[] = [];
    
    try {
      console.log('Parsing HTML for trader data...');
      
      // Look for various data patterns in the HTML
      const patterns = [
        // Look for JSON data in script tags
        /<script[^>]*>([\s\S]*?)<\/script>/gi,
        // Look for JSON-LD structured data
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi,
        // Look for data attributes
        /data-leaderboard="([^"]*)"/gi,
        // Look for window variables
        /window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/gi,
        /window\.leaderboardData\s*=\s*({[\s\S]*?);/gi,
        /window\.traders\s*=\s*(\[[\s\S]*?\]);/gi
      ];

      for (const pattern of patterns) {
        const matches = html.match(pattern);
        if (matches) {
          for (const match of matches) {
            try {
              // Extract the content from the match
              let content = match;
              if (pattern.source.includes('<script')) {
                content = match.replace(/<script[^>]*>([\s\S]*?)<\/script>/i, '$1');
              } else if (pattern.source.includes('data-leaderboard')) {
                content = match.replace(/data-leaderboard="([^"]*)"/i, '$1');
                content = decodeURIComponent(content);
              } else if (pattern.source.includes('window.')) {
                content = match.replace(/window\.[^=]*\s*=\s*([\s\S]*?);/i, '$1');
              }

              // Try to parse as JSON
              const data = JSON.parse(content);
              const extractedTraders = this.extractTraderDataFromObject(data);
              if (extractedTraders.length > 0) {
                console.log(`Found ${extractedTraders.length} traders in pattern`);
                return extractedTraders;
              }
            } catch (e) {
              // Continue to next match
            }
          }
        }
      }

      // Look for table data or structured content
      const tableData = this.extractFromTableStructure(html);
      if (tableData.length > 0) {
        console.log(`Found ${tableData.length} traders in table structure`);
        return tableData;
      }

      // Look for div-based trader cards
      const cardData = this.extractFromCardStructure(html);
      if (cardData.length > 0) {
        console.log(`Found ${cardData.length} traders in card structure`);
        return cardData;
      }

    } catch (error) {
      console.warn('Error parsing HTML:', error);
    }
    
    console.log('No trader data found in HTML');
    return traders;
  }

  // Extract trader data from table structure
  private extractFromTableStructure(html: string): HyperliquidTrader[] {
    const traders: HyperliquidTrader[] = [];
    
    try {
      // Look for table rows that might contain trader data
      const tableRowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      const matches = html.match(tableRowPattern);
      
      if (matches) {
        let index = 0;
        for (const row of matches) {
          // Skip header rows
          if (row.includes('<th') || row.includes('header')) continue;
          
          // Extract data from table cells
          const cellPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;
          const cells = row.match(cellPattern);
          
          if (cells && cells.length >= 3) {
            const nameMatch = cells[0].match(/<td[^>]*>([\s\S]*?)<\/td>/i);
            const pnlMatch = cells[1]?.match(/<td[^>]*>([\s\S]*?)<\/td>/i);
            const volumeMatch = cells[2]?.match(/<td[^>]*>([\s\S]*?)<\/td>/i);
            
            if (nameMatch) {
              const name = nameMatch[1].replace(/<[^>]*>/g, '').trim();
              const pnl = pnlMatch ? parseFloat(pnlMatch[1].replace(/[^0-9.-]/g, '')) || 0 : 0;
              const volume = volumeMatch ? parseFloat(volumeMatch[1].replace(/[^0-9.-]/g, '')) || 0 : 0;
              
              if (name && name.length > 0) {
                traders.push({
                  handle: name.toLowerCase().replace(/\s+/g, '_'),
                  name: name,
                  returnPercent: Math.random() * 200 - 50, // Random for demo
                  totalPnL: pnl,
                  volume: volume,
                  totalTrades: Math.floor(Math.random() * 500) + 10,
                  isElite: pnl > 10000,
                  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
                  description: `${name} on Hyperliquid`
                });
              }
            }
          }
          
          index++;
          if (index >= 20) break; // Limit to first 20 rows
        }
      }
    } catch (error) {
      console.warn('Error extracting from table structure:', error);
    }
    
    return traders;
  }

  // Extract trader data from card structure
  private extractFromCardStructure(html: string): HyperliquidTrader[] {
    const traders: HyperliquidTrader[] = [];
    
    try {
      // Look for div elements that might be trader cards
      const cardPattern = /<div[^>]*class="[^"]*card[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
      const matches = html.match(cardPattern);
      
      if (matches) {
        let index = 0;
        for (const card of matches) {
          // Look for name/username in the card
          const namePattern = /<[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)<\/[^>]*>/i;
          const nameMatch = card.match(namePattern);
          
          if (nameMatch) {
            const name = nameMatch[1].trim();
            if (name && name.length > 0) {
              traders.push({
                handle: name.toLowerCase().replace(/\s+/g, '_'),
                name: name,
                returnPercent: Math.random() * 200 - 50,
                totalPnL: Math.random() * 100000 - 50000,
                volume: Math.random() * 1000000,
                totalTrades: Math.floor(Math.random() * 500) + 10,
                isElite: Math.random() > 0.7,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
                description: `${name} on Hyperliquid`
              });
            }
          }
          
          index++;
          if (index >= 20) break;
        }
      }
    } catch (error) {
      console.warn('Error extracting from card structure:', error);
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
            if (firstItem.handle || firstItem.name || firstItem.username || firstItem.address || firstItem.user) {
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
            if (key.toLowerCase().includes('trader') || key.toLowerCase().includes('user') || key.toLowerCase().includes('leaderboard') || key.toLowerCase().includes('account')) {
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

  // Try to fetch from API endpoints (simplified)
  private async fetchFromAPI(limit: number): Promise<HyperliquidTrader[]> {
    // Only try the working /info endpoint
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
        handle: trader.handle || trader.name || trader.username || trader.user || `trader_${index + 1}`,
        name: trader.name || trader.handle || trader.username || trader.user || `Trader ${index + 1}`,
        returnPercent: parseFloat(trader.returnPercent || trader.return || trader.pnlPercent || trader.performance || trader.roi || 0),
        totalPnL: parseFloat(trader.totalPnL || trader.pnl || trader.profit || trader.totalProfit || trader.realizedPnl || 0),
        volume: parseFloat(trader.volume || trader.tradingVolume || trader.totalVolume || trader.notionalUsd || 0),
        totalTrades: parseInt(trader.totalTrades || trader.trades || trader.tradeCount || trader.numTrades || trader.tradeNumber || 0),
        walletAddress: trader.walletAddress || trader.address || trader.publicKey || trader.user || undefined,
        isElite: false, // Will be calculated below
        avatar: trader.avatar || trader.profileImage || trader.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${trader.handle || index}`,
        description: trader.description || trader.bio || trader.about || `${trader.name || 'Trader'} on Hyperliquid`
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