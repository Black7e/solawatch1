import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Zap, Copy, Check, ExternalLink } from 'lucide-react';
import { hyperliquidService, HyperliquidPerpetual } from '../services/hyperliquidApi';

interface HyperliquidPerpetualsProps {
  onConnectWallet?: () => void;
}

type FilterType = 'trending' | 'popular' | 'volatile';

export default function HyperliquidPerpetuals({ onConnectWallet }: HyperliquidPerpetualsProps) {
  const [perpetuals, setPerpetuals] = useState<HyperliquidPerpetual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('trending');
  const [copiedSymbol, setCopiedSymbol] = useState<string | null>(null);

  useEffect(() => {
    fetchPerpetuals();
  }, [filter]);

  const fetchPerpetuals = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let data: HyperliquidPerpetual[];
      
      switch (filter) {
        case 'trending':
          data = await hyperliquidService.getTrendingPerpetuals(12);
          break;
        case 'popular':
          data = await hyperliquidService.getPopularPerpetuals(12);
          break;
        case 'volatile':
          data = await hyperliquidService.getHighVolatilityPerpetuals(12);
          break;
        default:
          data = await hyperliquidService.getTrendingPerpetuals(12);
      }
      
      setPerpetuals(data);
    } catch (err: any) {
      console.error('Error fetching Hyperliquid perpetuals:', err);
      setError(err.message || 'Failed to fetch perpetual data');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTrade = async (perpetual: HyperliquidPerpetual) => {
    try {
      // Create a trade summary to copy
      const tradeSummary = `Hyperliquid Perpetual Trade:
Symbol: ${perpetual.symbol}
Price: $${perpetual.price.toFixed(4)}
24h Change: ${perpetual.change24h > 0 ? '+' : ''}${perpetual.change24h.toFixed(2)}%
24h Volume: $${perpetual.volume24h.toLocaleString()}
Open Interest: $${perpetual.openInterest.toLocaleString()}
Funding Rate: ${(perpetual.fundingRate * 100).toFixed(4)}%

Trade on Hyperliquid: https://app.hyperliquid.xyz`;

      await navigator.clipboard.writeText(tradeSummary);
      setCopiedSymbol(perpetual.symbol);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedSymbol(null), 2000);
    } catch (err) {
      console.error('Error copying trade:', err);
    }
  };

  const formatPrice = (price: number) => {
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

  const getFilterIcon = (filterType: FilterType) => {
    switch (filterType) {
      case 'trending':
        return <TrendingUp className="w-4 h-4" />;
      case 'popular':
        return <Users className="w-4 h-4" />;
      case 'volatile':
        return <Zap className="w-4 h-4" />;
    }
  };

  const getFilterLabel = (filterType: FilterType) => {
    switch (filterType) {
      case 'trending':
        return 'Trending';
      case 'popular':
        return 'Popular';
      case 'volatile':
        return 'High Volatility';
    }
  };

  if (loading) {
    return (
      <section className="w-full px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-x-purple mx-auto mb-4"></div>
            <p className="text-x-text-secondary">Loading Hyperliquid perpetuals...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-x-red mb-2">Error loading perpetual data</p>
            <p className="text-x-text-secondary text-sm">{error}</p>
            <button 
              onClick={fetchPerpetuals}
              className="mt-4 px-4 py-2 bg-x-purple text-white rounded-lg hover:bg-x-purple-hover transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <div className="flex items-center space-x-3 mb-4 sm:mb-0">
            <div className="bg-x-purple/10 border border-x-purple/20 rounded-lg px-3 py-1.5 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-x-purple" />
              <span className="text-x-purple text-sm font-medium">Hyperliquid Perpetuals</span>
            </div>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-x-bg-secondary border border-x-border rounded-lg p-1">
            {(['trending', 'popular', 'volatile'] as FilterType[]).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                  filter === filterType
                    ? 'bg-x-purple text-white'
                    : 'text-x-text-secondary hover:text-x-text'
                }`}
              >
                {getFilterIcon(filterType)}
                <span>{getFilterLabel(filterType)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Perpetuals Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {perpetuals.map((perpetual) => (
            <div
              key={perpetual.assetId}
              className="bg-x-bg-secondary border border-x-border rounded-lg p-4 hover:border-x-border-light transition-colors"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-x-purple/20 rounded-full flex items-center justify-center">
                    <span className="text-x-purple font-bold text-sm">
                      {perpetual.symbol.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-x-text font-semibold text-sm">{perpetual.symbol}</h3>
                    <p className="text-x-text-secondary text-xs">{perpetual.name}</p>
                  </div>
                </div>
                
                {/* Copy Button */}
                <button
                  onClick={() => handleCopyTrade(perpetual)}
                  className="p-1.5 rounded-md hover:bg-x-bg-tertiary transition-colors"
                  title="Copy trade info"
                >
                  {copiedSymbol === perpetual.symbol ? (
                    <Check className="w-4 h-4 text-x-green" />
                  ) : (
                    <Copy className="w-4 h-4 text-x-text-secondary" />
                  )}
                </button>
              </div>

              {/* Price and Change */}
              <div className="mb-3">
                <div className="text-lg font-bold text-x-text">
                  {formatPrice(perpetual.price)}
                </div>
                <div className={`text-sm font-medium ${
                  perpetual.change24h > 0 ? 'text-x-green' : 'text-x-red'
                }`}>
                  {perpetual.change24h > 0 ? '+' : ''}{perpetual.change24h.toFixed(2)}%
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-x-text-secondary">Volume 24h</span>
                  <span className="text-x-text">{formatVolume(perpetual.volume24h)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-x-text-secondary">Open Interest</span>
                  <span className="text-x-text">{formatVolume(perpetual.openInterest)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-x-text-secondary">Funding Rate</span>
                  <span className={`${
                    perpetual.fundingRate > 0 ? 'text-x-green' : 'text-x-red'
                  }`}>
                    {(perpetual.fundingRate * 100).toFixed(4)}%
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => window.open('https://app.hyperliquid.xyz', '_blank')}
                  className="flex-1 bg-x-purple text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-x-purple-hover transition-colors flex items-center justify-center space-x-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Trade</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-x-text-secondary text-sm">
            Data provided by Hyperliquid • Real-time perpetual trading
          </p>
        </div>
      </div>
    </section>
  );
} 