import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, TrendingUp, Users, Zap, Shield, Mail, Twitter, MessageCircle, ExternalLink, Rocket } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import WalletModal from './WalletModal';
import { BonkApiService, BonkMarketData } from '../services/bonkApi';

export default function BonkPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  
  // Market data state
  const [marketData, setMarketData] = useState<BonkMarketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const bonkApi = new BonkApiService();

  const handleConnectWallet = () => {
    setWalletModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleCloseWalletModal = () => {
    setWalletModalOpen(false);
  };

  const handleLaunchApp = () => {
    navigate('/');
  };

  const handleLearnMore = () => {
    // Scroll to How It Works section
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };



  const fetchMarketData = async () => {
    try {
      setIsLoading(true);
      setErrors({});
      
      const marketData = await bonkApi.getBonkMarketData();
      setMarketData(marketData);
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      setErrors(prev => ({ ...prev, market: 'Failed to fetch market data' }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchMarketData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-x-bg">
      <Header 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen}
        onConnectWallet={handleConnectWallet}
      />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-orange-500/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            {/* BONK Badge */}
            <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 mb-8">
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">🐕</span>
              </div>
              <span className="text-orange-400 font-semibold text-sm">Damn, Let's BONK ❗️❗️❗️</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-x-text mb-6 leading-tight">
              Solawatch x BONK
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-purple-600">
                Track Smart Wallets
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-orange-500">
                Catch the Next Pump
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl sm:text-2xl text-x-text-secondary mb-10 max-w-3xl mx-auto leading-relaxed">
              Built for new traders entering Solana. Follow what top wallets are buying, starting with BONK.
            </p>

            {/* Token Card */}
            <div className="flex justify-center mb-8">
              <div className="relative w-64 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-3xl p-0.5 shadow-2xl">
                <div className="w-full bg-black rounded-3xl overflow-hidden">
                  {/* Main image area */}
                  <div className="w-64 h-64 bg-gray-900/50 border-b border-white/20 flex items-center justify-center p-4">
                    <img 
                      src="/soladog3.png" 
                      alt="Soladog Logo" 
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>
                  
                  {/* Bottom section */}
                  <div className="bg-black p-4 relative">
                    <div className="flex items-start justify-between mb-12">
                      <div className="flex flex-col items-start">
                        <h3 className="text-white text-xl font-bold mb-1">$•••••</h3>
                        <p className="text-gray-400 text-sm">A solawatch's memecoin</p>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <ArrowRight className="w-5 h-5 text-orange-400" />
                        <span className="text-2xl">🚀</span>
                      </div>
                    </div>
                    
                    {/* Quick Buy Button */}
                    <button className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl">
                      Quick Buy Coming Soon
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 bg-orange-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500 rounded-full blur-3xl"></div>
        </div>
      </section>



      {/* Why BONK Section */}
      <section className="py-20 bg-x-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-x-text mb-4">
              Why BONK?
            </h2>
            <p className="text-x-text-secondary text-lg max-w-2xl mx-auto">
              The perfect partnership for tracking smart money on Solana
            </p>
          </div>

          {/* Market Overview */}
          {marketData ? (
            <div className="mb-12 bg-gradient-to-r from-orange-500/10 to-purple-500/10 rounded-lg border border-orange-500/20 p-6">
              <h3 className="text-xl font-bold text-x-text mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                BONK Market Overview
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-x-text-secondary text-sm">Price</p>
                  <p className="text-x-text font-bold text-lg">${marketData.price.toFixed(8)}</p>
                </div>
                <div className="text-center">
                  <p className="text-x-text-secondary text-sm">24h Change</p>
                  <p className={`font-bold text-lg ${marketData.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {bonkApi.formatPercentage(marketData.change24h)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-x-text-secondary text-sm">24h Volume</p>
                  <p className="text-x-text font-bold text-lg">{bonkApi.formatCurrency(marketData.volume24h)}</p>
                </div>
                <div className="text-center">
                  <p className="text-x-text-secondary text-sm">Market Cap</p>
                  <p className="text-x-text font-bold text-lg">{bonkApi.formatCurrency(marketData.marketCap)}</p>
                </div>
              </div>
            </div>
          ) : errors.market && (
            <div className="mb-12 bg-red-500/10 rounded-lg border border-red-500/20 p-6">
              <h3 className="text-xl font-bold text-red-400 mb-2">Market Data Error</h3>
              <p className="text-red-300 text-sm">{errors.market}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Viral Token */}
            <div className="text-center p-8 bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-lg border border-orange-500/20">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-x-text mb-4">BONK = Solana's Most Viral Token</h3>
              <p className="text-x-text-secondary">
                The meme coin that started it all. Track the original Solana degens and their next moves.
              </p>
            </div>

            {/* Community */}
            <div className="text-center p-8 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-lg border border-purple-500/20">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-x-text mb-4">Huge Community + Fast Action</h3>
              <p className="text-x-text-secondary">
                Perfect for Solawatch. Where there's hype, there's opportunity to track smart money.
              </p>
            </div>

            {/* For Everyone */}
            <div className="text-center p-8 bg-gradient-to-br from-orange-500/10 to-purple-500/10 rounded-lg border border-orange-500/20">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-x-text mb-4">For Degens, Beginners & Curious Minds</h3>
              <p className="text-x-text-secondary">
                Whether you're a seasoned trader or just getting started, BONK's volatility creates learning opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>



      {/* Dog Inspiration Section */}
      <section className="py-20 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-orange-500/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Dog Photo */}
            <div className="order-2 lg:order-1">
              <div className="relative max-w-sm mx-auto lg:mx-0">
                <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl p-2 shadow-2xl">
                  <div className="bg-white rounded-xl overflow-hidden">
                    <img 
                      src="/solawatch-bonk.png" 
                      alt="Shiba Inu dog wearing BONK hoodie and cap, sitting at desk with laptop"
                      className="w-full h-auto object-cover"
                      onError={(e) => {
                        // Fallback to a placeholder if image doesn't exist
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    {/* Placeholder fallback */}
                    <div className="hidden w-full h-64 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-6xl mb-4 block">🐕</span>
                        <p className="text-orange-600 font-semibold">BONK Dog Photo</p>
                        <p className="text-orange-500 text-sm">Add bonk-dog.jpg to public folder</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Text Content */}
            <div className="order-1 lg:order-2 text-left space-y-6">
              <div className="mb-8">
                <span className="text-6xl mb-4 block">🐶</span>
                <h2 className="text-3xl sm:text-4xl font-bold text-x-text mb-6">
                  Inspired by my dog
                  <br />
                  <span className="text-orange-400">Powered by BONK</span>
                </h2>
              </div>
              
              <p className="text-x-text-secondary text-lg leading-relaxed">
                Every project needs a reason. Mine barks.
              </p>
              
              <p className="text-x-text-secondary text-lg leading-relaxed">
                This little guy isn't just my dog — he's my motivation, my late-night coding buddy, and the reason I believe memes can move mountains. Launching on BONK isn't just about hype — it's about bringing real energy (and maybe some dog hair) into web3.
              </p>
              
              <p className="text-x-text-secondary text-lg leading-relaxed">
                Welcome to Solawatch. Built with love, memes, and one very loud dog.
              </p>
            </div>
          </div>

        </div>
      </section>

      <Footer />
      
      <WalletModal 
        isOpen={walletModalOpen}
        onClose={handleCloseWalletModal}
      />
    </div>
  );
} 