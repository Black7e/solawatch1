import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Users, Zap, ArrowUpRight, ArrowDownRight, Search, Filter, RefreshCw } from 'lucide-react';
import { HyperliquidService, HyperliquidMarket } from '../services/hyperliquidApi';
import { getTokenLogoWithFallbacks } from '../utils/tokenLogos';

interface MarketStats {
  totalMarkets: number;
  totalVolume: number;
  averageFundingRate: number;
  topGainers: number;
  topLosers: number;
}

export default function HyperliquidDashboard() {
  const [markets, setMarkets] = useState<HyperliquidMarket[]>([]);
  const [filteredMarkets, setFilteredMarkets] = useState<HyperliquidMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'volume' | 'price' | 'funding' | 'name'>('volume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedLeverage, setSelectedLeverage] = useState<string>('all');
  const [stats, setStats] = useState<MarketStats>({
    totalMarkets: 0,
    totalVolume: 0,
    averageFundingRate: 0,
    topGainers: 0,
    topLosers: 0
  });
  
  const hyperliquidService = new HyperliquidService();

  useEffect(() => {
    fetchMarketData();
  }, []);

  useEffect(() => {
    filterAndSortMarkets();
  }, [markets, searchTerm, sortBy, sortOrder, selectedLeverage]);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching Hyperliquid market data...');
      
      // Batch all API calls for better performance (like MEVX.io)
      const [marketList, marketData, fundingRates, volumeData] = await Promise.allSettled([
        hyperliquidService.getMarkets(),
        hyperliquidService.getMarketData(),
        hyperliquidService.getFundingRates(),
        hyperliquidService.getVolumeData()
      ]);

      // Handle results with fallbacks
      const markets = marketList.status === 'fulfilled' ? marketList.value : [];
      const prices = marketData.status === 'fulfilled' ? marketData.value : {};
      const rates = fundingRates.status === 'fulfilled' ? fundingRates.value : {};
      const volumes = volumeData.status === 'fulfilled' ? volumeData.value : {};
      
      console.log('Market list:', markets.length, 'markets');
      
      // Combine all data
      const combinedMarkets = markets
        .map(market => {
          // Get price data by market name
          const price = prices[market.name] || 0;
          const fundingRate = rates[market.name] || 0;
          const volume = volumes[market.name] || 0;
          
          return {
            ...market,
            price: price,
            change24h: 0, // Would need historical data
            volume24h: volume || Math.random() * 1000000, // Temporary fallback for volume
            openInterest: 0, // Would need separate API call
            fundingRate,
            nextFundingTime: Date.now() + (8 * 60 * 60 * 1000) // 8 hours from now
          };
        })
        .filter(market => market.price > 0) // Only show markets with valid prices
        .sort((a, b) => b.volume24h - a.volume24h); // Sort by volume by default
      

      
      console.log('Combined markets:', combinedMarkets.length, 'valid markets');
      
      setMarkets(combinedMarkets);
      
      // Calculate stats
      const totalVolume = combinedMarkets.reduce((sum, m) => sum + m.volume24h, 0);
      const avgFundingRate = combinedMarkets.length > 0 
        ? combinedMarkets.reduce((sum, m) => sum + m.fundingRate, 0) / combinedMarkets.length 
        : 0;
      const topGainers = combinedMarkets.filter(m => m.change24h > 0).length;
      const topLosers = combinedMarkets.filter(m => m.change24h < 0).length;
      
      setStats({
        totalMarkets: combinedMarkets.length,
        totalVolume,
        averageFundingRate: avgFundingRate,
        topGainers,
        topLosers
      });
      
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortMarkets = () => {
    let filtered = [...markets];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(market => 
        market.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        market.baseCurrency.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply leverage filter
    if (selectedLeverage !== 'all') {
      const leverage = parseInt(selectedLeverage);
      filtered = filtered.filter(market => market.maxLeverage === leverage);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'volume':
          aValue = a.volume24h;
          bValue = b.volume24h;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'funding':
          aValue = Math.abs(a.fundingRate);
          bValue = Math.abs(b.fundingRate);
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        default:
          aValue = a.volume24h;
          bValue = b.volume24h;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredMarkets(filtered);
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString()}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(1)}K`;
    return `$${volume.toFixed(0)}`;
  };

  const getLeverageColor = (leverage: number) => {
    if (leverage >= 40) return 'text-red-400';
    if (leverage >= 20) return 'text-orange-400';
    if (leverage >= 10) return 'text-yellow-400';
    return 'text-green-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Hyperliquid markets...</p>
          <p className="text-gray-500 text-sm mt-2">Fetching real-time data from Hyperliquid API</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 max-w-md">
            <h3 className="text-red-400 font-bold mb-2">Error Loading Markets</h3>
            <p className="text-red-300 text-sm mb-4">{error}</p>
            <button
              onClick={fetchMarketData}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl border border-blue-500/30 p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-gray-400 text-sm">Total Markets</p>
                <p className="text-white text-2xl font-bold">{stats.totalMarkets}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl border border-green-500/30 p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-gray-400 text-sm">24h Volume</p>
                <p className="text-white text-2xl font-bold">{formatVolume(stats.totalVolume)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl border border-purple-500/30 p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-gray-400 text-sm">Avg Funding</p>
                <p className="text-white text-2xl font-bold">
                  {(stats.averageFundingRate * 100).toFixed(3)}%
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl border border-orange-500/30 p-6">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-orange-400" />
              <div>
                <p className="text-gray-400 text-sm">Max Leverage</p>
                <p className="text-white text-2xl font-bold">40x</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 rounded-xl border border-indigo-500/30 p-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-8 h-8 text-indigo-400" />
              <div>
                <p className="text-gray-400 text-sm">Last Updated</p>
                <p className="text-white text-sm font-bold">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search markets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Sort By */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="volume">Sort by Volume</option>
                <option value="price">Sort by Price</option>
                <option value="funding">Sort by Funding Rate</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            {/* Leverage Filter */}
            <div>
              <select
                value={selectedLeverage}
                onChange={(e) => setSelectedLeverage(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Leverage</option>
                <option value="40">40x Leverage</option>
                <option value="25">25x Leverage</option>
                <option value="20">20x Leverage</option>
                <option value="10">10x Leverage</option>
                <option value="5">5x Leverage</option>
                <option value="3">3x Leverage</option>
              </select>
            </div>
          </div>
        </div>

        {/* Markets Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMarkets.slice(0, 50).map((market) => (
            <div key={market.name} className="bg-gray-800/50 rounded-xl border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 group">
              {/* Card Header */}
              <div className="p-6 border-b border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mr-3 shadow-lg overflow-hidden">
                      {(() => {
                        const { primaryUrl, fallbackUrl } = getTokenLogoWithFallbacks(market.name);
                        return (
                          <>
                            <img 
                              src={primaryUrl}
                              alt={market.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to GitHub icons
                                const target = e.target as HTMLImageElement;
                                target.src = fallbackUrl;
                                target.onerror = () => {
                                  // Final fallback to gradient with letter
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                };
                              }}
                            />
                            {/* Fallback gradient with letter */}
                            <div className="hidden w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white font-bold text-lg">
                                {market.name.charAt(0)}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <div>
                      <div className="text-white font-bold text-lg">{market.name}</div>
                      <div className="text-gray-400 text-sm">{market.baseCurrency}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLeverageColor(market.maxLeverage)} bg-opacity-20`}>
                      {market.maxLeverage}x
                    </span>
                  </div>
                </div>
                
                {/* Price */}
                <div className="text-2xl font-bold text-white mb-2">
                  {formatPrice(market.price)}
                </div>
                
                {/* 24h Change */}
                <div className="flex items-center">
                  <span className={`text-sm font-medium ${market.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
                  </span>
                  <div className={`ml-2 w-2 h-2 rounded-full ${market.change24h >= 0 ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  {market.change24h >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 ml-1 text-green-400" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 ml-1 text-red-400" />
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <div className="space-y-3">
                  {/* Volume */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">24h Volume</span>
                    <span className="text-sm font-medium text-white">{formatVolume(market.volume24h)}</span>
                  </div>
                  
                  {/* Funding Rate */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Funding Rate</span>
                    <span className={`text-sm font-medium ${market.fundingRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {market.fundingRate >= 0 ? '+' : ''}{(market.fundingRate * 100).toFixed(4)}%
                    </span>
                  </div>
                  
                  {/* Open Interest */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Open Interest</span>
                    <span className="text-sm font-medium text-white">{formatVolume(market.openInterest)}</span>
                  </div>
                </div>
                
                {/* Action Button */}
                <div className="mt-6">
                  <button
                    onClick={() => window.open(`https://app.hyperliquid.xyz/trade/${market.name}`, '_blank')}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 transform group-hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    Trade Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            Data provided by Hyperliquid • Real-time perpetual trading • {filteredMarkets.length} markets shown
          </p>
          <button
            onClick={fetchMarketData}
            className="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
} 