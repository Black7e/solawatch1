import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, BarChart3, Zap, Copy, ExternalLink, Filter } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import WalletModal from './WalletModal';
import { HyperliquidService, HyperliquidPerpetual } from '../services/hyperliquidApi';

interface PerpetualWithCategory extends HyperliquidPerpetual {
  displayName: string;
  category: 'trending' | 'popular' | 'volatile';
}

export default function HyperliquidPerpetualsPage() {
  const navigate = useNavigate();
  const [perpetuals, setPerpetuals] = useState<PerpetualWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [filter, setFilter] = useState<'trending' | 'popular' | 'volatile'>('trending');
  const [searchTerm, setSearchTerm] = useState('');
  const [copyLoading, setCopyLoading] = useState<string | null>(null);

  const handleConnectWallet = () => {
    setWalletModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleCloseWalletModal = () => {
    setWalletModalOpen(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const service = new HyperliquidService();
        
        // Fetch all types of perpetuals
        const trendingPerpetuals = await service.getTrendingPerpetuals(20);
        const popularPerpetuals = await service.getPopularPerpetuals(10);
        const volatilePerpetuals = await service.getHighVolatilityPerpetuals(10);
        
        // Combine and deduplicate perpetuals
        const allPerpetuals = [...trendingPerpetuals, ...popularPerpetuals, ...volatilePerpetuals];
        const uniquePerpetuals = allPerpetuals.filter((perpetual, index, self) => 
          index === self.findIndex(p => p.name === perpetual.name)
        );
        
        // Add category information
        const perpetualsWithCategory: PerpetualWithCategory[] = uniquePerpetuals.map(perpetual => ({
          ...perpetual,
          displayName: perpetual.symbol,
          category: (trendingPerpetuals.find(p => p.name === perpetual.name) ? 'trending' :
                   popularPerpetuals.find(p => p.name === perpetual.name) ? 'popular' : 'volatile') as 'trending' | 'popular' | 'volatile'
        }));
        
        setPerpetuals(perpetualsWithCategory);

      } catch (error) {
        console.error('Error fetching Hyperliquid data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCopyTrade = async (perpetualName: string) => {
    setCopyLoading(perpetualName);
    try {
      // Simulate copy trade action
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Here you would implement the actual copy trade logic
      console.log(`Copying trade for ${perpetualName}`);
      
      // Show success message
      alert(`Successfully copied trade for ${perpetualName}`);
    } catch (error) {
      console.error('Error copying trade:', error);
      alert('Failed to copy trade. Please try again.');
    } finally {
      setCopyLoading(null);
    }
  };

  const getFilteredPerpetuals = () => {
    let filtered = perpetuals;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(perpetual =>
        perpetual.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perpetual.displayName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    switch (filter) {
      case 'trending':
        filtered = filtered.filter(perpetual => 
          perpetual.category === 'trending' || perpetual.category === 'popular'
        );
        break;
      case 'popular':
        filtered = filtered.filter(perpetual => 
          perpetual.category === 'popular' || perpetual.category === 'trending'
        );
        break;
      case 'volatile':
        filtered = filtered.filter(perpetual => 
          perpetual.category === 'volatile'
        );
        break;
    }

    return filtered;
  };

  const getFilterIcon = (filterType: string) => {
    switch (filterType) {
      case 'trending':
        return <TrendingUp className="w-4 h-4" />;
      case 'popular':
        return <BarChart3 className="w-4 h-4" />;
      case 'volatile':
        return <Zap className="w-4 h-4" />;
      default:
        return <Filter className="w-4 h-4" />;
    }
  };

  const getFilterColor = (filterType: string) => {
    switch (filterType) {
      case 'trending':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'popular':
        return 'bg-green-500 hover:bg-green-600';
      case 'volatile':
        return 'bg-orange-500 hover:bg-orange-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
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
            <p className="text-white">Loading perpetuals...</p>
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
            <h2 className="text-2xl font-bold text-white mb-2">Error Loading Perpetuals</h2>
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

  const filteredPerpetuals = getFilteredPerpetuals();

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
          
          <h1 className="text-3xl font-bold text-white mb-2">Hyperliquid Perpetuals</h1>
          <p className="text-gray-400">
            Discover trending and popular perpetual trading opportunities on Hyperliquid
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex flex-wrap gap-2">
            {(['trending', 'popular', 'volatile'] as const).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filter === filterType
                    ? getFilterColor(filterType)
                    : 'bg-x-bg-secondary hover:bg-x-bg-tertiary text-x-text-secondary hover:text-x-text border border-x-border'
                }`}
              >
                {getFilterIcon(filterType)}
                <span className="capitalize">{filterType}</span>
              </button>
            ))}
          </div>
          
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search perpetuals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-x-bg-secondary border border-x-border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Perpetuals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPerpetuals.map((perpetual) => {
            return (
              <div
                key={perpetual.name}
                className="bg-x-bg-secondary border border-x-border rounded-x p-6 hover:border-x-border-light transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {perpetual.displayName}
                    </h3>
                    <p className="text-sm text-gray-400">{perpetual.name}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    perpetual.category === 'trending' ? 'bg-blue-500/20 text-blue-400' :
                    perpetual.category === 'popular' ? 'bg-green-500/20 text-green-400' :
                    'bg-orange-500/20 text-orange-400'
                  }`}>
                    {perpetual.category}
                  </div>
                </div>

                                 <div className="space-y-3 mb-4">
                   <div className="flex justify-between items-center">
                     <span className="text-gray-400 text-sm">Price</span>
                     <span className="text-white font-medium">
                       ${perpetual.price.toFixed(2)}
                     </span>
                   </div>
                   
                   <div className="flex justify-between items-center">
                     <span className="text-gray-400 text-sm">24h Change</span>
                     <span className={`font-medium ${
                       perpetual.change24h > 0 ? 'text-green-400' : 
                       perpetual.change24h < 0 ? 'text-red-400' : 'text-gray-400'
                     }`}>
                       {perpetual.change24h > 0 ? '+' : ''}{perpetual.change24h.toFixed(2)}%
                     </span>
                   </div>
                   
                   <div className="flex justify-between items-center">
                     <span className="text-gray-400 text-sm">24h Volume</span>
                     <span className="text-white font-medium">
                       ${perpetual.volume24h.toLocaleString()}
                     </span>
                   </div>
                   
                   <div className="flex justify-between items-center">
                     <span className="text-gray-400 text-sm">Open Interest</span>
                     <span className="text-white font-medium">
                       ${perpetual.openInterest.toLocaleString()}
                     </span>
                   </div>
                   
                   <div className="flex justify-between items-center">
                     <span className="text-gray-400 text-sm">Funding Rate</span>
                     <span className={`font-medium ${
                       perpetual.fundingRate > 0 ? 'text-green-400' : 'text-red-400'
                     }`}>
                       {(perpetual.fundingRate * 100).toFixed(3)}%
                     </span>
                   </div>
                 </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleCopyTrade(perpetual.name)}
                    disabled={copyLoading === perpetual.name}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    {copyLoading === perpetual.name ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span>Copy Trade</span>
                  </button>
                  
                  <button
                    onClick={() => window.open(`https://app.hyperliquid.xyz/trade/${perpetual.name}`, '_blank')}
                    className="bg-x-bg-tertiary hover:bg-x-bg-quaternary text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center"
                    title="Open on Hyperliquid"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredPerpetuals.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No perpetuals found</h3>
            <p className="text-gray-400">
              Try adjusting your search terms or filters
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