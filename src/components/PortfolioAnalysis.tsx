import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ExternalLink, TrendingUp, TrendingDown, Copy, Wallet, DollarSign, Activity, Clock, ArrowUpDown, X } from 'lucide-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import Header from './Header';
import Footer from './Footer';
import CopyPortfolioModal from './CopyPortfolioModal';
import WalletModal from './WalletModal';
import { SolanaTrackerService, SolanaTrackerPortfolioData, SolanaTrackerTokenHolding } from '../services/solanaTrackerApi';
import { getExplorerUrl, getSolPrice, getNetworkDisplayName, isTestnet } from '../config/network';
import { useCart } from './CartProvider';

export default function PortfolioAnalysis() {
  const { walletAddress } = useParams<{ walletAddress: string }>();
  const navigate = useNavigate();
  const { connection } = useConnection();
  const [portfolioData, setPortfolioData] = useState<SolanaTrackerPortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<SolanaTrackerTokenHolding | null>(null);
  const { cart, addToCart, removeFromCart } = useCart();

  const handleConnectWallet = () => {
    setWalletModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleCloseWalletModal = () => {
    setWalletModalOpen(false);
  };

  const handleOpenCopyModal = () => {
    setCopyModalOpen(true);
  };

  const handleCloseCopyModal = () => {
    setCopyModalOpen(false);
  };

  const handleOpenTokenSwapModal = (token: SolanaTrackerTokenHolding) => {
    setSelectedToken(token);
    // setTokenSwapModalOpen(true); // This line is removed as per the edit hint
  };

  const handleCloseTokenSwapModal = () => {
    // setTokenSwapModalOpen(false); // This line is removed as per the edit hint
    setSelectedToken(null);
  };

  useEffect(() => {
    const fetchPortfolioData = async () => {
      if (!walletAddress) return;

      try {
        setLoading(true);
        setError(null);

        // Use only Solana Tracker API
        const portfolioService = new SolanaTrackerService(connection);
        const portfolioData = await portfolioService.getPortfolioData(walletAddress);

        setPortfolioData(portfolioData);
      } catch (err) {
        console.error('Error fetching portfolio:', err);
        setError(err instanceof Error ? err.message : 'Unable to load portfolio data. Please check the wallet address and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
  }, [walletAddress, connection]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
    if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
    if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K';
    return value.toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header 
          mobileMenuOpen={mobileMenuOpen} 
          setMobileMenuOpen={setMobileMenuOpen}
          onConnectWallet={handleConnectWallet}
        />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Analyzing Portfolio</h2>
            <p className="text-gray-400 mb-6">Fetching real-time on-chain data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header 
          mobileMenuOpen={mobileMenuOpen} 
          setMobileMenuOpen={setMobileMenuOpen}
          onConnectWallet={handleConnectWallet}
        />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-2">Error Loading Portfolio</h2>
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
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen}
        onConnectWallet={handleConnectWallet}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Wallet Input for Quick Analysis */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-8 sticky top-20 z-40">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <form onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.querySelector('input') as HTMLInputElement;
                const newAddress = input.value.trim();
                if (newAddress && newAddress !== walletAddress) {
                  try {
                    new PublicKey(newAddress);
                    navigate(`/portfolio/${newAddress}`);
                  } catch {
                    alert('Please enter a valid Solana wallet address');
                  }
                }
              }}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter wallet address to analyze..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 pr-14 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button 
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-500 to-blue-500 text-white p-2 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 group"
                >
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>

        {/* Wallet Header */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0 flex items-center space-x-3">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-3 rounded-lg">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
              <div className="flex items-center space-x-3">
                <span className="text-white font-mono text-lg">
                  {walletAddress}
                </span>
                <button
                  onClick={() => copyToClipboard(walletAddress || '')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <a
                  href={getExplorerUrl(walletAddress || '')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <Clock className="w-4 h-4" />
              <div className="flex flex-col">
                <span>Last activity: {portfolioData?.lastActivity}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <span className="text-gray-400 text-sm truncate">Total Value</span>
            </div>
            <div className="text-2xl font-bold text-white truncate">
              {formatCurrency(portfolioData?.totalValue || 0)}
            </div>
            <div className="text-sm text-gray-400 truncate">
              {((portfolioData?.totalValue || 0) / getSolPrice()).toFixed(4)} SOL
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-2">
              {(portfolioData?.change24hPercent || 0) >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
              <span className="text-gray-400 text-sm truncate">30d Change</span>
            </div>
            <div className={`text-2xl font-bold truncate ${(portfolioData?.change24hPercent || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(portfolioData?.change24hPercent || 0) >= 0 ? '+' : ''}{portfolioData?.change24hPercent?.toFixed(2)}%
            </div>
            <div className={`text-sm truncate ${(portfolioData?.change24hPercent || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(portfolioData?.change24h || 0) >= 0 ? '+' : ''}{formatCurrency(portfolioData?.change24h || 0)}
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-2">
              <Wallet className="w-5 h-5 text-blue-400" />
              <span className="text-gray-400 text-sm truncate">Token Holdings</span>
            </div>
            <div className="text-2xl font-bold text-white truncate">
              {portfolioData?.tokens.length || 0}
            </div>
          </div>
        </div>

        {/* Token Holdings */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Token Holdings</h2>
            <button
              onClick={() => {
                if (portfolioData?.tokens) {
                  portfolioData.tokens.forEach(token => {
                    addToCart({ token });
                  });
                }
              }}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-200 flex items-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>Add all</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-gray-400 text-sm font-medium py-3">Token</th>
                  <th className="text-right text-gray-400 text-sm font-medium py-3">Amount</th>
                  <th className="text-right text-gray-400 text-sm font-medium py-3">Price</th>
                  <th className="text-right text-gray-400 text-sm font-medium py-3">Value</th>
                  <th className="text-right text-gray-400 text-sm font-medium py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {portfolioData?.tokens.map((token, index) => (
                  <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors">
                    <td className="py-4 pl-0">
                      <a
                        href={getExplorerUrl(token.mint || 'unknown', 'token')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 hover:opacity-80 transition-opacity group"
                      >
                        <div className="flex items-center space-x-3 min-h-[3rem]">
                          <div className="relative w-8 h-8 flex-shrink-0">
                            <img
                              src={token.logo || `https://img.jup.ag/tokens/${token.mint || 'unknown'}.png`}
                              alt={token.symbol}
                              className="w-8 h-8 rounded-full object-cover border border-gray-600 bg-gray-700"
                              onError={(e) => {
                                // Fallback to gradient circle if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                            <div 
                              className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full items-center justify-center text-white text-sm font-bold absolute top-0 left-0 hidden"
                            >
                              {token.symbol.charAt(0)}
                            </div>
                          </div>
                          <div className="flex flex-col justify-center">
                            <div className="text-white font-medium group-hover:text-purple-400 transition-colors flex items-center">
                              {token.symbol}
                              {token.mint && token.mint !== 'unknown' && (
                                <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                            <div className="text-gray-400 text-sm leading-tight">{token.name}</div>
                          </div>
                        </div>
                      </a>
                    </td>
                    <td className="text-right text-white py-4 align-middle">
                      {formatNumber(token.amount)}
                    </td>
                    <td className="text-right text-white py-4 align-middle">
                      {token.priceError ? (
                        <div className="flex items-center justify-end space-x-1">
                          <span className="text-red-400 text-xs">Error</span>
                          <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : (
                        formatCurrency(token.price)
                      )}
                    </td>
                    <td className="text-right text-white py-4 font-medium align-middle">
                      {token.priceError ? (
                        <div className="flex items-center justify-end space-x-1">
                          <span className="text-red-400 text-xs">Error</span>
                          <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : (
                        formatCurrency(token.value)
                      )}
                    </td>
                    <td className="text-right py-4 pr-0 align-middle">
                      <button
                        onClick={() => addToCart({ token })}
                        disabled={cart.some(item => item.token.symbol === token.symbol) || token.priceError}
                        className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1.5 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center space-x-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                        title={cart.some(item => item.token.symbol === token.symbol) ? 'Already in cart' : token.priceError ? 'Price error - cannot add' : `Add ${token.symbol} to cart`}
                      >
                        <span>{cart.some(item => item.token.symbol === token.symbol) ? 'Added' : 'Add'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Token Swap Modal */}
      {/* This section is removed as per the edit hint */}

      {/* CopyPortfolioModal removed from Add All flow */}

      <WalletModal 
        isOpen={walletModalOpen}
        onClose={handleCloseWalletModal}
      />

      <Footer />
    </div>
  );
}