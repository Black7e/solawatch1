import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { PublicKey } from '@solana/web3.js';

interface HeroProps {
  onConnectWallet: () => void;
}

export default function Hero({ onConnectWallet }: HeroProps) {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = React.useState('');
  const [isValidating, setIsValidating] = React.useState(false);

  const scrollToSignup = () => {
    const signupSection = document.getElementById('signup');
    if (signupSection) {
      signupSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const validateSolanaAddress = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  };

  const handleAnalyzeWallet = async () => {
    if (!walletAddress.trim()) {
      alert('Please enter a wallet address');
      return;
    }

    if (!validateSolanaAddress(walletAddress.trim())) {
      alert('Please enter a valid Solana wallet address');
      return;
    }

    setIsValidating(true);
    
    // Navigate to portfolio analysis page
    navigate(`/portfolio/${walletAddress.trim()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleAnalyzeWallet();
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleAnalyzeWallet();
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 py-20 sm:py-32">
      <div className={`absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50`}></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-xs sm:text-sm font-medium">Live on Solana</span>
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
            On-Chain Intelligence for{' '}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Real-Time Traders
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed px-2">
            Track, analyze, and copy high-performance portfolios from smart wallets on Solana.
          </p>
          
          <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="w-full max-w-sm sm:max-w-md relative px-4 sm:px-0">
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter wallet address to analyze..."
                className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-3 pr-12 sm:px-4 sm:py-4 sm:pr-14 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-lg backdrop-blur-sm"
                disabled={isValidating}
              />
              <button 
                onClick={handleAnalyzeWallet}
                disabled={isValidating}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-500 to-blue-500 text-white p-1.5 sm:p-2 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>
          
        </div>
      </div>
    </section>
  );
}