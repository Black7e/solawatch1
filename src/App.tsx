import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect, Suspense } from 'react';
import { WalletContextProvider } from './components/WalletProvider';
import { SafariFallback } from './components/SafariFallback';
import Header from './components/Header';
import Leaderboard from './components/Leaderboard';
import Footer from './components/Footer';
import WalletModal from './components/WalletModal';
import PortfolioAnalysis from './components/PortfolioAnalysis';
import TopTradersPage from './components/TopTradersPage';
import { CartProvider } from './components/CartProvider';
import TrendingTokens from './components/TrendingTokens';
// Perpetuals imports temporarily disabled
// import HyperliquidPerpetualsPage from './components/HyperliquidPerpetualsPage';
import CopyTradingPage from './components/CopyTradingPage';
import HyperliquidLeaderboardPage from './components/HyperliquidLeaderboardPage';
import FuturesGridBot from './components/FuturesGridBot';
// import HotPerpetualsPage from './components/HotPerpetualsPage';
import HotWalletsPage from './components/HotWalletsPage';
import TrendingTokensPageComponent from './components/TrendingTokensPage';
import BonkPage from './components/BonkPage';
// import HyperliquidDashboardPage from './components/HyperliquidDashboardPage';

// Loading component for Suspense fallback
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-white">Loading...</p>
      </div>
    </div>
  );
}

function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleConnectWallet = () => {
    setWalletModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleCloseWalletModal = () => {
    setWalletModalOpen(false);
  };

  const handleLetsBonk = () => {
    navigate('/bonk');
  };

  return (
    <>
      <Header 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen}
        onConnectWallet={handleConnectWallet}
      />
      <Leaderboard />
      <TrendingTokens onConnectWallet={handleConnectWallet} />
      
      {/* Hyperliquid Perpetuals CTA Section - TEMPORARILY DISABLED */}
      {/* 
      <section className="py-20 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-blue-900/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-8">
              <span className="text-4xl mb-4 block">⚡</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
                Trade Perpetuals Like a Pro
              </h2>
              <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-8">
                Access real-time Hyperliquid perpetual futures data with professional-grade analytics. 
                Track 200+ markets with up to 40x leverage, live prices, and funding rates.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="text-2xl font-bold text-blue-400 mb-2">200+</div>
                <div className="text-gray-300">Markets</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="text-2xl font-bold text-green-400 mb-2">40x</div>
                <div className="text-gray-300">Max Leverage</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="text-2xl font-bold text-purple-400 mb-2">Real-time</div>
                <div className="text-gray-300">Data</div>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/perps')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl mx-auto"
            >
              <span className="text-xl">⚡</span>
              Launch Perpetuals Dashboard
            </button>
          </div>
        </div>
      </section>
      */}
      
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
                    <div className="hidden bg-gradient-to-br from-orange-400 to-orange-600 p-8 flex items-center justify-center">
                      <span className="text-white text-2xl">🐕</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="order-1 lg:order-2 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Ready to <span className="text-orange-400">BONK</span> the Market? 🚀
              </h2>
              <p className="text-lg sm:text-xl text-gray-300 mb-8 leading-relaxed">
                Join the BONK revolution! Our AI-powered analysis helps you identify the best entry points and track the most successful BONK traders on Solana.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={handleLetsBonk}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Let's BONK! 🐕
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
      
      <WalletModal 
        isOpen={walletModalOpen}
        onClose={handleCloseWalletModal}
      />
    </>
  );
}

function App() {
  // Prevent any form submissions from causing page refresh
  useEffect(() => {
    // Add error boundary for mobile debugging
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      // Don't prevent default to allow error reporting
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Filter out wallet-related errors to reduce console noise
      const errorMessage = event.reason?.message || event.reason?.toString() || '';
      const isWalletError = errorMessage.includes('MetaMask') || 
                           errorMessage.includes('wallet') || 
                           errorMessage.includes('extension') ||
                           errorMessage.includes('solflare');
      
      if (!isWalletError) {
        console.error('Unhandled promise rejection:', event.reason);
      } else {
        console.warn('Wallet connection attempt failed (this is normal if wallet is not installed):', errorMessage);
      }
      // Don't prevent default to allow error reporting
    };

    const handleFormSubmit = (e: Event) => {
      // Only prevent default if it's a form without an action attribute
      const form = e.target as HTMLFormElement;
      if (form.tagName === 'FORM' && (!form.action || form.action === window.location.href)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Enter key from submitting forms globally
      if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
        const form = e.target.closest('form');
        if (form && (!form.action || form.action === window.location.href)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    document.addEventListener('submit', handleFormSubmit);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      document.removeEventListener('submit', handleFormSubmit);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <CartProvider>
    <SafariFallback>
      <WalletContextProvider>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
            <div className="min-h-screen bg-x-bg font-x">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/portfolio/:walletAddress" element={<PortfolioAnalysis />} />
                <Route path="/top-traders" element={<TopTradersPage />} />
                {/* Perpetuals routes temporarily disabled
                <Route path="/perpetuals" element={<HyperliquidPerpetualsPage />} />
                <Route path="/hot-perpetuals" element={<HotPerpetualsPage />} />
                <Route path="/perps" element={<HyperliquidDashboardPage />} />
                */}
                <Route path="/copy-trading" element={<CopyTradingPage />} />
                <Route path="/leaderboard" element={<HyperliquidLeaderboardPage />} />
                <Route path="/futures-grid" element={<FuturesGridBot />} />
                <Route path="/hot-wallets" element={<HotWalletsPage />} />
                <Route path="/trending-tokens" element={<TrendingTokensPageComponent />} />
                <Route path="/bonk" element={<BonkPage />} />
              </Routes>
            </div>
          </Suspense>
        </Router>
      </WalletContextProvider>
    </SafariFallback>
    </CartProvider>
  );
}

export default App;