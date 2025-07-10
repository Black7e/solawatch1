import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ExternalLink, Loader2, ArrowRight, Wallet } from 'lucide-react';

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
          throw new Error('Solana Tracker API key is required. Please add your API key to the .env file.');
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
          const traders = data.wallets.slice(0, 4);
          
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
    navigate('/top-traders');
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

  const getTraderName = (wallet: string, index: number) => {
    // Use wallet address as identifier instead of fake names
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  const getTraderAvatar = (wallet: string, index: number) => {
    // Generate a consistent gradient based on wallet address
    const colors = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-yellow-500 to-orange-500',
      'from-red-500 to-rose-500',
      'from-indigo-500 to-purple-500',
      'from-teal-500 to-blue-500',
      'from-orange-500 to-red-500'
    ];
    return colors[index % colors.length];
  };

  const getTraderDescription = (summary: TraderSummary) => {
    if (summary.winPercentage > 80) {
      return "High-precision trader with exceptional win rate";
    } else if (summary.totalInvested > 50000000) {
      return "High-volume trader with significant market impact";
    } else if (summary.total > summary.totalInvested * 2) {
      return "Consistent profit generator with strong returns";
    } else {
      return "Active trader with diverse portfolio strategy";
    }
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-8">
          {topTraders.map((trader, index) => {
            const roi = formatROI(trader.summary.total, trader.summary.totalInvested);
            const isPositive = trader.summary.total >= trader.summary.totalInvested;
            
            return (
              <div
                key={trader.wallet}
                className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 pt-12 sm:p-6 sm:pt-12 hover:border-purple-500/30 transition-all duration-300 group hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10"
              >
                {/* Avatar - positioned on top edge, 50% outside card */}
                <div className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r ${getTraderAvatar(trader.wallet, index)} rounded-xl flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-lg border-4 border-gray-900`}>
                    {trader.wallet.slice(0, 2).toUpperCase()}
                  </div>
                </div>

                {/* Wallet Address - moved to top */}
                <div className="mb-4">
                  <div className="bg-gray-900/60 rounded-xl p-3 border border-gray-700/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <Wallet className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300 text-xs font-mono font-medium truncate">
                            {trader.wallet.slice(0, 8)}...{trader.wallet.slice(-8)}
                          </span>
                        </div>
                        <button className="text-gray-400 hover:text-white transition-colors ml-2 flex-shrink-0">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/30">
                    <div className="text-white font-bold text-lg">
                      {formatCurrency(trader.summary.total)}
                    </div>
                    <div className="text-gray-400 text-xs mt-1">
                      {formatCurrency(trader.summary.totalInvested)} invested
                    </div>
                  </div>
                  <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/30">
                    <div className="text-white font-bold text-lg">
                      {trader.summary.winPercentage.toFixed(1)}%
                    </div>
                    <div className="text-gray-400 text-xs mt-1">
                      {trader.summary.totalWins}W / {trader.summary.totalLosses}L
                    </div>
                  </div>
                </div>
                
                {/* PnL Breakdown */}
                <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/30 mb-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-xs">Realized PnL</span>
                      <span className="text-green-400 font-semibold text-sm">
                        {formatCurrency(trader.summary.realized)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-xs">Unrealized PnL</span>
                      <span className={`font-semibold text-sm ${trader.summary.unrealized >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(trader.summary.unrealized)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Performance Indicator */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-xs font-medium">Performance</span>
                    <span className="text-gray-300 text-xs">
                      {trader.summary.totalWins + trader.summary.totalLosses} trades
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(trader.summary.winPercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Analyze Button */}
                <button 
                  onClick={() => handleAnalyzeWallet(trader.wallet)}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Analyze Portfolio</span>
                </button>
                
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}