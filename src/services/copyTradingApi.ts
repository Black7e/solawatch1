export interface CopyTrader {
  id: string;
  name: string;
  avatar: string;
  copiers: number;
  maxCopiers: number;
  minInvestment: number;
  currency: string;
  earnings7d: number;
  roi: number;
  aum: number;
  winRate: number;
  performanceData: number[]; // For chart data
  category: 'futures' | 'spot' | 'options';
  isActive: boolean;
  description?: string;
}

export interface CopyTradingResponse {
  traders: CopyTrader[];
  total: number;
  page: number;
  limit: number;
}

export class CopyTradingService {
  private baseUrl: string;

  constructor() {
    // Using a mock API for now - replace with actual copy trading API
    this.baseUrl = 'https://api.copytrading.example.com';
  }

  // Get top copy traders
  async getTopTraders(category: string = 'futures', limit: number = 20): Promise<CopyTrader[]> {
    try {
      // For now, return realistic mock data
      // In production, this would be: fetch(`${this.baseUrl}/traders?category=${category}&limit=${limit}`)
      
      const mockTraders: CopyTrader[] = [
        {
          id: '1',
          name: 'CryptoBuild',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CryptoBuild',
          copiers: 104,
          maxCopiers: 200,
          minInvestment: 10,
          currency: 'USDT',
          earnings7d: 26556.14,
          roi: 25.52,
          aum: 142129.19,
          winRate: 66.66,
          performanceData: [0, 5, 12, 8, 15, 22, 25.52],
          category: 'futures',
          isActive: true,
          description: 'Professional crypto trader with 5+ years experience'
        },
        {
          id: '2',
          name: 'SolanaMaster',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SolanaMaster',
          copiers: 87,
          maxCopiers: 150,
          minInvestment: 25,
          currency: 'USDT',
          earnings7d: 18923.45,
          roi: 18.75,
          aum: 98765.32,
          winRate: 72.34,
          performanceData: [0, 3, 8, 12, 15, 17, 18.75],
          category: 'futures',
          isActive: true,
          description: 'Solana ecosystem specialist'
        },
        {
          id: '3',
          name: 'DeFiQueen',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DeFiQueen',
          copiers: 156,
          maxCopiers: 300,
          minInvestment: 50,
          currency: 'USDT',
          earnings7d: 32456.78,
          roi: 31.25,
          aum: 234567.89,
          winRate: 68.92,
          performanceData: [0, 8, 15, 22, 28, 30, 31.25],
          category: 'futures',
          isActive: true,
          description: 'DeFi protocols and yield farming expert'
        },
        {
          id: '4',
          name: 'BitcoinWhale',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BitcoinWhale',
          copiers: 203,
          maxCopiers: 500,
          minInvestment: 100,
          currency: 'USDT',
          earnings7d: 45678.90,
          roi: 22.15,
          aum: 456789.12,
          winRate: 75.45,
          performanceData: [0, 4, 9, 14, 18, 20, 22.15],
          category: 'futures',
          isActive: true,
          description: 'Bitcoin and major altcoin trader'
        },
        {
          id: '5',
          name: 'MemeTrader',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MemeTrader',
          copiers: 67,
          maxCopiers: 100,
          minInvestment: 5,
          currency: 'USDT',
          earnings7d: 12345.67,
          roi: 45.67,
          aum: 34567.89,
          winRate: 58.33,
          performanceData: [0, 15, 25, 35, 40, 43, 45.67],
          category: 'futures',
          isActive: true,
          description: 'Meme coin and viral token specialist'
        },
        {
          id: '6',
          name: 'StableTrader',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=StableTrader',
          copiers: 134,
          maxCopiers: 250,
          minInvestment: 20,
          currency: 'USDT',
          earnings7d: 15678.90,
          roi: 12.34,
          aum: 123456.78,
          winRate: 82.15,
          performanceData: [0, 2, 5, 8, 10, 11, 12.34],
          category: 'futures',
          isActive: true,
          description: 'Conservative trading with high win rate'
        }
      ];

      // Filter by category if specified
      const filteredTraders = category === 'all' 
        ? mockTraders 
        : mockTraders.filter(trader => trader.category === category);

      // Sort by earnings and return limited results
      return filteredTraders
        .sort((a, b) => b.earnings7d - a.earnings7d)
        .slice(0, limit);

    } catch (error) {
      console.error('Error fetching copy traders:', error);
      throw error;
    }
  }

  // Get trader details
  async getTraderDetails(traderId: string): Promise<CopyTrader | null> {
    try {
      const traders = await this.getTopTraders('all', 50);
      return traders.find(trader => trader.id === traderId) || null;
    } catch (error) {
      console.error('Error fetching trader details:', error);
      throw error;
    }
  }

  // Copy a trader (simulate API call)
  async copyTrader(traderId: string, amount: number): Promise<{ success: boolean; message: string }> {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate success/failure
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        return {
          success: true,
          message: `Successfully started copying trader for ${amount} USDT`
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

  // Get trader performance history
  async getTraderPerformance(traderId: string, period: '7d' | '30d' | '90d' = '7d'): Promise<number[]> {
    try {
      const trader = await this.getTraderDetails(traderId);
      if (!trader) {
        throw new Error('Trader not found');
      }

      // Generate realistic performance data based on period
      const dataPoints = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const performance: number[] = [0];
      
      for (let i = 1; i < dataPoints; i++) {
        const previous = performance[i - 1];
        const change = (Math.random() - 0.4) * 5; // Slight positive bias
        performance.push(Math.max(0, previous + change));
      }

      return performance;
    } catch (error) {
      console.error('Error fetching trader performance:', error);
      throw error;
    }
  }
} 