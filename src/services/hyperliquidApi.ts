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
          type: 'perpetuals'
        })
      });

      if (!response.ok) {
        throw new Error(`Hyperliquid API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Hyperliquid perpetuals:', error);
      throw error;
    }
  }

  // Get market data for specific perpetuals
  async getMarketData(assetIds: number[]): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'marketData',
          assetIds: assetIds
        })
      });

      if (!response.ok) {
        throw new Error(`Hyperliquid API error: ${response.status}`);
      }

      return await response.json();
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
      // First get all perpetuals info
      const perpetualsInfo = await this.getPerpetualsInfo();
      
      if (!perpetualsInfo || !perpetualsInfo.data) {
        throw new Error('No perpetuals data received');
      }

      // Get market data for all perpetuals
      const assetIds = perpetualsInfo.data.map((p: any) => p.assetId);
      const marketData = await this.getMarketData(assetIds);

      if (!marketData || !marketData.data) {
        throw new Error('No market data received');
      }

      // Combine and process the data
      const perpetuals: HyperliquidPerpetual[] = perpetualsInfo.data.map((perpetual: any, index: number) => {
        const market = marketData.data[index];
        
        return {
          name: perpetual.name,
          symbol: perpetual.symbol,
          price: market?.price || 0,
          change24h: market?.change24h || 0,
          volume24h: market?.volume24h || 0,
          openInterest: market?.openInterest || 0,
          fundingRate: market?.fundingRate || 0,
          assetId: perpetual.assetId
        };
      });

      // Sort by volume and filter trending ones
      const trending = perpetuals
        .filter(p => p.volume24h > 0) // Only include active markets
        .sort((a, b) => {
          // Sort by volume first, then by price change
          const volumeDiff = b.volume24h - a.volume24h;
          if (Math.abs(volumeDiff) > 1000) return volumeDiff;
          return Math.abs(b.change24h) - Math.abs(a.change24h);
        })
        .slice(0, limit);

      return trending;
    } catch (error) {
      console.error('Error fetching trending perpetuals:', error);
      throw error;
    }
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