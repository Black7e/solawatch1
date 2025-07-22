import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';

interface HeroProps {
  onConnectWallet: () => void;
}

export default function Hero({ onConnectWallet }: HeroProps) {
  const navigate = useNavigate();

  const scrollToSignup = () => {
    const signupSection = document.getElementById('signup');
    if (signupSection) {
      signupSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden bg-x-bg py-10 sm:py-16">
      <div className={`absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50`}></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center">
          
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-x-text mb-4 sm:mb-6 leading-tight">
            On-Chain Intelligence for{' '}
            <br className="hidden sm:block" />
            <span className="text-x-purple">
              New Investors
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-x-text-secondary mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed px-2">
            Track, analyze, and copy high-performance portfolios from smart wallets on Solana.
          </p>
          
        </div>
      </div>
    </section>
  );
}