import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { TrendingUp, ShoppingCart } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { SolanaTrackerService, TrendingToken } from '../services/solanaTrackerApi';
import { Connection } from '@solana/web3.js';
import QuickBuyModal from './QuickBuyModal';
import { useCart } from './CartProvider';

// Add marquee animation CSS
const marqueeStyle = `
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.trending-marquee {
  display: flex;
  width: 200%;
  animation: marquee 32s linear infinite;
}
`;

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
  const [tokens, setTokens] = useState<TrendingToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickBuyToken, setQuickBuyToken] = useState<TrendingToken | null>(null);
  const [addingToCart, setAddingToCart] = useState<string | null>(null); // Track which token is being added
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { addToCart, cart } = useCart();
  const { connected, publicKey } = useWallet();

  useEffect(() => {
    async function fetchTrendingTokens() {
      setLoading(true);
      setError(null);
      try {
        const apiKey = import.meta.env.VITE_SOLANA_TRACKER_API_KEY;
        if (!apiKey || apiKey === 'your_solana_tracker_api_key_here') {
          throw new Error('Solana Tracker API key is required. Please add VITE_SOLANA_TRACKER_API_KEY to your .env file');
        }
        const connection = new Connection('https://api.mainnet-beta.solana.com');
        const service = new SolanaTrackerService(connection, apiKey);
        const trendingTokens = await service.getTrendingTokens(6);
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

  // Duplicate the cards for seamless scrolling
  const marqueeTokens = [...tokens, ...tokens];

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

    // Check cart limit (max 10 tokens)
    if (cart.length >= 10) {
      setToast({ 
        message: 'Cart is full! You can only add up to 10 tokens for bulk swapping', 
        type: 'error' 
      });
      return;
    }

    setAddingToCart(token.symbol);
    
    try {
      // Add to cart with automatic weight calculation
      addToCart({
        token: {
          symbol: token.symbol,
          name: token.name,
          mint: token.mint,
          logo: token.image
        }
      });
      
      setToast({ 
        message: `${token.symbol} added to cart successfully!`, 
        type: 'success' 
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      setToast({ 
        message: `Failed to add ${token.symbol} to cart. Please try again.`, 
        type: 'error' 
      });
    } finally {
      setAddingToCart(null);
    }
  };

  const handleQuickBuy = (token: TrendingToken) => {
    if (!connected || !publicKey) {
      if (onConnectWallet) {
        onConnectWallet();
      }
      return;
    }
    
    setQuickBuyToken(token);
  };

  return (
    <section className="w-full px-0 py-1">
      {/* Inject marquee animation style */}
      <style>{marqueeStyle}</style>
      <div className="flex justify-center mb-2">
        <div className="bg-gray-800 border border-purple-500/30 rounded-full px-3 py-1.5 flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <span className="text-purple-400 text-xs font-medium">Trending on Solana</span>
        </div>
      </div>
      <div className="overflow-x-hidden w-full">
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
          <div className="relative w-full pt-8" style={{ height: 350 }}>
            <div className="trending-marquee">
              {marqueeTokens.map((token, idx) => (
                <div
                  key={idx}
                  className="bg-gray-900 border border-gray-700 rounded-xl p-5 flex flex-col h-full shadow-lg min-w-[320px] relative mx-3"
                >
                  {/* Risk tags in top right */}
                  {token.riskData && (
                    <div className="absolute top-5 right-5 flex flex-wrap gap-1 justify-end z-10">
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
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={token.image}
                      alt={token.name}
                      className="w-12 h-12 rounded-full bg-gray-700 border border-gray-600 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/unknown-logo.png';
                      }}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-white font-bold text-lg leading-tight truncate">{token.name}</span>
                      <span className="text-gray-400 text-sm font-medium">
                        ${token.marketCap > 1000000 
                          ? (token.marketCap / 1000000).toFixed(1) + 'M' 
                          : token.marketCap > 1000 
                            ? (token.marketCap / 1000).toFixed(1) + 'K' 
                            : token.marketCap.toFixed(0)
                        } MC
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-end mb-4 gap-4">
                    <div className="flex-1">
                      <div className="text-gray-300 text-sm mb-1">24hr Volume</div>
                      <div className="text-green-400 text-2xl font-bold">
                        ${token.volume24h > 1000000 
                          ? (token.volume24h / 1000000).toFixed(1) + 'M' 
                          : token.volume24h > 1000 
                            ? (token.volume24h / 1000).toFixed(1) + 'K' 
                            : token.volume24h.toFixed(0)
                        }
                      </div>
                    </div>
                    <div className="flex-1 text-right">
                      <div className="text-gray-300 text-sm mb-1">24hr Change</div>
                      <div className={`text-2xl font-bold ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}> 
                        {token.change24h > 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 w-full pt-2 text-sm mb-4">
                    <div>
                      <div className="text-gray-400 text-xs mb-0.5">Price</div>
                      <div className="text-white font-semibold">
                        ${token.price < 0.01 
                          ? token.price.toFixed(6) 
                          : token.price < 1 
                            ? token.price.toFixed(4) 
                            : token.price.toFixed(2)
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs mb-0.5">Liquidity</div>
                      <div className="text-white font-semibold">
                        ${token.liquidity > 1000000 
                          ? (token.liquidity / 1000000).toFixed(1) + 'M' 
                          : token.liquidity > 1000 
                            ? (token.liquidity / 1000).toFixed(1) + 'K' 
                            : token.liquidity.toFixed(0)
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs mb-0.5">Total Txns</div>
                      <div className="text-white font-semibold">
                        {token.txns !== undefined
                          ? token.txns > 1000000
                            ? (token.txns / 1000000).toFixed(1) + 'M'
                            : token.txns > 1000
                              ? (token.txns / 1000).toFixed(1) + 'K'
                              : token.txns.toString()
                          : '--'}
                      </div>
                    </div>
                  </div>
                  {/* Quick Buy and Add to Cart buttons at bottom */}
                  <div className="flex gap-2 mt-auto">
                    <button 
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-all text-base shadow-md"
                      onClick={() => handleQuickBuy(token)}
                    >
                      Quick Buy
                    </button>
                    <button 
                      className={`w-12 h-12 rounded-lg transition-all shadow-md flex items-center justify-center ${
                        addingToCart === token.symbol 
                          ? 'bg-gray-600 cursor-not-allowed' 
                          : 'bg-gray-700 hover:bg-gray-600'
                      } text-white font-semibold`}
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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