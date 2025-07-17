export interface HyperliquidPerpetual {
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  openInterest: number;
  fundingRate: number;
  marketCap?: number;
  assetId: number;
}

interface HyperliquidMarketData {
  perpetuals: HyperliquidPerpetual[];
  timestamp: number;
}

export class HyperliquidService {
  private baseUrl: string;
  private wsUrl: string;

  constructor() {
    // Use mainnet by default, can be configurable
    this.baseUrl = 'https://api.hyperliquid.xyz';
    this.wsUrl = 'wss://api.hyperliquid.xyz/ws';
  }

  // Get all perpetual assets info
  async getPerpetualsInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'meta'
        })
      });

      if (!response.ok) {
        throw new Error(`Hyperliquid API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Hyperliquid meta response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching Hyperliquid perpetuals:', error);
      throw error;
    }
  }

  // Get market data for specific perpetuals
  async getMarketData(assetIds: number[]): Promise<any> {
    try {
      // Try multiple endpoints to get market data
      const endpoints = [
        { type: 'allMids' },
        { type: 'marketData' },
        { type: 'ticker' }
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${this.baseUrl}/exchange`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(endpoint)
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`Hyperliquid ${endpoint.type} response:`, data);
            return data;
          }
        } catch (error) {
          console.warn(`Failed to fetch ${endpoint.type}:`, error);
          continue;
        }
      }

      throw new Error('All market data endpoints failed');
    } catch (error) {
      console.error('Error fetching Hyperliquid market data:', error);
      throw error;
    }
  }

  // Get order book for a specific perpetual
  async getOrderBook(assetId: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'orderBook',
          assetId: assetId
        })
      });

      if (!response.ok) {
        throw new Error(`Hyperliquid API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Hyperliquid order book:', error);
      throw error;
    }
  }

  // Get trending perpetuals based on volume and price change
  async getTrendingPerpetuals(limit: number = 10): Promise<HyperliquidPerpetual[]> {
    try {
      // Fetch real data from Hyperliquid API
      const metaInfo = await this.getPerpetualsInfo();
      
      if (!metaInfo || !metaInfo.data) {
        throw new Error('No meta data received');
      }

      // Get market data
      const marketData = await this.getMarketData([]);

      if (!marketData || !marketData.data) {
        throw new Error('No market data received');
      }

      // Process real data
      const perpetuals: HyperliquidPerpetual[] = [];
      
      // Map the real data structure
      if (metaInfo.data && Array.isArray(metaInfo.data)) {
        metaInfo.data.forEach((perpetual: any, index: number) => {
          const market = marketData.data && marketData.data[index];
          
          if (perpetual && perpetual.name) {
            perpetuals.push({
              name: perpetual.name,
              symbol: perpetual.name.replace('-PERP', ''),
              price: market?.mid || 0,
              change24h: market?.change24h || 0,
              volume24h: market?.volume24h || 0,
              openInterest: market?.openInterest || 0,
              fundingRate: market?.fundingRate || 0,
              assetId: perpetual.assetId || index
            });
          }
        });
      }

      // If no real data, fall back to sample data
      if (perpetuals.length === 0) {
        console.warn('No real data available, using sample data');
        return this.getSamplePerpetuals(limit);
      }

      // Sort by volume and return trending ones
      return perpetuals
        .filter(p => p.volume24h > 0) // Only include active markets
        .sort((a, b) => b.volume24h - a.volume24h)
        .slice(0, limit);

    } catch (error) {
      console.error('Error fetching trending perpetuals:', error);
      // Fall back to sample data on error
      return this.getSamplePerpetuals(limit);
    }
  }

  // Get sample data as fallback
  private getSamplePerpetuals(limit: number): HyperliquidPerpetual[] {
    const samplePerpetuals: HyperliquidPerpetual[] = [
        {
          name: 'BTC-PERP',
          symbol: 'BTC',
          price: 45000,
          change24h: 2.5,
          volume24h: 1500000,
          openInterest: 500000,
          fundingRate: 0.01,
          assetId: 1
        },
        {
          name: 'ETH-PERP',
          symbol: 'ETH',
          price: 2800,
          change24h: -1.2,
          volume24h: 1200000,
          openInterest: 400000,
          fundingRate: 0.008,
          assetId: 2
        },
        {
          name: 'SOL-PERP',
          symbol: 'SOL',
          price: 95,
          change24h: 5.8,
          volume24h: 800000,
          openInterest: 300000,
          fundingRate: 0.015,
          assetId: 3
        },
        {
          name: 'MATIC-PERP',
          symbol: 'MATIC',
          price: 0.85,
          change24h: 3.2,
          volume24h: 600000,
          openInterest: 200000,
          fundingRate: 0.012,
          assetId: 4
        },
        {
          name: 'AVAX-PERP',
          symbol: 'AVAX',
          price: 35,
          change24h: -2.1,
          volume24h: 500000,
          openInterest: 150000,
          fundingRate: 0.009,
          assetId: 5
        },
        {
          name: 'LINK-PERP',
          symbol: 'LINK',
          price: 12.5,
          change24h: 4.7,
          volume24h: 400000,
          openInterest: 120000,
          fundingRate: 0.011,
          assetId: 6
        },
        {
          name: 'DOT-PERP',
          symbol: 'DOT',
          price: 6.8,
          change24h: -3.1,
          volume24h: 350000,
          openInterest: 100000,
          fundingRate: -0.005,
          assetId: 7
        },
        {
          name: 'UNI-PERP',
          symbol: 'UNI',
          price: 8.2,
          change24h: 7.2,
          volume24h: 300000,
          openInterest: 90000,
          fundingRate: 0.018,
          assetId: 8
        },
        {
          name: 'AAVE-PERP',
          symbol: 'AAVE',
          price: 85,
          change24h: -1.8,
          volume24h: 250000,
          openInterest: 80000,
          fundingRate: -0.003,
          assetId: 9
        },
        {
          name: 'SNX-PERP',
          symbol: 'SNX',
          price: 3.2,
          change24h: 12.5,
          volume24h: 200000,
          openInterest: 70000,
          fundingRate: 0.025,
          assetId: 10
        }
      ];

      // Sort by volume and return trending ones
      return samplePerpetuals
        .sort((a, b) => b.volume24h - a.volume24h)
        .slice(0, limit);
  }

  // Get popular perpetuals based on open interest
  async getPopularPerpetuals(limit: number = 10): Promise<HyperliquidPerpetual[]> {
    try {
      const perpetuals = await this.getTrendingPerpetuals(50); // Get more to filter from
      
      // Sort by open interest for popularity
      return perpetuals
        .sort((a, b) => b.openInterest - a.openInterest)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching popular perpetuals:', error);
      throw error;
    }
  }

  // Get high volatility perpetuals
  async getHighVolatilityPerpetuals(limit: number = 10): Promise<HyperliquidPerpetual[]> {
    try {
      const perpetuals = await this.getTrendingPerpetuals(50);
      
      // Sort by absolute price change for volatility
      return perpetuals
        .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching high volatility perpetuals:', error);
      throw error;
    }
  }

  // Subscribe to real-time updates via WebSocket
  subscribeToMarketUpdates(assetIds: number[], callback: (data: any) => void): WebSocket {
    const ws = new WebSocket(this.wsUrl);
    
    ws.onopen = () => {
      console.log('Connected to Hyperliquid WebSocket');
      
      // Subscribe to market data updates
      ws.send(JSON.stringify({
        type: 'subscribe',
        channels: ['marketData'],
        assetIds: assetIds
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Hyperliquid WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Disconnected from Hyperliquid WebSocket');
    };

    return ws;
  }
}

// Export singleton instance
export const hyperliquidService = new HyperliquidService(); 