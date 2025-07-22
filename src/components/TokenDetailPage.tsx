import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TrendingUp, ExternalLink, Loader2, ArrowLeft, Search, Filter, Zap, ArrowRight, Share2, Flame, DollarSign, BarChart3, TrendingDown, Activity } from 'lucide-react';
import { PublicKey } from '@solana/web3.js';
import Header from './Header';
import Footer from './Footer';
import WalletModal from './WalletModal';
import { SolanaTrackerService, TrendingToken } from '../services/solanaTrackerApi';
import { Connection } from '@solana/web3.js';
import { getPrimaryRpcEndpoint } from '../config/network';

interface TokenDetailData {
  name: string;
  symbol: string;
  image: string;
  marketCap: number;
  price: number;
  change24h: number;
  change7d: number;
  change30d: number;
  liquidity: number;
  volume24h: number;
  volume7d: number;
  mint: string;
  riskScore?: number;
  riskData?: {
    score: number;
    rugged: boolean;
    jupiterVerified: boolean;
    snipers: {
      count: number;
      totalBalance: number;
      totalPercentage: number;
    };
    insiders: {
      count: number;
      totalBalance: number;
      totalPercentage: number;
    };
    top10: number;
    risks: string[];
  };
  txns?: number;
  holders?: number;
  supply?: number;
}

export default function TokenDetailPage() {
  const { tokenMint } = useParams<{ tokenMint: string }>();
  const navigate = useNavigate();
  const [tokenData, setTokenData] = useState<TokenDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const handleConnectWallet = () => {
    setWalletModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleCloseWalletModal = () => {
    setWalletModalOpen(false);
  };

  useEffect(() => {
    const fetchTokenData = async () => {
      if (!tokenMint) {
        setError('Token mint address is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const apiKey = import.meta.env.VITE_SOLANA_TRACKER_API_KEY;
        
        if (!apiKey || apiKey === 'your_solana_tracker_api_key_here') {
          throw new Error('Solana Tracker API key is required');
        }

        const connection = new Connection(getPrimaryRpcEndpoint());
        const service = new SolanaTrackerService(connection, apiKey);

        // Fetch token data
        const tokenInfo = await service.getTokenData(tokenMint);
        
        if (!tokenInfo) {
          throw new Error('Token not found');
        }

        // For now, create a basic token data structure
        // In a real implementation, you'd fetch more detailed data
        const tokenDetail: TokenDetailData = {
          name: tokenMint.slice(0, 8) + '...', // Placeholder name
          symbol: 'TOKEN', // Placeholder symbol
          image: '', // Placeholder image
          marketCap: tokenInfo.marketCap,
          price: tokenInfo.price,
          change24h: tokenInfo.priceChange24h,
          change7d: 0, // Would need additional API call
          change30d: 0, // Would need additional API call
          liquidity: tokenInfo.liquidity,
          volume24h: 0, // Would need additional API call
          volume7d: 0, // Would need additional API call
          mint: tokenMint,
          riskScore: tokenInfo.riskScore,
          riskData: {
            score: tokenInfo.riskScore,
            rugged: false, // Would need additional API call
            jupiterVerified: false, // Would need additional API call
            snipers: { count: 0, totalBalance: 0, totalPercentage: 0 },
            insiders: { count: 0, totalBalance: 0, totalPercentage: 0 },
            top10: 0,
            risks: []
          },
          txns: 0,
          holders: 0,
          supply: 0
        };

        setTokenData(tokenDetail);
      } catch (err) {
        console.error('Error fetching token data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch token data');
      } finally {
        setLoading(false);
      }
    };

    fetchTokenData();
  }, [tokenMint]);

  const handleShare = () => {
    if (!tokenData) return;
    
    const shareText = `🔍 Token Analysis: $${tokenData.symbol}\n\n💰 Price: $${tokenData.price < 0.01 ? tokenData.price.toFixed(6) : tokenData.price < 1 ? tokenData.price.toFixed(4) : tokenData.price.toFixed(2)}\n📊 24h Change: ${tokenData.change24h > 0 ? '+' : ''}${tokenData.change24h.toFixed(2)}%\n💎 Market Cap: $${tokenData.marketCap > 1000000 ? (tokenData.marketCap / 1000000).toFixed(1) + 'M' : tokenData.marketCap > 1000 ? (tokenData.marketCap / 1000).toFixed(1) + 'K' : tokenData.marketCap.toFixed(0)}\n🔗 CA: ${tokenData.mint}\n\nView detailed analysis on SolaWatch! 🔥\n\n#Solana #${tokenData.symbol} #Crypto #DeFi`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
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
            <p className="text-x-text-secondary">Loading token data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tokenData) {
    return (
      <div className="min-h-screen bg-x-bg">
        <Header 
          mobileMenuOpen={mobileMenuOpen} 
          setMobileMenuOpen={setMobileMenuOpen}
          onConnectWallet={handleConnectWallet}
        />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 max-w-md">
            <p className="text-red-400 mb-2">Failed to load token data</p>
            <p className="text-gray-400 text-sm">{error}</p>
            <button
              onClick={() => navigate('/trending-tokens')}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Back to Trending Tokens
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-x-bg">
      <Header 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen}
        onConnectWallet={handleConnectWallet}
      />
      
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/trending-tokens')}
          className="flex items-center gap-2 text-x-text-secondary hover:text-x-text mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Trending Tokens
        </button>

        {/* Token Header */}
        <div className="bg-x-bg-secondary rounded-xl p-6 border border-x-border mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-x-purple/20 rounded-full flex items-center justify-center">
                <Flame className="w-8 h-8 text-x-purple" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-x-text mb-2">{tokenData.name}</h1>
                <p className="text-x-text-secondary">${tokenData.symbol}</p>
                <p className="text-xs text-x-text-secondary mt-1">CA: {tokenData.mint}</p>
              </div>
            </div>
            <button
              onClick={handleShare}
              className="bg-x-purple hover:bg-x-purple-hover text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>

          {/* Price and Change */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-x-bg rounded-lg p-4 border border-x-border">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <span className="text-x-text-secondary text-sm">Current Price</span>
              </div>
              <p className="text-2xl font-bold text-x-text">{formatPrice(tokenData.price)}</p>
            </div>
            
            <div className="bg-x-bg rounded-lg p-4 border border-x-border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <span className="text-x-text-secondary text-sm">24h Change</span>
              </div>
              <p className={`text-2xl font-bold ${tokenData.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {tokenData.change24h > 0 ? '+' : ''}{tokenData.change24h.toFixed(2)}%
              </p>
            </div>
            
            <div className="bg-x-bg rounded-lg p-4 border border-x-border">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                <span className="text-x-text-secondary text-sm">Market Cap</span>
              </div>
              <p className="text-2xl font-bold text-x-text">{formatCurrency(tokenData.marketCap)}</p>
            </div>
          </div>

          {/* Risk Score */}
          {tokenData.riskScore && (
            <div className="bg-x-bg rounded-lg p-4 border border-x-border">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-orange-400" />
                <span className="text-x-text-secondary text-sm">Risk Score</span>
              </div>
              <div className="flex items-center gap-3">
                <p className={`text-2xl font-bold ${getRiskColor(tokenData.riskScore)}`}>
                  {tokenData.riskScore}/100
                </p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  getRiskColor(tokenData.riskScore) === 'text-green-400' ? 'bg-green-900/50 text-green-400' :
                  getRiskColor(tokenData.riskScore) === 'text-yellow-400' ? 'bg-yellow-900/50 text-yellow-400' :
                  'bg-red-900/50 text-red-400'
                }`}>
                  {getRiskLabel(tokenData.riskScore)} Risk
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Additional Token Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Market Data */}
          <div className="bg-x-bg-secondary rounded-xl p-6 border border-x-border">
            <h2 className="text-xl font-bold text-x-text mb-4">Market Data</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-x-text-secondary">Liquidity</span>
                <span className="text-x-text font-medium">{formatCurrency(tokenData.liquidity)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-x-text-secondary">24h Volume</span>
                <span className="text-x-text font-medium">{formatCurrency(tokenData.volume24h)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-x-text-secondary">7d Change</span>
                <span className={`font-medium ${tokenData.change7d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {tokenData.change7d > 0 ? '+' : ''}{tokenData.change7d.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-x-text-secondary">30d Change</span>
                <span className={`font-medium ${tokenData.change30d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {tokenData.change30d > 0 ? '+' : ''}{tokenData.change30d.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Token Info */}
          <div className="bg-x-bg-secondary rounded-xl p-6 border border-x-border">
            <h2 className="text-xl font-bold text-x-text mb-4">Token Information</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-x-text-secondary">Contract Address</span>
                <span className="text-x-text font-mono text-sm">{tokenData.mint}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-x-text-secondary">Total Supply</span>
                <span className="text-x-text font-medium">
                  {tokenData.supply ? formatCurrency(tokenData.supply) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-x-text-secondary">Holders</span>
                <span className="text-x-text font-medium">
                  {tokenData.holders ? tokenData.holders.toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-x-text-secondary">Transactions</span>
                <span className="text-x-text font-medium">
                  {tokenData.txns ? tokenData.txns.toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Analysis */}
        {tokenData.riskData && (
          <div className="bg-x-bg-secondary rounded-xl p-6 border border-x-border mt-8">
            <h2 className="text-xl font-bold text-x-text mb-4">Risk Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-x-bg rounded-lg p-4 border border-x-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-x-text-secondary text-sm">Jupiter Verified</span>
                </div>
                <p className={`text-lg font-bold ${tokenData.riskData.jupiterVerified ? 'text-green-400' : 'text-red-400'}`}>
                  {tokenData.riskData.jupiterVerified ? 'Yes' : 'No'}
                </p>
              </div>
              
              <div className="bg-x-bg rounded-lg p-4 border border-x-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-x-text-secondary text-sm">Rugged</span>
                </div>
                <p className={`text-lg font-bold ${tokenData.riskData.rugged ? 'text-red-400' : 'text-green-400'}`}>
                  {tokenData.riskData.rugged ? 'Yes' : 'No'}
                </p>
              </div>
              
              <div className="bg-x-bg rounded-lg p-4 border border-x-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-x-text-secondary text-sm">Sniper Wallets</span>
                </div>
                <p className="text-lg font-bold text-x-text">{tokenData.riskData.snipers.count}</p>
              </div>
              
              <div className="bg-x-bg rounded-lg p-4 border border-x-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-x-text-secondary text-sm">Insider Wallets</span>
                </div>
                <p className="text-lg font-bold text-x-text">{tokenData.riskData.insiders.count}</p>
              </div>
            </div>
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