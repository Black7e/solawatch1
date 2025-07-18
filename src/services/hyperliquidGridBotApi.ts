export interface GridBotConfig {
  symbol: string;
  priceRange: {
    lower: number;
    upper: number;
  };
  gridCount: number;
  gridType: 'arithmetic' | 'geometric';
  investment: number;
  leverage: number;
  marginMode: 'cross' | 'isolated';
  advanced: {
    trailingUp: boolean;
    trailingDown: boolean;
    gridTrigger: boolean;
    takeProfitStopLoss: boolean;
    closeAllOnStop: boolean;
  };
}

export interface GridBotOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  status: 'pending' | 'filled' | 'cancelled';
  timestamp: number;
}

export interface GridBotStatus {
  id: string;
  symbol: string;
  status: 'active' | 'paused' | 'stopped';
  totalPnL: number;
  totalTrades: number;
  currentPrice: number;
  gridOrders: GridBotOrder[];
  createdAt: number;
  lastUpdated: number;
}

export class HyperliquidGridBotService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'https://api.hyperliquid.xyz';
  }

  // Create a new grid bot
  async createGridBot(config: GridBotConfig): Promise<{ success: boolean; botId?: string; message: string }> {
    try {
      console.log('Creating grid bot with config:', config);

      // Validate configuration
      const validation = this.validateConfig(config);
      if (!validation.valid) {
        return { success: false, message: validation.error || 'Invalid configuration' };
      }

      // Calculate grid levels
      const gridLevels = this.calculateGridLevels(config);
      
      // Prepare orders for each grid level
      const orders = this.prepareGridOrders(config, gridLevels);

      // Simulate API call to Hyperliquid
      // In a real implementation, this would call Hyperliquid's grid bot API
      const response = await this.simulateGridBotCreation(config, orders);

      if (response.success) {
        return {
          success: true,
          botId: response.botId,
          message: `Grid bot created successfully! Bot ID: ${response.botId}`
        };
      } else {
        return { success: false, message: response.message };
      }

    } catch (error) {
      console.error('Error creating grid bot:', error);
      return { success: false, message: 'Failed to create grid bot. Please try again.' };
    }
  }

  // Get grid bot status
  async getGridBotStatus(botId: string): Promise<GridBotStatus | null> {
    try {
      // Simulate API call to get bot status
      const response = await this.simulateGetBotStatus(botId);
      return response;
    } catch (error) {
      console.error('Error fetching grid bot status:', error);
      return null;
    }
  }

  // Stop grid bot
  async stopGridBot(botId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Simulate API call to stop bot
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'Grid bot stopped successfully'
      };
    } catch (error) {
      console.error('Error stopping grid bot:', error);
      return { success: false, message: 'Failed to stop grid bot' };
    }
  }

  // Pause grid bot
  async pauseGridBot(botId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Simulate API call to pause bot
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'Grid bot paused successfully'
      };
    } catch (error) {
      console.error('Error pausing grid bot:', error);
      return { success: false, message: 'Failed to pause grid bot' };
    }
  }

  // Resume grid bot
  async resumeGridBot(botId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Simulate API call to resume bot
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'Grid bot resumed successfully'
      };
    } catch (error) {
      console.error('Error resuming grid bot:', error);
      return { success: false, message: 'Failed to resume grid bot' };
    }
  }

  // Get user's active grid bots
  async getActiveGridBots(): Promise<GridBotStatus[]> {
    try {
      // Simulate API call to get active bots
      const bots = await this.simulateGetActiveBots();
      return bots;
    } catch (error) {
      console.error('Error fetching active grid bots:', error);
      return [];
    }
  }

  // Validate grid bot configuration
  private validateConfig(config: GridBotConfig): { valid: boolean; error?: string } {
    if (config.priceRange.lower >= config.priceRange.upper) {
      return { valid: false, error: 'Lower price must be less than upper price' };
    }

    if (config.gridCount < 2 || config.gridCount > 100) {
      return { valid: false, error: 'Grid count must be between 2 and 100' };
    }

    if (config.investment <= 0) {
      return { valid: false, error: 'Investment amount must be greater than 0' };
    }

    if (config.leverage < 1 || config.leverage > 50) {
      return { valid: false, error: 'Leverage must be between 1x and 50x' };
    }

    return { valid: true };
  }

  // Calculate grid levels based on configuration
  private calculateGridLevels(config: GridBotConfig): number[] {
    const { lower, upper } = config.priceRange;
    const gridCount = config.gridCount;
    const levels: number[] = [];

    if (config.gridType === 'arithmetic') {
      const spacing = (upper - lower) / (gridCount - 1);
      for (let i = 0; i < gridCount; i++) {
        levels.push(lower + (spacing * i));
      }
    } else {
      // Geometric grid
      const ratio = Math.pow(upper / lower, 1 / (gridCount - 1));
      for (let i = 0; i < gridCount; i++) {
        levels.push(lower * Math.pow(ratio, i));
      }
    }

    return levels;
  }

  // Prepare grid orders
  private prepareGridOrders(config: GridBotConfig, gridLevels: number[]): GridBotOrder[] {
    const orders: GridBotOrder[] = [];
    const avgPrice = (config.priceRange.lower + config.priceRange.upper) / 2;
    const quantityPerGrid = (config.investment / config.leverage) / avgPrice / gridLevels.length;

    gridLevels.forEach((price, index) => {
      // Buy orders below current price
      if (price < avgPrice) {
        orders.push({
          id: `buy_${index}`,
          symbol: config.symbol,
          side: 'buy',
          price: price,
          quantity: quantityPerGrid,
          status: 'pending',
          timestamp: Date.now()
        });
      }
      
      // Sell orders above current price
      if (price > avgPrice) {
        orders.push({
          id: `sell_${index}`,
          symbol: config.symbol,
          side: 'sell',
          price: price,
          quantity: quantityPerGrid,
          status: 'pending',
          timestamp: Date.now()
        });
      }
    });

    return orders;
  }

  // Simulate grid bot creation
  private async simulateGridBotCreation(config: GridBotConfig, orders: GridBotOrder[]): Promise<{ success: boolean; botId?: string; message: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate success/failure
    const success = Math.random() > 0.1; // 90% success rate

    if (success) {
      const botId = `grid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        success: true,
        botId,
        message: 'Grid bot created successfully'
      };
    } else {
      return {
        success: false,
        message: 'Insufficient balance or market conditions not suitable'
      };
    }
  }

  // Simulate getting bot status
  private async simulateGetBotStatus(botId: string): Promise<GridBotStatus | null> {
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate bot status
    return {
      id: botId,
      symbol: 'BTC',
      status: 'active',
      totalPnL: Math.random() * 1000 - 500, // Random PnL between -500 and 500
      totalTrades: Math.floor(Math.random() * 50),
      currentPrice: 50000 + (Math.random() - 0.5) * 2000,
      gridOrders: [],
      createdAt: Date.now() - 3600000, // 1 hour ago
      lastUpdated: Date.now()
    };
  }

  // Simulate getting active bots
  private async simulateGetActiveBots(): Promise<GridBotStatus[]> {
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate active bots
    return [
      {
        id: 'grid_1',
        symbol: 'BTC',
        status: 'active',
        totalPnL: 245.67,
        totalTrades: 12,
        currentPrice: 51234.56,
        gridOrders: [],
        createdAt: Date.now() - 7200000, // 2 hours ago
        lastUpdated: Date.now()
      },
      {
        id: 'grid_2',
        symbol: 'ETH',
        status: 'paused',
        totalPnL: -89.23,
        totalTrades: 8,
        currentPrice: 3245.78,
        gridOrders: [],
        createdAt: Date.now() - 3600000, // 1 hour ago
        lastUpdated: Date.now()
      }
    ];
  }

  // Get market data for a symbol
  async getMarketData(symbol: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'meta' })
      });

      if (response.ok) {
        const data = await response.json();
        return data.meta?.universe?.find((m: any) => m.name === symbol) || null;
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
    }

    return null;
  }

  // Calculate required margin for grid bot
  calculateRequiredMargin(config: GridBotConfig): number {
    const { lower, upper } = config.priceRange;
    const avgPrice = (lower + upper) / 2;
    const gridSpacing = (upper - lower) / (config.gridCount - 1);
    const quantityPerGrid = gridSpacing / avgPrice;
    const totalQuantity = quantityPerGrid * config.gridCount;
    return (totalQuantity * avgPrice) / config.leverage;
  }

  // Calculate estimated profit per grid
  calculateProfitPerGrid(config: GridBotConfig): { min: number; max: number } {
    const { lower, upper } = config.priceRange;
    const gridCount = config.gridCount;
    
    if (config.gridType === 'arithmetic') {
      const gridSpacing = (upper - lower) / (gridCount - 1);
      const minProfit = (gridSpacing / lower) * 100;
      const maxProfit = (gridSpacing / upper) * 100;
      return { min: minProfit, max: maxProfit };
    } else {
      const ratio = Math.pow(upper / lower, 1 / (gridCount - 1));
      const profit = (ratio - 1) * 100;
      return { min: profit, max: profit };
    }
  }
} 