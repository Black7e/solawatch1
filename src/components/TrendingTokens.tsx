import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ShoppingCart, Share2, Flame } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { SolanaTrackerService, TrendingToken } from '../services/solanaTrackerApi';
import { Connection } from '@solana/web3.js';
import QuickBuyModal from './QuickBuyModal';
import { useCart } from './CartProvider';
import { getPrimaryRpcEndpoint } from '../config/network';

// Simple toast notification component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
    }`}>
      {message}
    </div>,
    document.body
  );
};

interface TrendingTokensProps {
  onConnectWallet?: () => void;
}

export default function TrendingTokens({ onConnectWallet }: TrendingTokensProps) {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<TrendingToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickBuyToken, setQuickBuyToken] = useState<TrendingToken | null>(null);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { addToCart, cart } = useCart();
  const { connected, publicKey } = useWallet();

  const handleViewAll = () => {
    navigate('/trending-tokens');
  };

  useEffect(() => {
    async function fetchTrendingTokens() {
      setLoading(true);
      setError(null);
      try {
        const apiKey = import.meta.env.VITE_SOLANA_TRACKER_API_KEY;
        if (!apiKey || apiKey === 'your_solana_tracker_api_key_here') {
          throw new Error('Solana Tracker API key is required. Please add VITE_SOLANA_TRACKER_API_KEY to your .env file');
        }
        const connection = new Connection(getPrimaryRpcEndpoint());
        const service = new SolanaTrackerService(connection, apiKey);
        const trendingTokens = await service.getTrendingTokens(12); // Show 12 tokens for 4x3 grid
        setTokens(trendingTokens);
      } catch (err: any) {
        console.error('Error fetching trending tokens:', err);
        setError(err.message || 'Error fetching trending tokens');
      } finally {
        setLoading(false);
      }
    }
    fetchTrendingTokens();
  }, []);

  const handleAddToCart = async (token: TrendingToken) => {
    if (!connected || !publicKey) {
      setToast({ 
        message: 'Please connect your wallet first to add tokens to cart', 
        type: 'error' 
      });
      return;
    }

    // Check if token is already in cart
    const isAlreadyInCart = cart.some(item => item.token.symbol === token.symbol);
    if (isAlreadyInCart) {
      setToast({ 
        message: `${token.symbol} is already in your cart`, 
        type: 'error' 
      });
      return;
    }

    // Check cart limit
    if (cart.length >= 10) {
      setToast({ 
        message: 'Cart limit reached! You can only add up to 10 tokens for bulk swapping.', 
        type: 'error' 
      });
      return;
    }

    setAddingToCart(token.symbol);
    try {
      // Add to cart with proper token structure
      addToCart({
        token: {
          symbol: token.symbol,
          name: token.name,
          mint: token.mint,
          logo: token.image
        }
      });
      setToast({ 
        message: `${token.symbol} added to cart!`, 
        type: 'success' 
      });
    } catch (err) {
      console.error('Error adding to cart:', err);
      setToast({ 
        message: 'Failed to add token to cart', 
        type: 'error' 
      });
    } finally {
      setAddingToCart(null);
    }
  };

  const handleQuickBuy = (token: TrendingToken) => {
    setQuickBuyToken(token);
  };

  const handleShare = (token: TrendingToken) => {
    const shareText = `🚀 $${token.symbol} is trending on Solana! 📈\n\n💰 Price: $${token.price < 0.01 ? token.price.toFixed(6) : token.price < 1 ? token.price.toFixed(4) : token.price.toFixed(2)}\n📊 24h Change: ${token.change24h > 0 ? '+' : ''}${token.change24h.toFixed(2)}%\n💎 Market Cap: $${token.marketCap > 1000000 ? (token.marketCap / 1000000).toFixed(1) + 'M' : token.marketCap > 1000 ? (token.marketCap / 1000).toFixed(1) + 'K' : token.marketCap.toFixed(0)}\n🔗 CA: ${token.mint}\n\nCheck it out on SolaWatch! 🔥\n\n#Solana #${token.symbol} #Crypto #DeFi`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Flame className="w-8 h-8 text-x-purple" />
              <h2 className="text-3xl font-bold text-x-text">Trending Tokens</h2>
            </div>
            <p className="text-x-text-secondary">
              Discover the hottest tokens on Solana with real-time market data and risk analysis.
            </p>
          </div>
          <button
            onClick={handleViewAll}
            className="bg-x-bg-secondary hover:bg-x-bg-tertiary text-x-text border border-x-border hover:border-x-border-light px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          >
            View All
          </button>
        </div>
      </div>
      
      {loading && (
        <div className="text-center text-gray-400 py-8">Loading trending tokens...</div>
      )}
      {error && (
        <div className="text-center text-red-500 py-8">
          <div className="text-sm">{error}</div>
          {error.includes('API key') && (
            <div className="text-xs text-gray-400 mt-2">
              Get your API key at: <a href="https://docs.solanatracker.io/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">docs.solanatracker.io</a>
            </div>
          )}
        </div>
      )}
      {!loading && !error && tokens.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tokens.map((token, idx) => (
            <div
              key={idx}
              className="bg-x-bg-secondary border border-x-border rounded-lg p-6 flex flex-col h-full shadow-lg token-card hover:border-x-border-light transition-all duration-200 hover:shadow-lg"
            >
              {/* Add token symbol class for identification */}
              <div className="token-symbol hidden">{token.symbol}</div>
              {/* Risk tags in top right */}
              {token.riskData && (
                <div className="flex flex-wrap gap-1 justify-end z-10 mb-4">
                  {token.riskData.jupiterVerified && (
                    <div className="relative group">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-400 border border-green-500/30 cursor-help">
                        ✓
                      </span>
                      <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 border border-gray-700">
                        Jupiter DEX Verified Token
                        <div className="absolute bottom-full right-2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                      </div>
                    </div>
                  )}
                  {token.riskData.rugged && (
                    <div className="relative group">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-400 border border-red-500/30 cursor-help">
                        ⚠ Rugged
                      </span>
                      <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 border border-gray-700">
                        Token has been rugged (liquidity removed)
                        <div className="absolute bottom-full right-2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                      </div>
                    </div>
                  )}
                  {token.riskData.snipers.count > 0 && (
                    <div className="relative group">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-900/50 text-orange-400 border border-orange-500/30 cursor-help">
                        🎯 {token.riskData.snipers.count}
                      </span>
                      <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 border border-gray-700">
                        {token.riskData.snipers.count} sniper wallets detected
                        <div className="absolute bottom-full right-2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                      </div>
                    </div>
                  )}
                  {token.riskData.insiders.count > 0 && (
                    <div className="relative group">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-900/50 text-purple-400 border border-purple-500/30 cursor-help">
                        👥 {token.riskData.insiders.count}
                      </span>
                      <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 border border-gray-700">
                        {token.riskData.insiders.count} insider wallets detected
                        <div className="absolute bottom-full right-2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                      </div>
                    </div>
                  )}
                  {token.riskData.top10 > 50 && (
                    <div className="relative group">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-900/50 text-yellow-400 border border-yellow-500/30 cursor-help">
                        🔝 {token.riskData.top10}%
                      </span>
                      <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 border border-gray-700">
                        {token.riskData.top10}% held by top 10 wallets
                        <div className="absolute bottom-full right-2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                      </div>
                    </div>
                  )}
                  {token.riskData.risks.length > 0 && (
                    <div className="relative group">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-400 border border-red-500/30 cursor-help">
                        ⚠ {token.riskData.risks.length}
                      </span>
                      <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 border border-gray-700 max-w-xs">
                        <div className="font-semibold mb-1">Risk Factors:</div>
                        {token.riskData.risks.map((risk, idx) => {
                          if (typeof risk === 'object' && risk !== null) {
                            const r = risk as { name?: string; description?: string };
                            return (
                              <div key={idx} className="text-gray-300">
                                • {r.name || r.description || JSON.stringify(r)}
                              </div>
                            );
                          }
                          return (
                            <div key={idx} className="text-gray-300">
                              • {String(risk)}
                            </div>
                          );
                        })}
                        <div className="absolute bottom-full right-2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={token.image}
                  alt={token.name}
                  className="w-8 h-8 rounded-full bg-gray-700 border border-gray-600 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/unknown-logo.png';
                  }}
                />
                <div className="flex flex-col min-w-0">
                  <a
                    href={`https://solscan.io/token/${token.mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white font-medium text-sm leading-tight truncate hover:text-purple-400 transition-colors cursor-pointer"
                    title={`View ${token.name} on Solscan`}
                  >
                    {token.name}
                  </a>
                  <span className="text-gray-400 text-xs">
                    ${token.marketCap > 1000000 
                      ? (token.marketCap / 1000000).toFixed(1) + 'M' 
                      : token.marketCap > 1000 
                        ? (token.marketCap / 1000).toFixed(1) + 'K' 
                        : token.marketCap.toFixed(0)
                    } MC
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">24hr Volume</span>
                  <span className="text-green-400 font-bold">
                    ${token.volume24h > 1000000 
                      ? (token.volume24h / 1000000).toFixed(1) + 'M' 
                      : token.volume24h > 1000 
                        ? (token.volume24h / 1000).toFixed(1) + 'K' 
                        : token.volume24h.toFixed(0)
                    }
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">24hr Change</span>
                  <span className={`font-bold ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}> 
                    {token.change24h > 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Price</span>
                  <span className="font-bold text-white">
                    ${token.price < 0.01 
                      ? token.price.toFixed(6) 
                      : token.price < 1 
                        ? token.price.toFixed(4) 
                        : token.price.toFixed(2)
                    }
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Liquidity</span>
                  <span className="font-bold text-white">
                    ${token.liquidity > 1000000 
                      ? (token.liquidity / 1000000).toFixed(1) + 'M' 
                      : token.liquidity > 1000 
                        ? (token.liquidity / 1000).toFixed(1) + 'K' 
                        : token.liquidity.toFixed(0)
                    }
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Total Txns</span>
                  <span className="font-bold text-white">
                    {token.txns !== undefined
                      ? token.txns > 1000000
                        ? (token.txns / 1000000).toFixed(1) + 'M'
                        : token.txns > 1000
                          ? (token.txns / 1000).toFixed(1) + 'K'
                          : token.txns.toString()
                      : '--'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-6">
                <button 
                  className="flex-1 bg-x-purple hover:bg-x-purple-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  onClick={() => handleQuickBuy(token)}
                >
                  Quick Buy
                </button>
                <button 
                  className={`w-10 h-10 rounded-lg transition-all flex items-center justify-center ${
                    addingToCart === token.symbol 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  } text-white`}
                  onClick={() => handleAddToCart(token)}
                  disabled={addingToCart === token.symbol}
                  title="Add to Cart"
                >
                  {addingToCart === token.symbol ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <ShoppingCart className="w-4 h-4" />
                  )}
                </button>
                <button 
                  className="w-10 h-10 rounded-lg transition-all flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => handleShare(token)}
                  title="Share on Twitter"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <QuickBuyModal open={!!quickBuyToken} onClose={() => setQuickBuyToken(null)} token={quickBuyToken} />
      
      {/* Toast notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </section>
  );
}