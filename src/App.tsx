import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect, Suspense } from 'react';
import { WalletContextProvider } from './components/WalletProvider';
import { SafariFallback } from './components/SafariFallback';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Leaderboard from './components/Leaderboard';
import Footer from './components/Footer';
import WalletModal from './components/WalletModal';
import PortfolioAnalysis from './components/PortfolioAnalysis';
import TopTradersPage from './components/TopTradersPage';
import { CartProvider } from './components/CartProvider';
import TrendingTokens from './components/TrendingTokens';
import HyperliquidPerpetualsPage from './components/HyperliquidPerpetualsPage';
import CopyTradingPage from './components/CopyTradingPage';
import HyperliquidLeaderboardPage from './components/HyperliquidLeaderboardPage';
import FuturesGridBot from './components/FuturesGridBot';
import HotPerpetualsPage from './components/HotPerpetualsPage';
import HotWalletsPage from './components/HotWalletsPage';
import TrendingTokensPageComponent from './components/TrendingTokensPage';
import BonkPage from './components/BonkPage';

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
      <Hero onConnectWallet={handleConnectWallet} />
      {/* Ensure TrendingTokens is only rendered after Hero, not above Header or Hero */}
      <TrendingTokens onConnectWallet={handleConnectWallet} />
      <Leaderboard />
      <Features />
      
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
              
              <button 
                onClick={handleLetsBonk}
                className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                Let's BONK 🚀
              </button>
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
      console.error('Unhandled promise rejection:', event.reason);
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
                <Route path="/perpetuals" element={<HyperliquidPerpetualsPage />} />
                <Route path="/copy-trading" element={<CopyTradingPage />} />
                <Route path="/leaderboard" element={<HyperliquidLeaderboardPage />} />
                <Route path="/futures-grid" element={<FuturesGridBot />} />
                <Route path="/hot-perpetuals" element={<HotPerpetualsPage />} />
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