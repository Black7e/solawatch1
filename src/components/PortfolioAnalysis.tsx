import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ExternalLink, TrendingUp, TrendingDown, Copy, Wallet, DollarSign, Activity, Clock, ArrowUpDown, X, Check } from 'lucide-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import Header from './Header';
import Footer from './Footer';
import CopyPortfolioModal from './CopyPortfolioModal';
import WalletModal from './WalletModal';
import { SolanaTrackerService, SolanaTrackerPortfolioData, SolanaTrackerTokenHolding } from '../services/solanaTrackerApi';
import { getExplorerUrl, getSolPrice, getNetworkDisplayName, isTestnet } from '../config/network';
import { useCart } from './CartProvider';
import { JupiterSwapService, TOKEN_MINTS } from '../utils/jupiterSwap';
import unknownLogo from '../assets/unknown-logo.png';

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
  const [checkingToken, setCheckingToken] = useState<string | null>(null);
  const [marketData, setMarketData] = useState<Map<string, {
    riskScore: number;
    priceChange24h: number;
    liquidity: number;
    marketCap: number;
    price: number;
  }>>(new Map());
  const [loadingMarketData, setLoadingMarketData] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tokensShown, setTokensShown] = useState(50);
  const [safeCopyLoading, setSafeCopyLoading] = useState(false);
  const [safeCopyResult, setSafeCopyResult] = useState<null | { added: string[]; failed: { symbol: string; reason: string }[] }>(null);
  // For opening cart popover from Safe Copy modal
  const [openCartFromSafeCopy, setOpenCartFromSafeCopy] = useState(false);

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
        
        // Fetch market data for tokens
        if (portfolioData.tokens.length > 0) {
          await fetchMarketData(portfolioData.tokens);
        }
      } catch (err) {
        console.error('Error fetching portfolio:', err);
        setError(err instanceof Error ? err.message : 'Unable to load portfolio data. Please check the wallet address and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
  }, [walletAddress, connection]);

  const fetchMarketData = async (tokens: SolanaTrackerTokenHolding[]) => {
    try {
      setLoadingMarketData(true);
      
      const portfolioService = new SolanaTrackerService(connection);
      const tokenAddresses = tokens.map(token => token.mint).filter(mint => mint !== 'unknown');
      
      if (tokenAddresses.length === 0) return;
      
      const marketDataMap = await portfolioService.getMultipleTokenData(tokenAddresses);
      setMarketData(marketDataMap);
      
    } catch (error) {
      console.error('Error fetching market data:', error);
      // Don't show error to user, just log it - market data is optional
    } finally {
      setLoadingMarketData(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return '$' + Math.round(value / 1e9) + 'B';
    if (value >= 1e6) return '$' + Math.round(value / 1e6) + 'M';
    if (value >= 1e3) return '$' + Math.round(value / 1e3) + 'K';
    return '$' + value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatNumber = (value: number) => {
    if (value >= 1e9) return Math.round(value / 1e9) + 'B';
    if (value >= 1e6) return Math.round(value / 1e6) + 'M';
    if (value >= 1e3) return Math.round(value / 1e3) + 'K';
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Helper for mock SOL conversion (for demo, 1 SOL = $150)
  const mockSolPrice = 150;
  // MOCK DATA for table redesign - REMOVED, using real API data instead

  // Solana logo for inline use
  const solLogo = '/solana-logo.png';

  // Effect to open cart popover if requested from Safe Copy modal
  useEffect(() => {
    if (openCartFromSafeCopy) {
      // Try to open cart popover if Header provides a setter via context or prop
      // If not, you may need to lift state up or use a global store
      const cartButton = document.querySelector('[title="View Cart"]');
      if (cartButton) (cartButton as HTMLElement).click();
      setOpenCartFromSafeCopy(false);
    }
  }, [openCartFromSafeCopy]);

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
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-all duration-200 group"
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
            <div className="relative group">
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={safeCopyLoading}
                onClick={async () => {
                  if (cart.length >= 20) {
                    alert('The cart only supports swapping up to 20 tokens at a time.');
                    return;
                  }
                  if (!portfolioData?.tokens || marketData.size === 0) return;
                  setSafeCopyLoading(true);
                  const jupiter = new JupiterSwapService(connection);
                  const goodTokens = portfolioData.tokens.filter(token => {
                    const tokenMarketData = marketData.get(token.mint);
                    return tokenMarketData && (tokenMarketData.riskScore === 10 || tokenMarketData.riskScore === 0);
                  });
                  const added: string[] = [];
                  const failed: { symbol: string; reason: string }[] = [];
                  for (const token of goodTokens) {
                    if (cart.length + added.length >= 20) {
                      failed.push({ symbol: token.symbol, reason: 'Cart limit reached (20 tokens)' });
                      continue;
                    }
                    try {
                      // Check swappability (simulate Add button logic)
                      const buyCurrency = 'SOL';
                      const inputMint = TOKEN_MINTS[buyCurrency];
                      const outputMint = token.mint;
                      const inputDecimals = buyCurrency === 'SOL' ? 9 : 6;
                      const amountInSmallestUnit = Math.floor(0.1 * Math.pow(10, inputDecimals));
                      const quote = await jupiter.getQuote({
                        inputMint,
                        outputMint,
                        amount: amountInSmallestUnit,
                        slippageBps: 300,
                      });
                      let bestRoute: any = null;
                      if (Array.isArray(quote.data) && quote.data.length > 0) {
                        bestRoute = quote.data[0];
                      } else if (quote && (quote as any).outAmount) {
                        bestRoute = quote;
                      }
                      if (!bestRoute || !('outAmount' in bestRoute) || parseFloat(bestRoute.outAmount) === 0) {
                        failed.push({ symbol: token.symbol, reason: 'No swap route found' });
                        continue;
                      }
                      addToCart({ token });
                      added.push(token.symbol);
                    } catch (err) {
                      failed.push({ symbol: token.symbol, reason: 'Error fetching quote' });
                    }
                  }
                  setSafeCopyResult({ added, failed });
                  setSafeCopyLoading(false);
                }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onFocus={() => setShowTooltip(true)}
                onBlur={() => setShowTooltip(false)}
              >
                {safeCopyLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Safe Copy</span>
                  </>
                )}
              </button>
              {/* Tooltip */}
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 bg-gray-800 text-gray-100 text-xs rounded-lg shadow-lg px-3 py-2 z-20 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none transition-opacity duration-200">
                Add tokens with good labels to cart based on risk score.
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-gray-400 text-sm font-medium py-3">Token Info</th>
                  <th className="text-right text-gray-400 text-sm font-medium py-3">Balance</th>
                  <th className="text-right text-gray-400 text-sm font-medium py-3">Liquidity</th>
                  <th className="text-right text-gray-400 text-sm font-medium py-3">Marketcap</th>
                  <th className="text-right text-gray-400 text-sm font-medium py-3">Price</th>
                  <th className="text-right text-gray-400 text-sm font-medium py-3">Risk</th>
                </tr>
              </thead>
              <tbody>
                {portfolioData?.tokens.slice(0, tokensShown).map((token, index) => {
                  const tokenMarketData = marketData.get(token.mint);
                  const solPrice = getSolPrice();
                  
                  return (
                    <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors">
                      <td className="py-4 pl-0">
                        <div className="flex items-center space-x-3 min-h-[3rem]">
                          <img
                            src={token.logo || unknownLogo}
                            alt={token.symbol}
                            className="w-8 h-8 rounded-full object-cover border border-gray-600 bg-gray-700"
                            onError={(e) => {
                              e.currentTarget.src = unknownLogo;
                            }}
                          />
                          <div className="flex flex-col justify-center">
                            <div className="text-white font-medium flex items-center">
                              {token.symbol}
                            </div>
                            <div className="text-gray-400 text-sm leading-tight">{token.name}</div>
                            <a
                              href={`https://solscan.io/token/${token.mint}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-purple-400 font-mono hover:underline"
                              title={token.mint}
                            >
                              {token.mint.slice(0, 4)}...{token.mint.slice(-4)}
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="text-right text-white py-4 align-middle">
                        {token.amount !== undefined ? formatNumber(token.amount) : '-'}<br/>
                        <span className="text-xs text-gray-400 flex items-center gap-1 justify-end w-full" style={{ display: 'flex' }}>
                          <img src={solLogo} alt="SOL" style={{ width: '14px', height: '14px', display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />
                          {token.price && solPrice ? formatNumber((token.amount * token.price) / solPrice) : '-'}
                        </span>
                      </td>
                      <td className="text-right text-white py-4 align-middle">
                        {loadingMarketData ? (
                          <div className="animate-pulse bg-gray-600 h-4 w-16 rounded mx-auto"></div>
                        ) : tokenMarketData?.liquidity ? (
                          <>
                            {formatCurrency(tokenMarketData.liquidity)}<br/>
                            <span className="text-xs text-gray-400 flex items-center gap-1 justify-end w-full" style={{ display: 'flex' }}>
                              <img src={solLogo} alt="SOL" style={{ width: '14px', height: '14px', display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />
                              {solPrice ? formatNumber(tokenMarketData.liquidity / solPrice) : '-'}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="text-right text-white py-4 align-middle">
                        {loadingMarketData ? (
                          <div className="animate-pulse bg-gray-600 h-4 w-16 rounded mx-auto"></div>
                        ) : tokenMarketData?.marketCap ? (
                          <>
                            {formatCurrency(tokenMarketData.marketCap)}<br/>
                            <span className="text-xs text-gray-400 flex items-center gap-1 justify-end w-full" style={{ display: 'flex' }}>
                              <img src={solLogo} alt="SOL" style={{ width: '14px', height: '14px', display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />
                              {solPrice ? formatNumber(tokenMarketData.marketCap / solPrice) : '-'}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="text-right text-white py-4 align-middle">
                        ${token.price?.toFixed(8) ?? '-'}<br/>
                        <span className="text-xs text-gray-400 flex items-center gap-1 justify-end w-full" style={{ display: 'flex' }}>
                          <img src={solLogo} alt="SOL" style={{ width: '14px', height: '14px', display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />
                          {token.price && solPrice ? (token.price / solPrice).toFixed(8) : '-'}
                        </span>
                      </td>
                      <td className="text-right py-4 align-middle font-bold">
                        {loadingMarketData ? (
                          <div className="animate-pulse bg-gray-600 h-4 w-12 rounded mx-auto"></div>
                        ) : tokenMarketData?.riskScore !== undefined ? (
                          (() => {
                            const score = tokenMarketData.riskScore;
                            let label = '';
                            let badgeClass = '';
                            if (score === 10 || score === 0) {
                              label = 'Good';
                              badgeClass = 'bg-green-600 text-white';
                            } else if (score >= 7) {
                              label = 'Medium';
                              badgeClass = 'bg-yellow-500 text-black';
                            } else {
                              label = 'High';
                              badgeClass = 'bg-red-600 text-white';
                            }
                            return (
                              <span className={`px-2 py-1 rounded text-xs font-bold inline-block text-center ${badgeClass}`} style={{ minWidth: 60 }}>{label}</span>
                            );
                          })()
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="text-right py-4 pr-0 align-middle">
                        <button
                          onClick={async () => {
                            setCheckingToken(token.symbol);
                            try {
                              const jupiter = new JupiterSwapService(connection);
                              // Use a small test amount (e.g., 0.1 SOL or 1 USDC)
                              const buyCurrency = 'SOL';
                              const inputMint = TOKEN_MINTS[buyCurrency];
                              const outputMint = token.mint;
                              const inputDecimals = buyCurrency === 'SOL' ? 9 : 6;
                              const amountInSmallestUnit = Math.floor(0.1 * Math.pow(10, inputDecimals));
                              const quote = await jupiter.getQuote({
                                inputMint,
                                outputMint,
                                amount: amountInSmallestUnit,
                                slippageBps: 300,
                              });
                              let bestRoute: any = null;
                              if (Array.isArray(quote.data) && quote.data.length > 0) {
                                bestRoute = quote.data[0];
                              } else if (quote && (quote as any).outAmount) {
                                bestRoute = quote;
                              }
                              if (!bestRoute || !('outAmount' in bestRoute) || parseFloat(bestRoute.outAmount) === 0) {
                                alert(`This token cannot be swapped at this time (no route found).`);
                                setCheckingToken(null);
                                return;
                              }
                              addToCart({ token });
                            } catch (err) {
                              alert(`This token cannot be swapped at this time (error fetching quote).`);
                            } finally {
                              setCheckingToken(null);
                            }
                          }}
                          disabled={checkingToken === token.symbol || cart.some(item => item.token.mint === token.mint)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 bg-purple-600 hover:bg-purple-700 text-white shadow-md ${
                            checkingToken === token.symbol || cart.some(item => item.token.mint === token.mint)
                              ? 'opacity-60 cursor-not-allowed'
                              : ''
                          }`}
                        >
                          {checkingToken === token.symbol
                            ? 'Checking...'
                            : cart.some(item => item.token.mint === token.mint)
                              ? <Check className="w-4 h-4" />
                              : 'Add'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination and View on Chain */}
          {portfolioData && portfolioData.tokens && portfolioData.tokens.length > tokensShown && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200"
                onClick={() => setTokensShown(tokensShown + 50)}
              >
                Load More
              </button>
              <a
                href={`https://solscan.io/account/${walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View on chain
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Token Swap Modal */}
      {/* This section is removed as per the edit hint */}

      {/* CopyPortfolioModal removed from Add All flow */}

      {/* Global Safe Copy Result Modal */}
      {safeCopyResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-white mb-2">Safe Copy Results</h3>
            <div className="mb-3">
              {safeCopyResult.added.length > 0 && (
                <div className="mb-2">
                  <span className="text-green-400 font-semibold">Added:</span>
                  <span className="text-white ml-2">{safeCopyResult.added.join(', ')}</span>
                </div>
              )}
              {safeCopyResult.failed.length > 0 && (
                <div>
                  <span className="text-red-400 font-semibold">Failed:</span>
                  <ul className="text-white ml-2 list-disc list-inside">
                    {safeCopyResult.failed.map(f => (
                      <li key={f.symbol}><span className="font-mono">{f.symbol}</span>: {f.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-2 justify-end">
              <button
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold"
                onClick={() => {
                  setSafeCopyResult(null);
                  setOpenCartFromSafeCopy(true);
                }}
              >
                View Cart
              </button>
              <button
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold"
                onClick={() => setSafeCopyResult(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <WalletModal 
        isOpen={walletModalOpen}
        onClose={handleCloseWalletModal}
      />

      <Footer />
    </div>
  );
}