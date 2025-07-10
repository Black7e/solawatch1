import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ExternalLink, Loader2, ArrowLeft, Search } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import WalletModal from './WalletModal';

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

type SortBy = 'total' | 'roi' | 'winrate' | 'invested' | 'realized' | 'unrealized';

export default function TopTradersPage() {
  const navigate = useNavigate();
  const [topTraders, setTopTraders] = useState<TopTrader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('total');
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const handleConnectWallet = () => {
    setWalletModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleCloseWalletModal = () => {
    setWalletModalOpen(false);
  };

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
          setTopTraders(data.wallets);
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

  const getSortedAndFilteredTraders = () => {
    let filtered = topTraders;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(trader => 
        trader.wallet.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by selected criteria
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'total':
          return b.summary.total - a.summary.total;
        case 'roi':
          return calculateROI(b.summary.total, b.summary.totalInvested) - calculateROI(a.summary.total, a.summary.totalInvested);
        case 'winrate':
          return b.summary.winPercentage - a.summary.winPercentage;
        case 'invested':
          return b.summary.totalInvested - a.summary.totalInvested;
        case 'realized':
          return b.summary.realized - a.summary.realized;
        case 'unrealized':
          return b.summary.unrealized - a.summary.unrealized;
        default:
          return 0;
      }
    });

    return filtered;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header 
          mobileMenuOpen={mobileMenuOpen} 
          setMobileMenuOpen={setMobileMenuOpen}
          onConnectWallet={handleConnectWallet}
        />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading top traders...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header 
          mobileMenuOpen={mobileMenuOpen} 
          setMobileMenuOpen={setMobileMenuOpen}
          onConnectWallet={handleConnectWallet}
        />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-400 mb-2">Failed to load top traders</p>
              <p className="text-gray-400 text-sm">{error}</p>
              <div className="flex gap-2 mt-4 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredTraders = getSortedAndFilteredTraders();

  return (
    <div className="min-h-screen bg-gray-900">
      <Header 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen}
        onConnectWallet={handleConnectWallet}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
          
          <h1 className="text-3xl font-bold text-white mb-2">Top Traders</h1>
          <p className="text-gray-400">
            Discover and analyze the most successful traders on Solana
          </p>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <form onSubmit={(e) => e.preventDefault()}>
                <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                placeholder="Search by wallet address..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              </form>
            </div>

            {/* Sort By */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="total">Total Value</option>
                <option value="roi">ROI</option>
                <option value="winrate">Win Rate</option>
                <option value="invested">Total Invested</option>
                <option value="realized">Realized PnL</option>
                <option value="unrealized">Unrealized PnL</option>
              </select>
            </div>
          </div>
        </div>

        {/* Traders Table */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="text-left text-gray-400 text-sm font-medium py-4 px-6">Rank</th>
                  <th className="text-left text-gray-400 text-sm font-medium py-4 px-6">Trader</th>
                  <th className="text-right text-gray-400 text-sm font-medium py-4 px-6">Total Value</th>
                  <th className="text-right text-gray-400 text-sm font-medium py-4 px-6">ROI</th>
                  <th className="text-right text-gray-400 text-sm font-medium py-4 px-6">Win Rate</th>
                  <th className="text-right text-gray-400 text-sm font-medium py-4 px-6">Realized PnL</th>
                  <th className="text-right text-gray-400 text-sm font-medium py-4 px-6">Unrealized PnL</th>
                  <th className="text-right text-gray-400 text-sm font-medium py-4 px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTraders.map((trader, index) => {
                  const roi = calculateROI(trader.summary.total, trader.summary.totalInvested);
                  const isPositiveROI = roi >= 0;

                  return (
                    <tr key={trader.wallet} className="border-t border-gray-700/50 hover:bg-gray-700/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <span className="text-gray-400 font-mono text-sm">#{index + 1}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {(index + 1).toString()}
                          </div>
                          <div>
                            <div className="text-white font-medium font-mono text-sm">
                              {trader.wallet.slice(0, 8)}...{trader.wallet.slice(-8)}
                            </div>
                            <div className="text-gray-400 text-xs">
                              {trader.summary.totalWins + trader.summary.totalLosses} total trades
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-4 px-6">
                        <div className="text-white font-semibold">
                          {formatCurrency(trader.summary.total)}
                        </div>
                        <div className="text-gray-400 text-xs">
                          Invested: {formatCurrency(trader.summary.totalInvested)}
                        </div>
                      </td>
                      <td className="text-right py-4 px-6">
                        <div className={`font-semibold ${isPositiveROI ? 'text-green-400' : 'text-red-400'}`}>
                          {formatROI(trader.summary.total, trader.summary.totalInvested)}
                        </div>
                      </td>
                      <td className="text-right py-4 px-6">
                        <div className="text-white font-medium">
                          {trader.summary.winPercentage.toFixed(1)}%
                        </div>
                        <div className="text-gray-400 text-xs">
                          {trader.summary.totalWins}W / {trader.summary.totalLosses}L
                        </div>
                      </td>
                      <td className="text-right py-4 px-6">
                        <div className="text-green-400 font-medium">
                          {formatCurrency(trader.summary.realized)}
                        </div>
                      </td>
                      <td className="text-right py-4 px-6">
                        <div className={`font-medium ${trader.summary.unrealized >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(trader.summary.unrealized)}
                        </div>
                      </td>
                      <td className="text-right py-4 px-6">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleAnalyzeWallet(trader.wallet)}
                            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1.5 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-200 flex items-center space-x-1 text-sm"
                          >
                            <TrendingUp className="w-3 h-3" />
                            <span>Analyze</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredTraders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No traders found matching your criteria.</p>
          </div>
        )}
      </div>

      <WalletModal 
        isOpen={walletModalOpen}
        onClose={handleCloseWalletModal}
      />

      <Footer />
    </div>
  );
}