import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, TrendingUp, Users, Zap, Target, Copy, Shield, Mail, Twitter, MessageCircle, ExternalLink } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import WalletModal from './WalletModal';

export default function BonkPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [email, setEmail] = useState('');

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

  const handleEmailSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle email signup logic here
    console.log('Email signup:', email);
    setEmail('');
  };

  // Mock data for live feed
  const mockTrendingWallets = [
    { address: '0x1234...5678', change: '+45.2%', volume: '$2.4M' },
    { address: '0x8765...4321', change: '+23.8%', volume: '$1.8M' },
    { address: '0x9876...5432', change: '+67.1%', volume: '$3.2M' },
  ];

  const mockTopSwaps = [
    { token: 'BONK', action: 'BUY', amount: '$50K', time: '2 min ago' },
    { token: 'BONK', action: 'SELL', amount: '$25K', time: '5 min ago' },
    { token: 'BONK', action: 'BUY', amount: '$75K', time: '8 min ago' },
  ];

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
              <span className="text-orange-400 font-semibold text-sm">BONK PARTNERSHIP</span>
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

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleLaunchApp}
                className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Play className="w-5 h-5" />
                Launch App
              </button>
              <button
                onClick={handleLearnMore}
                className="bg-x-bg-secondary hover:bg-x-bg-tertiary text-x-text px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center gap-2 border border-x-border hover:border-x-border-light"
              >
                Learn How It Works
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 bg-orange-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-x-bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-x-text mb-4">
              How It Works
            </h2>
            <p className="text-x-text-secondary text-lg max-w-2xl mx-auto">
              Three simple steps to start tracking smart money on Solana
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center p-8 bg-x-bg rounded-lg border border-x-border hover:border-orange-500/30 transition-all duration-200">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-2xl">1</span>
              </div>
              <h3 className="text-xl font-bold text-x-text mb-4">Enter a wallet or pick from trending wallets</h3>
              <p className="text-x-text-secondary">
                Start with any wallet address or choose from our curated list of top-performing traders
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center p-8 bg-x-bg rounded-lg border border-x-border hover:border-purple-500/30 transition-all duration-200">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-2xl">2</span>
              </div>
              <h3 className="text-xl font-bold text-x-text mb-4">See what they hold, swap, or farm</h3>
              <p className="text-x-text-secondary">
                Get real-time insights into their portfolio, recent trades, and yield farming strategies
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center p-8 bg-x-bg rounded-lg border border-x-border hover:border-orange-500/30 transition-all duration-200">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-2xl">3</span>
              </div>
              <h3 className="text-xl font-bold text-x-text mb-4">Copy smart moves, avoid dumb ones</h3>
              <p className="text-x-text-secondary">
                Follow successful strategies and learn from mistakes with our risk analysis
              </p>
            </div>
          </div>
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

      {/* Live Feed Section */}
      <section className="py-20 bg-x-bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-x-text mb-4">
              Live Feed
            </h2>
            <p className="text-x-text-secondary text-lg max-w-2xl mx-auto">
              Real-time BONK trading activity from top wallets
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Trending Wallets */}
            <div className="bg-x-bg rounded-lg border border-x-border p-6">
              <h3 className="text-xl font-bold text-x-text mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-500" />
                Trending BONK Wallets
              </h3>
              <div className="space-y-4">
                {mockTrendingWallets.map((wallet, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-x-bg-secondary rounded-lg border border-x-border">
                    <div>
                      <p className="text-x-text font-medium">{wallet.address}</p>
                      <p className="text-x-text-secondary text-sm">24h Volume: {wallet.volume}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold">{wallet.change}</p>
                      <p className="text-x-text-secondary text-sm">Today</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Swaps */}
            <div className="bg-x-bg rounded-lg border border-x-border p-6">
              <h3 className="text-xl font-bold text-x-text mb-6 flex items-center gap-2">
                <Copy className="w-5 h-5 text-purple-500" />
                Top Swaps Today
              </h3>
              <div className="space-y-4">
                {mockTopSwaps.map((swap, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-x-bg-secondary rounded-lg border border-x-border">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${swap.action === 'BUY' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div>
                        <p className="text-x-text font-medium">{swap.token} {swap.action}</p>
                        <p className="text-x-text-secondary text-sm">{swap.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-x-text font-bold">{swap.amount}</p>
                      <p className={`text-sm font-medium ${swap.action === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                        {swap.action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Funding Rate */}
          <div className="mt-8 bg-x-bg rounded-lg border border-x-border p-6">
            <h3 className="text-xl font-bold text-x-text mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-500" />
              BONK Funding Rate
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-x-bg-secondary rounded-lg">
                <p className="text-x-text-secondary text-sm">Current Rate</p>
                <p className="text-green-400 font-bold text-2xl">+0.0234%</p>
              </div>
              <div className="text-center p-4 bg-x-bg-secondary rounded-lg">
                <p className="text-x-text-secondary text-sm">24h Change</p>
                <p className="text-orange-400 font-bold text-2xl">+0.0156%</p>
              </div>
              <div className="text-center p-4 bg-x-bg-secondary rounded-lg">
                <p className="text-x-text-secondary text-sm">Next Funding</p>
                <p className="text-x-text font-bold text-2xl">2h 34m</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join the Mission Section */}
      <section className="py-20 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-orange-500/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-x-text mb-6">
            Join the Mission
          </h2>
          <p className="text-x-text-secondary text-lg mb-10 max-w-2xl mx-auto">
            Be the first to know about new features, BONK insights, and exclusive trading opportunities
          </p>

          {/* Email Signup */}
          <form onSubmit={handleEmailSignup} className="max-w-md mx-auto mb-10">
            <div className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-x-bg border border-x-border rounded-lg text-x-text placeholder-x-text-secondary focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Subscribe
              </button>
            </div>
          </form>

          {/* Social Links */}
          <div className="flex justify-center gap-6">
            <a
              href="https://twitter.com/solawatch"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-x-bg hover:bg-x-bg-secondary text-x-text px-4 py-2 rounded-lg transition-all duration-200 border border-x-border hover:border-x-border-light"
            >
              <Twitter className="w-4 h-4" />
              Twitter
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://discord.gg/solawatch"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-x-bg hover:bg-x-bg-secondary text-x-text px-4 py-2 rounded-lg transition-all duration-200 border border-x-border hover:border-x-border-light"
            >
              <MessageCircle className="w-4 h-4" />
              Discord
              <ExternalLink className="w-3 h-3" />
            </a>
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