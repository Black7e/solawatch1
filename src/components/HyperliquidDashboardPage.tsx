import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import WalletModal from './WalletModal';
import HyperliquidDashboard from './HyperliquidDashboard';

export default function HyperliquidDashboardPage() {
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
      
      <main className="min-h-screen bg-gray-900">
        {/* Page Header */}
        <div className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Perpetuals
              </h1>
              <p className="text-gray-400 mt-1">
                Real-time perpetual futures trading with up to 40x leverage
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <HyperliquidDashboard />
      </main>
      
      <Footer />
      
      <WalletModal 
        isOpen={walletModalOpen}
        onClose={handleCloseWalletModal}
      />
    </>
  );
} 