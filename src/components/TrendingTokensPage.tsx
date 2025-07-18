import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ExternalLink, Loader2, Search, Filter, Flame, AlertTriangle, CheckCircle, ShoppingCart } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import WalletModal from './WalletModal';
import { TrendingToken } from '../services/solanaTrackerApi';
import { useCart } from './CartProvider';

type SortBy = 'marketCap' | 'price' | 'change24h' | 'volume24h' | 'liquidity' | 'riskScore';

export default function TrendingTokensPage() {
  const navigate = useNavigate();
  const [trendingTokens, setTrendingTokens] = useState<TrendingToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('marketCap');
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [limit] = useState(30); // Limit to control API costs
  const { addToCart } = useCart();

  const handleConnectWallet = () => {
    setWalletModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleCloseWalletModal = () => {
    setWalletModalOpen(false);
  };

  useEffect(() => {
    const fetchTrendingTokens = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiKey = import.meta.env.VITE_SOLANA_TRACKER_API_KEY;
        
        if (!apiKey || apiKey === 'your_solana_tracker_api_key_here') {
          throw new Error('Solana Tracker API key is required');
        }

        const response = await fetch(`https://data.solanatracker.io/tokens/trending?limit=${limit}`, {
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
            throw new Error('API endpoint not found. The /tokens/trending endpoint may not be available.');
          } else {
            throw new Error(`API error: ${response.status}`);
          }
        }

        const data = await response.json();
        
        // Transform the API response to match our interface
        const transformedTokens: TrendingToken[] = data.slice(0, limit).map((tokenData: any) => {
          const token = tokenData.token || {};
          const pool = tokenData.pools && tokenData.pools.length > 0 ? tokenData.pools[0] : {};
          const events = tokenData.events || {};
          
          return {
            name: token.name || 'Unknown Token',
            symbol: token.symbol || 'UNKNOWN',
            image: token.image || '/unknown-logo.png',
            marketCap: pool.marketCap?.usd || 0,
            price: pool.price?.usd || 0,
            change24h: events['24h']?.priceChangePercentage || 0,
            liquidity: pool.liquidity?.usd || 0,
            volume24h: pool.txns?.volume24h || 0,
            mint: token.mint || '',
            riskScore: tokenData.risk?.score || 0,
            riskData: tokenData.risk ? {
              score: tokenData.risk.score || 0,
              rugged: tokenData.risk.rugged || false,
              jupiterVerified: tokenData.risk.jupiterVerified || false,
              snipers: {
                count: tokenData.risk.snipers?.count || 0,
                totalBalance: tokenData.risk.snipers?.totalBalance || 0,
                totalPercentage: tokenData.risk.snipers?.totalPercentage || 0
              },
              insiders: {
                count: tokenData.risk.insiders?.count || 0,
                totalBalance: tokenData.risk.insiders?.totalBalance || 0,
                totalPercentage: tokenData.risk.insiders?.totalPercentage || 0
              },
              top10: tokenData.risk.top10 || 0,
              risks: tokenData.risk.risks || []
            } : undefined,
            txns: pool.txns?.total
          };
        });
        
        setTrendingTokens(transformedTokens);
      } catch (err) {
        console.error('Error fetching trending tokens:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch trending tokens');
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingTokens();
  }, [limit]);

  const handleAddToCart = (token: TrendingToken) => {
    addToCart({
      token: {
        symbol: token.symbol,
        name: token.name,
        price: token.price,
        mint: token.mint,
        logo: token.image
      }
    });
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

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else if (price >= 0.01) {
      return `$${price.toFixed(4)}`;
    } else if (price >= 0.0001) {
      return `$${price.toFixed(6)}`;
    } else {
      return `$${price.toExponential(2)}`;
    }
  };

  const getSortedAndFilteredTokens = () => {
    let filtered = trendingTokens;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(token => 
        token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by selected criteria
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'marketCap':
          return b.marketCap - a.marketCap;
        case 'price':
          return b.price - a.price;
        case 'change24h':
          return b.change24h - a.change24h;
        case 'volume24h':
          return b.volume24h - a.volume24h;
        case 'liquidity':
          return b.liquidity - a.liquidity;
        case 'riskScore':
          return (a.riskScore || 0) - (b.riskScore || 0); // Lower risk score is better
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getRiskColor = (riskScore: number | undefined) => {
    if (!riskScore) return 'text-gray-400';
    if (riskScore <= 30) return 'text-green-400';
    if (riskScore <= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskLabel = (riskScore: number | undefined) => {
    if (!riskScore) return 'Unknown';
    if (riskScore <= 30) return 'Low';
    if (riskScore <= 60) return 'Medium';
    return 'High';
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
            <p className="text-x-text-secondary">Loading trending tokens...</p>
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
              <p className="text-red-400 mb-2">Failed to load trending tokens</p>
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

  const sortedTokens = getSortedAndFilteredTokens();

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
            <Flame className="w-8 h-8 text-x-purple" />
            <h1 className="text-3xl font-bold text-x-text">Trending Tokens</h1>
          </div>
          <p className="text-x-text-secondary">
            Discover the hottest tokens on Solana with real-time market data and risk analysis. Showing top {limit} trending tokens.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-x-text-secondary w-4 h-4" />
            <input
              type="text"
              placeholder="Search tokens..."
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
              <option value="marketCap">Market Cap</option>
              <option value="price">Price</option>
              <option value="change24h">24h Change</option>
              <option value="volume24h">24h Volume</option>
              <option value="liquidity">Liquidity</option>
              <option value="riskScore">Risk Score</option>
            </select>
          </div>
        </div>

        {/* Tokens Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTokens.map((token, index) => (
            <div
              key={token.mint}
              className="bg-x-bg-secondary border border-x-border rounded-lg p-6 hover:border-x-border-light transition-all duration-200 hover:shadow-lg"
            >
              {/* Token Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-x-bg-tertiary rounded-full flex items-center justify-center">
                    <img 
                      src={token.image} 
                      alt={token.symbol}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = '/unknown-logo.png';
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-x-text font-medium">{token.symbol}</p>
                    <p className="text-x-text-secondary text-xs">{token.name}</p>
                  </div>
                </div>
                                 <div className="flex items-center gap-2">
                   {token.riskData?.jupiterVerified && (
                     <CheckCircle className="w-4 h-4 text-green-400" />
                   )}
                   {token.riskData?.rugged && (
                     <AlertTriangle className="w-4 h-4 text-red-400" />
                   )}
                 </div>
              </div>

              {/* Price and Change */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-x-text-secondary text-sm">Price</span>
                  <span className="font-bold text-x-text">{formatPrice(token.price)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-x-text-secondary text-sm">24h Change</span>
                  <span className={`font-bold flex items-center gap-1 ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <TrendingUp className={`w-4 h-4 ${token.change24h < 0 ? 'rotate-180' : ''}`} />
                    {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-x-text-secondary text-xs">Market Cap</span>
                  <span className="text-x-text text-sm font-medium">{formatCurrency(token.marketCap)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-x-text-secondary text-xs">24h Volume</span>
                  <span className="text-x-text text-sm font-medium">{formatCurrency(token.volume24h)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-x-text-secondary text-xs">Liquidity</span>
                  <span className="text-x-text text-sm font-medium">{formatCurrency(token.liquidity)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-x-text-secondary text-xs">Risk Score</span>
                  <span className={`text-sm font-medium ${getRiskColor(token.riskScore)}`}>
                    {getRiskLabel(token.riskScore)} ({token.riskScore})
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddToCart(token)}
                  className="flex-1 bg-x-purple hover:bg-x-purple-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>
                <button
                  onClick={() => window.open(`https://solscan.io/token/${token.mint}`, '_blank')}
                  className="bg-x-bg-tertiary hover:bg-x-bg-quaternary text-x-text px-3 py-2 rounded-lg text-sm transition-colors"
                  title="View on Solscan"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>

              {/* Risk Warnings */}
              {token.riskData && token.riskData.risks.length > 0 && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-xs font-medium mb-2">Risk Warnings:</p>
                  <ul className="text-red-300 text-xs space-y-1">
                    {token.riskData.risks.slice(0, 3).map((risk, idx) => (
                      <li key={idx}>• {risk}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* No Results */}
        {sortedTokens.length === 0 && (
          <div className="text-center py-12">
            <p className="text-x-text-secondary">No tokens found matching your search.</p>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 text-center">
          <p className="text-x-text-secondary text-sm">
            Data is limited to top {limit} trending tokens to control API costs. 
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