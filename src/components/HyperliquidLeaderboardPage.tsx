import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Copy, X, ChevronDown, Search, ExternalLink, Crown, Users, DollarSign, Activity, RefreshCw, Settings } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import WalletModal from './WalletModal';
import { HyperliquidLeaderboardService, HyperliquidTrader, TraderPosition } from '../services/hyperliquidLeaderboardApi';

export default function HyperliquidLeaderboardPage() {
  const navigate = useNavigate();
  const [traders, setTraders] = useState<HyperliquidTrader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'totalPnL' | 'returnPercent' | 'volume' | 'totalTrades'>('totalPnL');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [selectedTrader, setSelectedTrader] = useState<HyperliquidTrader | null>(null);
  const [copyAmount, setCopyAmount] = useState('');
  const [copyLoading, setCopyLoading] = useState<string | null>(null);
  const [traderPositions, setTraderPositions] = useState<{ [key: string]: TraderPosition[] }>({});
  const [loadingPositions, setLoadingPositions] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const service = new HyperliquidLeaderboardService();

  const handleConnectWallet = () => {
    setWalletModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleCloseWalletModal = () => {
    setWalletModalOpen(false);
  };

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const tradersData = await service.getLeaderboard(50);
      setTraders(tradersData);
      setLastRefresh(new Date());

    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    fetchLeaderboard();

    if (autoRefresh) {
      const interval = setInterval(fetchLeaderboard, 60000);
      return () => clearInterval(interval);
    }
  }, [fetchLeaderboard, autoRefresh]);

  // Fetch trader positions
  const fetchTraderPositions = async (trader: HyperliquidTrader) => {
    if (!trader.walletAddress || traderPositions[trader.handle]) {
      return;
    }

    setLoadingPositions(trader.handle);
    try {
      const positions = await service.getTraderPositions(trader.walletAddress);
      setTraderPositions(prev => ({
        ...prev,
        [trader.handle]: positions
      }));
    } catch (error) {
      console.error('Error fetching positions:', error);
    } finally {
      setLoadingPositions(null);
    }
  };

  const handleCopyTrader = async (trader: HyperliquidTrader) => {
    setSelectedTrader(trader);
    setCopyAmount('100'); // Default amount
    setShowCopyModal(true);
  };

  const handleConfirmCopy = async () => {
    if (!selectedTrader || !copyAmount) return;

    setCopyLoading(selectedTrader.handle);
    try {
      const amount = parseFloat(copyAmount);
      
      if (amount < 10) {
        alert('Minimum investment is 10 USDT');
        return;
      }

      const result = await service.copyTrader(selectedTrader.handle, amount);
      
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
        trader.handle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trader.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'totalPnL':
          comparison = a.totalPnL - b.totalPnL;
          break;
        case 'returnPercent':
          comparison = a.returnPercent - b.returnPercent;
          break;
        case 'volume':
          comparison = a.volume - b.volume;
          break;
        case 'totalTrades':
          comparison = a.totalTrades - b.totalTrades;
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  };

  const getSortIcon = (sortType: string) => {
    if (sortBy !== sortType) return null;
    return sortOrder === 'desc' ? (
      <ChevronDown className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1 rotate-180" />
    );
  };

  const toggleSort = (sortType: 'totalPnL' | 'returnPercent' | 'volume' | 'totalTrades') => {
    if (sortBy === sortType) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(sortType);
      setSortOrder('desc');
    }
  };

  const formatNumber = (num: number, decimals: number = 2): string => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(decimals)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(decimals)}K`;
    }
    return `$${num.toFixed(decimals)}`;
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
            <p className="text-white">Loading Hyperliquid leaderboard...</p>
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
            <h2 className="text-2xl font-bold text-white mb-2">Error Loading Leaderboard</h2>
            <div className="text-gray-400 mb-6 max-w-2xl">
              <pre className="whitespace-pre-wrap text-sm text-left">{error}</pre>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={fetchLeaderboard}
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
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Auto-Trade Bots</h1>
              <p className="text-gray-400">
                Automated trading bots for Hyperliquid's hottest perpetual pairs - Copy their strategies
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchLeaderboard}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <label className="flex items-center space-x-2 text-gray-400">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Auto-refresh</span>
              </label>
            </div>
          </div>
          
          {lastRefresh && (
            <p className="text-xs text-gray-500 mt-2">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex flex-wrap gap-2">
            {(['totalPnL', 'returnPercent', 'volume', 'totalTrades'] as const).map((sortType) => (
              <button
                key={sortType}
                onClick={() => toggleSort(sortType)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  sortBy === sortType
                    ? 'bg-purple-600 text-white'
                    : 'bg-x-bg-secondary hover:bg-x-bg-tertiary text-x-text-secondary hover:text-x-text border border-x-border'
                }`}
              >
                {sortType === 'totalPnL' ? 'Total PnL' :
                 sortType === 'returnPercent' ? 'Return %' :
                 sortType === 'volume' ? 'Volume' : 'Trades'}
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

        {/* Auto-Trade Bots Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTraders.map((trader) => (
            <div
              key={trader.handle}
              className="bg-x-bg-secondary border border-x-border rounded-x p-6 hover:border-x-border-light transition-all duration-200 relative overflow-hidden"
            >
              {/* Perpetual Pair Name at Top */}
              {trader.symbol ? (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 text-sm font-bold text-center">
                  {trader.symbol}/USDT Perpetual
                </div>
              ) : (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 text-sm font-bold text-center">
                  {trader.name.split(' ')[0]}/USDT Perpetual
                </div>
              )}

              {/* Bot Header */}
              <div className="flex items-start justify-between mb-4 pt-8">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                      🤖
                    </div>
                    {trader.isElite && (
                      <Crown className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-white">{trader.name}</h3>
                      {trader.isElite && (
                        <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-medium">
                          Elite
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">Auto-Trade Bot</p>
                    {trader.symbol && (
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                          Automated
                        </span>
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                          {trader.description?.includes('high') ? 'High Vol' : 'Medium Vol'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <a
                    href={service.getTraderProfileUrl(trader.handle)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-x-bg-tertiary hover:bg-x-bg-quaternary text-white p-2 rounded-lg transition-all duration-200"
                    title="View Profile"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigate('/futures-grid')}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-1"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Grid Bot</span>
                    </button>
                    <button
                      onClick={() => handleCopyTrader(trader)}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Performance Metrics - Redesigned for Perps */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center bg-x-bg-tertiary rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">24h Return</p>
                  <p className={`text-xl font-bold ${
                    trader.returnPercent > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {trader.returnPercent > 0 ? '+' : ''}{trader.returnPercent.toFixed(2)}%
                  </p>
                </div>
                <div className="text-center bg-x-bg-tertiary rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Total PnL</p>
                  <p className={`text-xl font-bold ${
                    trader.totalPnL > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatNumber(trader.totalPnL)}
                  </p>
                </div>
                <div className="text-center bg-x-bg-tertiary rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Volume</p>
                  <p className="text-xl font-bold text-white">
                    {formatNumber(trader.volume)}
                  </p>
                </div>
                <div className="text-center bg-x-bg-tertiary rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Trades</p>
                  <p className="text-xl font-bold text-white">
                    {trader.totalTrades.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Bot Trading Stats */}
              {trader.symbol && (
                <div className="mb-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-3 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-purple-300">Bot Configuration</h4>
                    <span className="text-xs bg-purple-500/30 text-purple-300 px-2 py-1 rounded">
                      {trader.symbol}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <p className="text-gray-400">Strategy</p>
                      <p className="text-white font-medium">Grid Bot</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400">Risk Level</p>
                      <p className="text-white font-medium">Medium</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400">Auto-Rebalance</p>
                      <p className="text-white font-medium">Yes</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Current Positions */}
              {trader.walletAddress && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-300">Current Positions</h4>
                    <button
                      onClick={() => fetchTraderPositions(trader)}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {loadingPositions === trader.handle ? 'Loading...' : 'Load Positions'}
                    </button>
                  </div>
                  
                  {traderPositions[trader.handle] ? (
                    traderPositions[trader.handle].length > 0 ? (
                      <div className="space-y-2">
                        {traderPositions[trader.handle].slice(0, 3).map((position, index) => (
                          <div key={index} className="flex items-center justify-between text-sm bg-x-bg-tertiary rounded p-2">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                position.side === 'long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {position.side.toUpperCase()}
                              </span>
                              <span className="text-white">{position.coin}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-white">{position.size.toFixed(2)}</div>
                              <div className={`text-xs ${
                                position.pnl > 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {formatNumber(position.pnl, 0)}
                              </div>
                            </div>
                          </div>
                        ))}
                        {traderPositions[trader.handle].length > 3 && (
                          <div className="text-xs text-gray-400 text-center">
                            +{traderPositions[trader.handle].length - 3} more positions
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No open positions</p>
                    )
                  ) : (
                    <p className="text-xs text-gray-400">Click to load positions</p>
                  )}
                </div>
              )}

              {trader.description && (
                <div className="pt-4 border-t border-x-border">
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
                min="10"
                className="w-full px-3 py-2 bg-x-bg border border-x-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Min 10 USDT"
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
                disabled={copyLoading === selectedTrader.handle}
                className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 text-black rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {copyLoading === selectedTrader.handle ? (
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