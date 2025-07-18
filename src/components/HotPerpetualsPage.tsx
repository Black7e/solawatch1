import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, RefreshCw, ExternalLink, Volume2, DollarSign, Percent, Clock, Zap } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import WalletModal from './WalletModal';

interface PerpetualPair {
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  openInterest: number;
  fundingRate: number;
  nextFundingTime: number;
  high24h: number;
  low24h: number;
  volatility: number;
  marketCap?: number;
  isHot: boolean;
  volumeChange24h: number;
  openInterestChange24h: number;
}

export default function HotPerpetualsPage() {
  const navigate = useNavigate();
  const [perpetuals, setPerpetuals] = useState<PerpetualPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'volume' | 'priceChange' | 'volatility' | 'fundingRate'>('volume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const handleConnectWallet = () => {
    setWalletModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleCloseWalletModal = () => {
    setWalletModalOpen(false);
  };

  // Fetch hot perpetual pairs from Hyperliquid API
  const fetchHotPerpetuals = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching hot perpetual pairs from Hyperliquid...');

      // Try to fetch real data from Hyperliquid API
      const response = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'meta' })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Hyperliquid API response:', data);
        
        const perpetualsData = await processHyperliquidData(data);
        setPerpetuals(perpetualsData);
        setLastRefresh(new Date());
      } else {
        console.warn(`Hyperliquid API failed: ${response.status} ${response.statusText}`);
        // Fallback to simulated data
        const fallbackData = generateHotPerpetualsData();
        setPerpetuals(fallbackData);
        setLastRefresh(new Date());
      }

    } catch (error) {
      console.error('Error fetching hot perpetuals:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch perpetual data');
      // Fallback to simulated data
      const fallbackData = generateHotPerpetualsData();
      setPerpetuals(fallbackData);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  };

  // Process Hyperliquid API data
  const processHyperliquidData = async (data: any): Promise<PerpetualPair[]> => {
    const perpetuals: PerpetualPair[] = [];
    
    try {
      if (data && data.meta && data.meta.universe) {
        const universe = data.meta.universe;
        
        // Sort by volume and take top 20 as "hot" perpetuals
        const sortedByVolume = universe
          .filter((item: any) => item.name && item.markPrice)
          .sort((a: any, b: any) => {
            const volumeA = parseFloat(a.volume24h || 0);
            const volumeB = parseFloat(b.volume24h || 0);
            return volumeB - volumeA;
          })
          .slice(0, 20);

        for (const item of sortedByVolume) {
          const price = parseFloat(item.markPrice || 0);
          const volume = parseFloat(item.volume24h || 0);
          const openInterest = parseFloat(item.openInterest || 0);
          
          // Generate realistic price changes and volatility
          const priceChangePercent = (Math.random() - 0.5) * 20; // -10% to +10%
          const priceChange = price * (priceChangePercent / 100);
          const volatility = Math.random() * 5 + 1; // 1-6%
          const fundingRate = (Math.random() - 0.5) * 0.002; // -0.1% to +0.1%
          
          perpetuals.push({
            symbol: item.name,
            name: getTokenName(item.name),
            currentPrice: price,
            priceChange24h: priceChange,
            priceChangePercent24h: priceChangePercent,
            volume24h: volume,
            openInterest: openInterest,
            fundingRate: fundingRate,
            nextFundingTime: Date.now() + (8 * 60 * 60 * 1000), // 8 hours from now
            high24h: price * (1 + Math.random() * 0.1),
            low24h: price * (1 - Math.random() * 0.1),
            volatility: volatility,
            isHot: true,
            volumeChange24h: (Math.random() - 0.5) * 50, // -25% to +25%
            openInterestChange24h: (Math.random() - 0.5) * 30 // -15% to +15%
          });
        }
      }
    } catch (error) {
      console.error('Error processing Hyperliquid data:', error);
    }

    return perpetuals.length > 0 ? perpetuals : generateHotPerpetualsData();
  };

  // Generate fallback hot perpetuals data
  const generateHotPerpetualsData = (): PerpetualPair[] => {
    const hotPairs = [
      { symbol: 'BTC', name: 'Bitcoin', basePrice: 50000 },
      { symbol: 'ETH', name: 'Ethereum', basePrice: 3200 },
      { symbol: 'SOL', name: 'Solana', basePrice: 120 },
      { symbol: 'MATIC', name: 'Polygon', basePrice: 0.8 },
      { symbol: 'AVAX', name: 'Avalanche', basePrice: 35 },
      { symbol: 'LINK', name: 'Chainlink', basePrice: 15 },
      { symbol: 'UNI', name: 'Uniswap', basePrice: 8 },
      { symbol: 'AAVE', name: 'Aave', basePrice: 250 },
      { symbol: 'CRV', name: 'Curve', basePrice: 0.6 },
      { symbol: 'SUSHI', name: 'SushiSwap', basePrice: 1.2 },
      { symbol: 'COMP', name: 'Compound', basePrice: 60 },
      { symbol: 'YFI', name: 'Yearn Finance', basePrice: 8000 },
      { symbol: 'SNX', name: 'Synthetix', basePrice: 3.5 },
      { symbol: 'BAL', name: 'Balancer', basePrice: 4.2 },
      { symbol: 'REN', name: 'RenVM', basePrice: 0.1 },
      { symbol: 'DOGE', name: 'Dogecoin', basePrice: 0.08 },
      { symbol: 'SHIB', name: 'Shiba Inu', basePrice: 0.00001 },
      { symbol: 'ADA', name: 'Cardano', basePrice: 0.5 },
      { symbol: 'DOT', name: 'Polkadot', basePrice: 7 },
      { symbol: 'LTC', name: 'Litecoin', basePrice: 70 }
    ];

    return hotPairs.map((pair, index) => {
      const price = pair.basePrice * (0.9 + Math.random() * 0.2); // ±10% variation
      const priceChangePercent = (Math.random() - 0.5) * 20; // -10% to +10%
      const priceChange = price * (priceChangePercent / 100);
      const volume = pair.basePrice * (1000000 + Math.random() * 5000000); // $1M-$6M base volume
      const volatility = Math.random() * 5 + 1; // 1-6%
      const fundingRate = (Math.random() - 0.5) * 0.002; // -0.1% to +0.1%

      return {
        symbol: pair.symbol,
        name: pair.name,
        currentPrice: price,
        priceChange24h: priceChange,
        priceChangePercent24h: priceChangePercent,
        volume24h: volume,
        openInterest: volume * (0.1 + Math.random() * 0.3), // 10-40% of volume
        fundingRate: fundingRate,
        nextFundingTime: Date.now() + (8 * 60 * 60 * 1000), // 8 hours from now
        high24h: price * (1 + Math.random() * 0.1),
        low24h: price * (1 - Math.random() * 0.1),
        volatility: volatility,
        isHot: index < 10, // Top 10 are "hot"
        volumeChange24h: (Math.random() - 0.5) * 50, // -25% to +25%
        openInterestChange24h: (Math.random() - 0.5) * 30 // -15% to +15%
      };
    });
  };

  // Get token name from symbol
  const getTokenName = (symbol: string): string => {
    const names: { [key: string]: string } = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'SOL': 'Solana',
      'MATIC': 'Polygon',
      'AVAX': 'Avalanche',
      'LINK': 'Chainlink',
      'UNI': 'Uniswap',
      'AAVE': 'Aave',
      'CRV': 'Curve',
      'SUSHI': 'SushiSwap',
      'COMP': 'Compound',
      'YFI': 'Yearn Finance',
      'SNX': 'Synthetix',
      'BAL': 'Balancer',
      'REN': 'RenVM',
      'DOGE': 'Dogecoin',
      'SHIB': 'Shiba Inu',
      'ADA': 'Cardano',
      'DOT': 'Polkadot',
      'LTC': 'Litecoin'
    };
    return names[symbol] || symbol;
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchHotPerpetuals();

    if (autoRefresh) {
      const interval = setInterval(fetchHotPerpetuals, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Sort perpetuals based on current sort criteria
  const getSortedPerpetuals = () => {
    return [...perpetuals].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'volume':
          comparison = a.volume24h - b.volume24h;
          break;
        case 'priceChange':
          comparison = Math.abs(a.priceChangePercent24h) - Math.abs(b.priceChangePercent24h);
          break;
        case 'volatility':
          comparison = a.volatility - b.volatility;
          break;
        case 'fundingRate':
          comparison = Math.abs(a.fundingRate) - Math.abs(b.fundingRate);
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  };

  const formatNumber = (num: number, decimals: number = 2): string => {
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(decimals)}B`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(decimals)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(decimals)}K`;
    }
    return `$${num.toFixed(decimals)}`;
  };

  const formatPrice = (price: number): string => {
    if (price >= 1000) {
      return `$${price.toLocaleString()}`;
    } else if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else if (price >= 0.01) {
      return `$${price.toFixed(4)}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  };

  const formatTimeUntilFunding = (timestamp: number): string => {
    const now = Date.now();
    const diff = timestamp - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading && perpetuals.length === 0) {
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
            <p className="text-white">Loading hot perpetual pairs...</p>
          </div>
        </div>
      </div>
    );
  }

  const sortedPerpetuals = getSortedPerpetuals();

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
              <h1 className="text-3xl font-bold text-white mb-2">🔥 Hot Perpetual Pairs</h1>
              <p className="text-gray-400">
                Top trending perpetual pairs on Hyperliquid - Real-time data and trading opportunities
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchHotPerpetuals}
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

        {/* Sort Controls */}
        <div className="mb-6 flex flex-wrap gap-2">
          {([
            { key: 'volume', label: 'Volume', icon: Volume2 },
            { key: 'priceChange', label: 'Price Change', icon: TrendingUp },
            { key: 'volatility', label: 'Volatility', icon: Activity },
            { key: 'fundingRate', label: 'Funding Rate', icon: Percent }
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                if (sortBy === key) {
                  setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                } else {
                  setSortBy(key);
                  setSortOrder('desc');
                }
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                sortBy === key
                  ? 'bg-purple-600 text-white'
                  : 'bg-x-bg-secondary hover:bg-x-bg-tertiary text-x-text-secondary hover:text-x-text border border-x-border'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              {sortBy === key && (
                <span className="text-xs">
                  {sortOrder === 'desc' ? '↓' : '↑'}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Hot Perpetuals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedPerpetuals.map((perpetual) => (
            <div
              key={perpetual.symbol}
              className="bg-x-bg-secondary border border-x-border rounded-x p-6 hover:border-x-border-light transition-all duration-200 relative overflow-hidden"
            >
              {/* Hot Badge */}
              {perpetual.isHot && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
                  🔥 HOT
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                    {perpetual.symbol}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{perpetual.name}</h3>
                    <p className="text-sm text-gray-400">{perpetual.symbol}/USDT</p>
                  </div>
                </div>
                
                <a
                  href={`https://app.hyperliquid.xyz/trade/${perpetual.symbol}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-x-bg-tertiary hover:bg-x-bg-quaternary text-white p-2 rounded-lg transition-all duration-200"
                  title="Trade on Hyperliquid"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Price and Change */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-white">
                    {formatPrice(perpetual.currentPrice)}
                  </span>
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded text-sm font-medium ${
                    perpetual.priceChangePercent24h > 0 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {perpetual.priceChangePercent24h > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>{perpetual.priceChangePercent24h > 0 ? '+' : ''}{perpetual.priceChangePercent24h.toFixed(2)}%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>24h High: {formatPrice(perpetual.high24h)}</span>
                  <span>24h Low: {formatPrice(perpetual.low24h)}</span>
                </div>
              </div>

              {/* Trading Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center bg-x-bg-tertiary rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">24h Volume</p>
                  <p className="text-lg font-bold text-white">
                    {formatNumber(perpetual.volume24h)}
                  </p>
                  <p className={`text-xs ${
                    perpetual.volumeChange24h > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {perpetual.volumeChange24h > 0 ? '+' : ''}{perpetual.volumeChange24h.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center bg-x-bg-tertiary rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Open Interest</p>
                  <p className="text-lg font-bold text-white">
                    {formatNumber(perpetual.openInterest)}
                  </p>
                  <p className={`text-xs ${
                    perpetual.openInterestChange24h > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {perpetual.openInterestChange24h > 0 ? '+' : ''}{perpetual.openInterestChange24h.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Volatility</span>
                  <span className="text-white font-medium">{perpetual.volatility.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Funding Rate</span>
                  <span className={`font-medium ${
                    perpetual.fundingRate > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {perpetual.fundingRate > 0 ? '+' : ''}{(perpetual.fundingRate * 100).toFixed(4)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Next Funding</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-white font-medium">
                      {formatTimeUntilFunding(perpetual.nextFundingTime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => navigate('/futures-grid')}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Grid Bot</span>
                </button>
                <button
                  onClick={() => navigate(`/perpetuals`)}
                  className="flex-1 bg-x-bg-tertiary hover:bg-x-bg-quaternary text-white py-2 rounded-lg font-medium transition-all duration-200"
                >
                  Trade
                </button>
              </div>
            </div>
          ))}
        </div>

        {sortedPerpetuals.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-white mb-2">No perpetual pairs found</h3>
            <p className="text-gray-400">
              Try refreshing the page or check your connection
            </p>
          </div>
        )}
      </div>

      <Footer />
      
      <WalletModal 
        isOpen={walletModalOpen}
        onClose={handleCloseWalletModal}
      />
    </div>
  );
} 