import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, TrendingUp, Copy, X, ChevronDown, Filter, Search } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import WalletModal from './WalletModal';
import { CopyTradingService, CopyTrader } from '../services/copyTradingApi';

// Simple line chart component
const LineChart: React.FC<{ data: number[]; color?: string }> = ({ data, color = '#10B981' }) => {
  if (data.length < 2) return null;

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="80" height="40" viewBox="0 0 80 40" className="flex-shrink-0">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default function CopyTradingPage() {
  const navigate = useNavigate();
  const [traders, setTraders] = useState<CopyTrader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [category, setCategory] = useState<'futures' | 'spot' | 'options'>('futures');
  const [searchTerm, setSearchTerm] = useState('');
  const [copyLoading, setCopyLoading] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'earnings' | 'roi' | 'winRate' | 'aum'>('earnings');
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [selectedTrader, setSelectedTrader] = useState<CopyTrader | null>(null);
  const [copyAmount, setCopyAmount] = useState('');

  const handleConnectWallet = () => {
    setWalletModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleCloseWalletModal = () => {
    setWalletModalOpen(false);
  };

  useEffect(() => {
    const fetchTraders = async () => {
      try {
        setLoading(true);
        setError(null);

        const service = new CopyTradingService();
        const tradersData = await service.getTopTraders(category, 20);
        setTraders(tradersData);

      } catch (error) {
        console.error('Error fetching copy traders:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch traders');
      } finally {
        setLoading(false);
      }
    };

    fetchTraders();
  }, [category]);

  const handleCopyTrader = async (trader: CopyTrader) => {
    setSelectedTrader(trader);
    setCopyAmount(trader.minInvestment.toString());
    setShowCopyModal(true);
  };

  const handleConfirmCopy = async () => {
    if (!selectedTrader || !copyAmount) return;

    setCopyLoading(selectedTrader.id);
    try {
      const service = new CopyTradingService();
      const amount = parseFloat(copyAmount);
      
      if (amount < selectedTrader.minInvestment) {
        alert(`Minimum investment is ${selectedTrader.minInvestment} ${selectedTrader.currency}`);
        return;
      }

      const result = await service.copyTrader(selectedTrader.id, amount);
      
      if (result.success) {
        alert(result.message);
        setShowCopyModal(false);
        setSelectedTrader(null);
        setCopyAmount('');
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error copying trader:', error);
      alert('Failed to copy trader. Please try again.');
    } finally {
      setCopyLoading(null);
    }
  };

  const getFilteredTraders = () => {
    let filtered = traders;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(trader =>
        trader.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trader.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'earnings':
          return b.earnings7d - a.earnings7d;
        case 'roi':
          return b.roi - a.roi;
        case 'winRate':
          return b.winRate - a.winRate;
        case 'aum':
          return b.aum - a.aum;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getSortIcon = (sortType: string) => {
    return sortBy === sortType ? (
      <ChevronDown className="w-4 h-4 ml-1" />
    ) : null;
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-white">Loading copy traders...</p>
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
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-2">Error Loading Copy Traders</h2>
            <div className="text-gray-400 mb-6 max-w-2xl">
              <pre className="whitespace-pre-wrap text-sm text-left">{error}</pre>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                Retry
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredTraders = getFilteredTraders();

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
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
          
          <h1 className="text-3xl font-bold text-white mb-2">Copy Trading For You</h1>
          <p className="text-gray-400">
            Follow successful traders and copy their strategies automatically
          </p>
        </div>

        {/* Category Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {(['futures', 'spot', 'options'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  category === cat
                    ? 'bg-yellow-500 text-black'
                    : 'bg-x-bg-secondary hover:bg-x-bg-tertiary text-x-text-secondary hover:text-x-text border border-x-border'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex flex-wrap gap-2">
            {(['earnings', 'roi', 'winRate', 'aum'] as const).map((sortType) => (
              <button
                key={sortType}
                onClick={() => setSortBy(sortType)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  sortBy === sortType
                    ? 'bg-purple-600 text-white'
                    : 'bg-x-bg-secondary hover:bg-x-bg-tertiary text-x-text-secondary hover:text-x-text border border-x-border'
                }`}
              >
                {sortType === 'earnings' ? '7D Earnings' :
                 sortType === 'roi' ? 'ROI' :
                 sortType === 'winRate' ? 'Win Rate' : 'AUM'}
                {getSortIcon(sortType)}
              </button>
            ))}
          </div>
          
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search traders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-x-bg-secondary border border-x-border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Traders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTraders.map((trader) => (
            <div
              key={trader.id}
              className="bg-x-bg-secondary border border-x-border rounded-x p-6 hover:border-x-border-light transition-all duration-200"
            >
              {/* Trader Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={trader.avatar}
                    alt={trader.name}
                    className="w-12 h-12 rounded-full bg-gray-700"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-white">{trader.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{trader.copiers} / {trader.maxCopiers}</span>
                      </div>
                      <div className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs">
                        Min {trader.minInvestment}{trader.currency}
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleCopyTrader(trader)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </button>
              </div>

              {/* Earnings Section */}
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-1">Copy trader have earned in last 7 days</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-green-400">
                    +{trader.earnings7d.toLocaleString()}
                  </span>
                  <LineChart data={trader.performanceData} />
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-1">ROI</p>
                  <p className="text-lg font-semibold text-green-400">+{trader.roi.toFixed(2)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-1">AUM</p>
                  <p className="text-lg font-semibold text-white">${trader.aum.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-1">Win Rate</p>
                  <p className="text-lg font-semibold text-white">{trader.winRate.toFixed(2)}%</p>
                </div>
              </div>

              {trader.description && (
                <div className="mt-4 pt-4 border-t border-x-border">
                  <p className="text-sm text-gray-400">{trader.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredTraders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No traders found</h3>
            <p className="text-gray-400">
              Try adjusting your search terms or filters
            </p>
          </div>
        )}
      </div>

      {/* Copy Modal */}
      {showCopyModal && selectedTrader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-x-bg-secondary border border-x-border rounded-x p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Copy {selectedTrader.name}</h3>
              <button
                onClick={() => setShowCopyModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Investment Amount (USDT)
              </label>
              <input
                type="number"
                value={copyAmount}
                onChange={(e) => setCopyAmount(e.target.value)}
                min={selectedTrader.minInvestment}
                className="w-full px-3 py-2 bg-x-bg border border-x-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder={`Min ${selectedTrader.minInvestment} USDT`}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCopyModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCopy}
                disabled={copyLoading === selectedTrader.id}
                className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 text-black rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {copyLoading === selectedTrader.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>Start Copying</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      
      <WalletModal 
        isOpen={walletModalOpen}
        onClose={handleCloseWalletModal}
      />
    </div>
  );
} 