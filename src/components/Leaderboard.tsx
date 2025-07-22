import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ExternalLink, Loader2, Wallet, Share2 } from 'lucide-react';

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
    navigate('/top-traders');
  };

  const handleShare = (trader: TopTrader, index: number) => {
    const shareText = `🔥 Top Trader #${index + 1} on Solana! 📈\n\n💰 Total PnL: ${formatCurrency(trader.summary.total)}\n📊 ROI: ${formatROI(trader.summary.total, trader.summary.totalInvested)}\n🎯 Win Rate: ${trader.summary.winPercentage.toFixed(1)}%\n💎 Total Invested: ${formatCurrency(trader.summary.totalInvested)}\n📈 Total Trades: ${trader.summary.totalWins + trader.summary.totalLosses}\n\nWallet: ${trader.wallet.slice(0, 4)}...${trader.wallet.slice(-4)}\n\nCheck out this trader on SolaWatch! 🔥\n\n#Solana #Trading #Crypto #DeFi`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
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
      <section id="leaderboard" className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-8 h-8 text-x-purple" />
                <h2 className="text-3xl font-bold text-x-text">Top Traders</h2>
              </div>
              <p className="text-x-text-secondary">
                Follow and copy the strategies of the most successful traders on Solana.
              </p>
            </div>
            <button
              onClick={handleLoadMore}
              className="bg-x-bg-secondary hover:bg-x-bg-tertiary text-x-text border border-x-border hover:border-x-border-light px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            >
              View All
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading top traders...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="leaderboard" className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-8 h-8 text-x-purple" />
                <h2 className="text-3xl font-bold text-x-text">Top Traders</h2>
              </div>
              <p className="text-x-text-secondary">
                Follow and copy the strategies of the most successful traders on Solana.
              </p>
            </div>
            <button
              onClick={handleLoadMore}
              className="bg-x-bg-secondary hover:bg-x-bg-tertiary text-x-text border border-x-border hover:border-x-border-light px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            >
              View All
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 max-w-md">
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
      </section>
    );
  }

    return (
    <section id="leaderboard" className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-8 h-8 text-x-purple" />
              <h2 className="text-3xl font-bold text-x-text">Top Traders</h2>
            </div>
            <p className="text-x-text-secondary">
              Follow and copy the strategies of the most successful traders on Solana.
            </p>
          </div>
          <button
            onClick={handleLoadMore}
            className="bg-x-bg-secondary hover:bg-x-bg-tertiary text-x-text border border-x-border hover:border-x-border-light px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          >
            View All
          </button>
        </div>
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
                <button
                  onClick={() => handleShare(trader, index)}
                  className="w-10 h-10 rounded-lg transition-all flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white"
                  title="Share on Twitter"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
    </section>
  );
}