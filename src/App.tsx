import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

  const handleConnectWallet = () => {
    setWalletModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleCloseWalletModal = () => {
    setWalletModalOpen(false);
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