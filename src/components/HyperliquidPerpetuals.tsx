import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Users, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { HyperliquidService, HyperliquidMarket, HyperliquidOrderBook } from '../services/hyperliquidApi';

interface PerpetualCardProps {
  market: HyperliquidMarket;
  onViewDetails: (market: HyperliquidMarket) => void;
}

const PerpetualCard: React.FC<PerpetualCardProps> = ({ market, onViewDetails }) => {
  const isPositive = market.change24h >= 0;
  
  return (
    <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-xl border border-gray-700/50 p-6 hover:border-gray-600/50 transition-all duration-200 hover:shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{market.name}</h3>
          <p className="text-gray-400 text-sm">Perpetual Futures</p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(market.change24h).toFixed(2)}%
        </div>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Price</span>
          <span className="text-white font-semibold">${market.price.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">24h Volume</span>
          <span className="text-white font-semibold">${market.volume24h.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Open Interest</span>
          <span className="text-white font-semibold">${market.openInterest.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Funding Rate</span>
          <span className={`font-semibold ${market.fundingRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {market.fundingRate >= 0 ? '+' : ''}{(market.fundingRate * 100).toFixed(4)}%
          </span>
        </div>
      </div>
      
      <button
        onClick={() => onViewDetails(market)}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
      >
        <BarChart3 className="w-4 h-4" />
        View Details
      </button>
    </div>
  );
};

interface OrderBookProps {
  orderBook: HyperliquidOrderBook;
  marketName: string;
}

const OrderBook: React.FC<OrderBookProps> = ({ orderBook, marketName }) => {
  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 p-6">
      <h3 className="text-lg font-bold text-white mb-4">{marketName} Order Book</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Asks */}
        <div>
          <h4 className="text-red-400 font-medium mb-2">Asks</h4>
          <div className="space-y-1">
            {orderBook.asks.slice(0, 10).map((ask, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-red-400">${parseFloat(ask[0].toString()).toFixed(2)}</span>
                <span className="text-gray-300">{parseFloat(ask[1].toString()).toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Bids */}
        <div>
          <h4 className="text-green-400 font-medium mb-2">Bids</h4>
          <div className="space-y-1">
            {orderBook.bids.slice(0, 10).map((bid, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-green-400">${parseFloat(bid[0].toString()).toFixed(2)}</span>
                <span className="text-gray-300">{parseFloat(bid[1].toString()).toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function HyperliquidPerpetuals() {
  const [markets, setMarkets] = useState<HyperliquidMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<HyperliquidMarket | null>(null);
  const [orderBook, setOrderBook] = useState<HyperliquidOrderBook | null>(null);
  const [activeTab, setActiveTab] = useState<'trending' | 'volume' | 'funding'>('trending');
  
  const hyperliquidService = new HyperliquidService();

  useEffect(() => {
    fetchMarkets();
  }, []);

  const fetchMarkets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get market metadata
      const marketList = await hyperliquidService.getMarkets();
      
      // Get current prices
      const marketData = await hyperliquidService.getMarketData();
      
      // Get funding rates
      const fundingRates = await hyperliquidService.getFundingRates();
      
      // Get volume data
      const volumeData = await hyperliquidService.getVolumeData();
      
      // Combine all data
      const combinedMarkets = marketList.map(market => {
        const priceData = marketData.find(m => m.name === market.name);
        const fundingRate = fundingRates[market.name] || 0;
        const volume = volumeData[market.name] || 0;
        
        return {
          ...market,
          price: priceData?.price || 0,
          change24h: 0, // Would need historical data
          volume24h: volume,
          openInterest: 0, // Would need separate API call
          fundingRate,
          nextFundingTime: Date.now() + (8 * 60 * 60 * 1000) // 8 hours from now
        };
      }).filter(market => market.price > 0); // Only show markets with valid prices
      
      setMarkets(combinedMarkets);
    } catch (err) {
      console.error('Error fetching markets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch markets');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (market: HyperliquidMarket) => {
    try {
      setSelectedMarket(market);
      const orderBookData = await hyperliquidService.getOrderBook(market.name);
      setOrderBook(orderBookData);
    } catch (err) {
      console.error('Error fetching order book:', err);
    }
  };

  const getSortedMarkets = () => {
    switch (activeTab) {
      case 'trending':
        return [...markets].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
      case 'volume':
        return [...markets].sort((a, b) => b.volume24h - a.volume24h);
      case 'funding':
        return [...markets].sort((a, b) => Math.abs(b.fundingRate) - Math.abs(a.fundingRate));
      default:
        return markets;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Hyperliquid markets...</p>
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
            <p className="text-red-300 text-sm">{error}</p>
            <button
              onClick={fetchMarkets}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-900/50 border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              Hyperliquid Perpetuals
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Trade perpetual futures with up to 40x leverage on the most popular crypto assets
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl border border-blue-500/30 p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-gray-400 text-sm">Total Markets</p>
                <p className="text-white text-2xl font-bold">{markets.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl border border-green-500/30 p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-gray-400 text-sm">24h Volume</p>
                <p className="text-white text-2xl font-bold">
                  ${markets.reduce((sum, m) => sum + m.volume24h, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl border border-purple-500/30 p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-gray-400 text-sm">Active Traders</p>
                <p className="text-white text-2xl font-bold">10K+</p>
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
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1 mb-8">
          <button
            onClick={() => setActiveTab('trending')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              activeTab === 'trending'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Trending
          </button>
          <button
            onClick={() => setActiveTab('volume')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              activeTab === 'volume'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            High Volume
          </button>
          <button
            onClick={() => setActiveTab('funding')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              activeTab === 'funding'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            High Funding
          </button>
        </div>

        {/* Markets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {getSortedMarkets().slice(0, 20).map((market) => (
            <PerpetualCard
              key={market.name}
              market={market}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      </div>

      {/* Order Book Modal */}
      {selectedMarket && orderBook && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">{selectedMarket.name} Market Details</h2>
                <button
                  onClick={() => setSelectedMarket(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OrderBook orderBook={orderBook} marketName={selectedMarket.name} />
                
                <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Market Info</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current Price</span>
                      <span className="text-white font-semibold">${selectedMarket.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">24h Volume</span>
                      <span className="text-white font-semibold">${selectedMarket.volume24h.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Funding Rate</span>
                      <span className={`font-semibold ${selectedMarket.fundingRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedMarket.fundingRate >= 0 ? '+' : ''}{(selectedMarket.fundingRate * 100).toFixed(4)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Next Funding</span>
                      <span className="text-white font-semibold">
                        {new Date(selectedMarket.nextFundingTime).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 