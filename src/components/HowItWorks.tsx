import React, { useState } from 'react';
import Header from './Header';
import WalletModal from './WalletModal';

const HowItWorks: React.FC = () => {
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
    <div className="min-h-screen bg-x-bg">
      <Header 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen}
        onConnectWallet={handleConnectWallet}
      />
      
      {/* Content Section */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            How it Works
          </h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="text-center">
            <div className="bg-x-bg-secondary rounded-xl p-6 border border-x-border">
              <h3 className="text-xl font-bold text-white mb-3">Discover Tokens</h3>
              <p className="text-gray-300">
                Browse trending tokens and analyze top-performing wallets to find the best opportunities.
              </p>
            </div>
          </div>
          
          {/* Step 2 */}
          <div className="text-center">
            <div className="bg-x-bg-secondary rounded-xl p-6 border border-x-border">
              <h3 className="text-xl font-bold text-white mb-3">Add to Cart</h3>
              <p className="text-gray-300">
                Add up to 10 tokens to your cart from any trending token or wallet analysis.
              </p>
            </div>
          </div>
          
          {/* Step 3 */}
          <div className="text-center">
            <div className="bg-x-bg-secondary rounded-xl p-6 border border-x-border">
              <h3 className="text-xl font-bold text-white mb-3">One-Click Purchase</h3>
              <p className="text-gray-300">
                Purchase all your selected tokens with a single click using Jupiter's best routes.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <WalletModal 
        isOpen={walletModalOpen}
        onClose={handleCloseWalletModal}
      />
    </div>
  );
};

export default HowItWorks; 