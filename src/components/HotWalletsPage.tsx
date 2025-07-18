import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ExternalLink, Loader2, ArrowLeft, Search, Filter, Zap } from 'lucide-react';
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

export default function HotWalletsPage() {
  const navigate = useNavigate();
  const [topTraders, setTopTraders] = useState<TopTrader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('total');
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [limit] = useState(20); // Limit to control API costs

  const handleConnectWallet = () => {
    setWalletModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleCloseWalletModal = () => {
    setWalletModalOpen(false);
  };

  useEffect(() => {
    const fetchHotWallets = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiKey = import.meta.env.VITE_SOLANA_TRACKER_API_KEY;
        
        if (!apiKey || apiKey === 'your_solana_tracker_api_key_here') {
          throw new Error('Solana Tracker API key is required');
        }

        const response = await fetch(`https://data.solanatracker.io/top-traders/all?limit=${limit}`, {
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
        console.error('Error fetching hot wallets:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch hot wallets');
      } finally {
        setLoading(false);
      }
    };

    fetchHotWallets();
  }, [limit]);

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
      <div className="min-h-screen bg-x-bg">
        <Header 
          mobileMenuOpen={mobileMenuOpen} 
          setMobileMenuOpen={setMobileMenuOpen}
          onConnectWallet={handleConnectWallet}
        />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-x-purple animate-spin mx-auto mb-4" />
            <p className="text-x-text-secondary">Loading hot wallets...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-x-bg">
        <Header 
          mobileMenuOpen={mobileMenuOpen} 
          setMobileMenuOpen={setMobileMenuOpen}
          onConnectWallet={handleConnectWallet}
        />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-400 mb-2">Failed to load hot wallets</p>
              <p className="text-x-text-secondary text-sm">{error}</p>
              <div className="flex gap-2 mt-4 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="bg-x-bg-secondary hover:bg-x-bg-tertiary text-x-text px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sortedTraders = getSortedAndFilteredTraders();

  return (
    <div className="min-h-screen bg-x-bg">
      <Header 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen}
        onConnectWallet={handleConnectWallet}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-x-purple" />
            <h1 className="text-3xl font-bold text-x-text">Hot Wallets</h1>
          </div>
          <p className="text-x-text-secondary">
            Discover the most active and profitable traders on Solana. Showing top {limit} wallets by performance.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-x-text-secondary w-4 h-4" />
            <input
              type="text"
              placeholder="Search wallets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-x-bg-secondary border border-x-border rounded-lg text-x-text placeholder-x-text-secondary focus:outline-none focus:ring-2 focus:ring-x-purple focus:border-transparent"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-x-text-secondary" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="bg-x-bg-secondary border border-x-border rounded-lg px-3 py-2 text-x-text focus:outline-none focus:ring-2 focus:ring-x-purple focus:border-transparent"
            >
              <option value="total">Total PnL</option>
              <option value="roi">ROI %</option>
              <option value="winrate">Win Rate</option>
              <option value="invested">Total Invested</option>
              <option value="realized">Realized PnL</option>
              <option value="unrealized">Unrealized PnL</option>
            </select>
          </div>
        </div>

        {/* Wallets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTraders.map((trader, index) => (
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

        {/* No Results */}
        {sortedTraders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-x-text-secondary">No wallets found matching your search.</p>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 text-center">
          <p className="text-x-text-secondary text-sm">
            Data is limited to top {limit} wallets to control API costs. 
            <br />
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </div>

      <Footer />
      
      <WalletModal 
        isOpen={walletModalOpen}
        onClose={handleCloseWalletModal}
      />
    </div>
  );
} 