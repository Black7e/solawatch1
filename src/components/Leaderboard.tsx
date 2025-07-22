import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ExternalLink, Loader2, Wallet } from 'lucide-react';

interface TraderSummary {
  realized: number;
  unrealized: number;
  total: number;
  totalInvested: number;
  totalWins: number;
  totalLosses: number;
  averageBuyAmount: number;
  winPercentage: number;
  lossPercentage: number;
  neutralPercentage: number;
}

interface TopTrader {
  wallet: string;
  summary: TraderSummary;
}

interface TopTradersResponse {
  wallets: TopTrader[];
  hasNext: boolean;
  currentPage: number;
  pageSize: number;
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const [topTraders, setTopTraders] = useState<TopTrader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopTraders = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiKey = import.meta.env.VITE_SOLANA_TRACKER_API_KEY;
        
        if (!apiKey || apiKey === 'your_solana_tracker_api_key_here') {
          throw new Error('Solana Tracker API key is required');
        }

        const response = await fetch('https://data.solanatracker.io/top-traders/all', {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Invalid API key');
          } else if (response.status === 429) {
            throw new Error('Rate limit exceeded');
          } else if (response.status === 404) {
            throw new Error('API endpoint not found. The /top-traders/all endpoint may not be available.');
          } else {
            throw new Error(`API error: ${response.status}`);
          }
        }

        const data: TopTradersResponse = await response.json();
        
        if (data && data.wallets && Array.isArray(data.wallets)) {
          // Find the specific wallet and move it to the top
          const targetWallet = 'As7HjLZdz2vbKRXMvjHKSMB5';
          const traders = data.wallets.slice(0, 8);
          
          // Find the target wallet in the list
          const targetIndex = traders.findIndex(trader => 
            trader.wallet === targetWallet || trader.wallet.includes('As7HjL')
          );
          
          if (targetIndex > 0) {
            // Move the target wallet to the front
            const targetTrader = traders.splice(targetIndex, 1)[0];
            traders.unshift(targetTrader);
          }
          
          setTopTraders(traders);
        } else {
          throw new Error('Unexpected API response format. Expected wallets array.');
        }
      } catch (err) {
        console.error('Error fetching top traders:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch top traders');
      } finally {
        setLoading(false);
      }
    };

    fetchTopTraders();
  }, []);

  const handleAnalyzeWallet = (walletAddress: string) => {
    navigate(`/portfolio/${walletAddress}`);
  };

  const handleLoadMore = () => {
    navigate('/hot-wallets');
  };

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1e9) {
      return `$${(value / 1e9).toFixed(1)}B`;
    } else if (Math.abs(value) >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1e3) {
      return `$${(value / 1e3).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatROI = (total: number, invested: number) => {
    if (invested === 0) return '+0%';
    const roi = ((total - invested) / invested) * 100;
    const sign = roi >= 0 ? '+' : '';
    return `${sign}${roi.toFixed(1)}%`;
  };

  const calculateROI = (total: number, invested: number) => {
    if (invested === 0) return 0;
    return ((total - invested) / invested) * 100;
  };

  if (loading) {
    return (
      <section id="leaderboard" className="hidden md:block py-12 sm:py-20 bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Top Performing Smart Wallets
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto px-4">
              Follow and copy the strategies of the most successful traders on Solana.
            </p>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading top traders...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="leaderboard" className="hidden md:block py-12 sm:py-20 bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Top Performing Smart Wallets
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto px-4">
              Follow and copy the strategies of the most successful traders on Solana.
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-400 mb-2">Failed to load top traders</p>
              <p className="text-gray-400 text-sm">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

    return (
    <section id="leaderboard" className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <div className="flex justify-center mb-6">
        <div className="bg-gray-800 border border-purple-500/30 rounded-full px-3 py-1.5 flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <span className="text-purple-400 text-xs font-medium">Top Traders on Solana</span>
        </div>
      </div>
      <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            Top Performing Smart Wallets
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto px-4">
            Follow and copy the strategies of the most successful traders on Solana.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {topTraders.map((trader, index) => (
            <div
              key={trader.wallet}
              className="bg-x-bg-secondary border border-x-border rounded-lg p-6 hover:border-x-border-light transition-all duration-200 hover:shadow-lg"
            >
              {/* Wallet Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-x-purple/20 rounded-full flex items-center justify-center">
                    <span className="text-x-purple font-bold text-sm">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-x-text font-medium text-sm">
                      {trader.wallet.slice(0, 4)}...{trader.wallet.slice(-4)}
                    </p>
                    <p className="text-x-text-secondary text-xs">Wallet</p>
                  </div>
                </div>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-x-text-secondary text-sm">Total PnL</span>
                  <span className={`font-bold ${trader.summary.total >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(trader.summary.total)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-x-text-secondary text-sm">ROI</span>
                  <span className={`font-bold ${calculateROI(trader.summary.total, trader.summary.totalInvested) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatROI(trader.summary.total, trader.summary.totalInvested)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-x-text-secondary text-sm">Win Rate</span>
                  <span className="font-bold text-x-text">
                    {trader.summary.winPercentage.toFixed(1)}%
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-x-text-secondary text-sm">Invested</span>
                  <span className="font-bold text-x-text">
                    {formatCurrency(trader.summary.totalInvested)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-x-text-secondary text-sm">Trades</span>
                  <span className="font-bold text-x-text">
                    {trader.summary.totalWins + trader.summary.totalLosses}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => handleAnalyzeWallet(trader.wallet)}
                  className="flex-1 bg-x-purple hover:bg-x-purple-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Analyze
                </button>
                <button
                  onClick={() => window.open(`https://solscan.io/account/${trader.wallet}`, '_blank')}
                  className="bg-x-bg-tertiary hover:bg-x-bg-quaternary text-x-text px-3 py-2 rounded-lg text-sm transition-colors"
                  title="View on Solscan"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        <div className="text-center">
          <button
            onClick={handleLoadMore}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 mx-auto"
          >
            <TrendingUp className="w-5 h-5" />
            <span>View All</span>
          </button>
        </div>
    </section>
  );
}