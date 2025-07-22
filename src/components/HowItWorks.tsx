import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
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
                  Discover trending tokens and what's in top traders' wallets.
                </p>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="text-center">
              <div className="bg-x-bg-secondary rounded-xl p-6 border border-x-border">
                <h3 className="text-xl font-bold text-white mb-3">One-Click Purchase</h3>
                <p className="text-gray-300">
                  Add up to 10 tokens to your cart — ape in all in one-click.
                </p>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="text-center">
              <div className="bg-x-bg-secondary rounded-xl p-6 border border-x-border">
                <h3 className="text-xl font-bold text-white mb-3">Share on X</h3>
                <p className="text-gray-300">
                  Post your favorite tokens and wallets — help the community.
                </p>
              </div>
            </div>
        </div>
      </div>
      
      {/* FAQ Section */}
      <section className="py-16 bg-x-bg-secondary">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Common questions and solutions for using SolaWatch
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-6">
            {/* FAQ Item 1 */}
            <div className="bg-x-bg rounded-xl p-6 border border-x-border">
              <h3 className="text-xl font-bold text-white mb-3">
                How do I prepare my wallet for trading?
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Before trading, ensure your wallet has sufficient SOL for the tokens you want to purchase. 
                You can buy SOL from exchanges like Coinbase, Binance, or FTX and transfer it to your Solana wallet. 
                SolaWatch charges a 1% fee on all purchases, which is automatically included in your transaction.
              </p>
            </div>

            {/* FAQ Item 2 */}
            <div className="bg-x-bg rounded-xl p-6 border border-x-border">
              <h3 className="text-xl font-bold text-white mb-3">
                How do I connect my wallet to purchase tokens?
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Click the "Connect Wallet" button in the header, then select your preferred wallet (Phantom, Solflare, or Coin98). 
                Approve the connection request in your wallet extension. Once connected, you can add tokens to your cart and make purchases.
              </p>
            </div>

            {/* FAQ Item 3 */}
            <div className="bg-x-bg rounded-xl p-6 border border-x-border">
              <h3 className="text-xl font-bold text-white mb-3">
                What is the 1% fee for?
              </h3>
              <p className="text-gray-300 leading-relaxed">
                SolaWatch charges a 1% fee on all token purchases to support platform development, maintenance, and provide you with real-time market data, 
                wallet analysis, and trading insights. This fee is automatically calculated and included in your transaction.
              </p>
            </div>

            {/* FAQ Item 4 */}
            <div className="bg-x-bg rounded-xl p-6 border border-x-border">
              <h3 className="text-xl font-bold text-white mb-3">
                Why can't I add a token to my cart?
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Common reasons include: token not having enough liquidity, the token being temporarily unavailable, or technical issues with the token. 
                Try refreshing the page. If the issue persists, the token may be experiencing technical difficulties. Note: You don't need SOL balance to add tokens to your cart - SOL is only required when purchasing.
              </p>
            </div>

            {/* FAQ Item 5 */}
            <div className="bg-x-bg rounded-xl p-6 border border-x-border">
              <h3 className="text-xl font-bold text-white mb-3">
                What should I do if a swap fails?
              </h3>
              <p className="text-gray-300 leading-relaxed">
                If a swap fails, the problematic token will remain in your cart and prevent other transactions. Remove the failed token from your cart by clicking 
                the "X" button next to it. You can then continue with other purchases. Failed swaps usually occur due to insufficient liquidity or rapid price changes.
              </p>
            </div>

            {/* FAQ Item 6 */}
            <div className="bg-x-bg rounded-xl p-6 border border-x-border">
              <h3 className="text-xl font-bold text-white mb-3">
                How many tokens can I add to my cart?
              </h3>
              <p className="text-gray-300 leading-relaxed">
                You can add up to 10 tokens to your cart at once. This limit helps ensure smooth transactions and prevents issues with complex multi-token swaps. 
                If you need to purchase more tokens, complete your current cart purchase first, then add more tokens.
              </p>
            </div>

            {/* FAQ Item 7 */}
            <div className="bg-x-bg rounded-xl p-6 border border-x-border">
              <h3 className="text-xl font-bold text-white mb-3">
                What happens if my wallet disconnects during a transaction?
              </h3>
              <p className="text-gray-300 leading-relaxed">
                If your wallet disconnects during a transaction, the transaction will fail and no tokens will be purchased. Simply reconnect your wallet and try again. 
                Your cart items will be preserved, so you won't need to re-add them.
              </p>
            </div>

            {/* FAQ Item 8 */}
            <div className="bg-x-bg rounded-xl p-6 border border-x-border">
              <h3 className="text-xl font-bold text-white mb-3">
                How do I know if a token is safe to purchase?
              </h3>
              <p className="text-gray-300 leading-relaxed">
                SolaWatch provides risk analysis for each token, including liquidity scores and market data. However, always do your own research before investing. 
                Look for tokens with good liquidity, active trading volume, and transparent project information. Never invest more than you can afford to lose.
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
};

export default HowItWorks; 