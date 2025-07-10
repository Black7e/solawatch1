import React from 'react';
import { Copy, Activity, Shield, Zap } from 'lucide-react';

const features = [
  {
    icon: Copy,
    title: "Copy Portfolios in 1 Click",
    description: "Instantly replicate successful trading strategies from top-performing wallets with a single click.",
  },
  {
    icon: Activity,
    title: "Live Trading Data",
    description: "Real-time on-chain analytics and portfolio tracking directly from Solana blockchain data.",
  },
  {
    icon: Shield,
    title: "Risk Levels & ROI",
    description: "Comprehensive risk assessment and return analysis for every wallet and trading strategy.",
  },
  {
    icon: Zap,
    title: "No Signup Required",
    description: "Connect your wallet and start copying immediately. No lengthy registration or KYC process.",
  }
];

export default function Features() {
  return (
    <section id="features" className="py-12 sm:py-20 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            Everything You Need to Trade Smart
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto px-4">
            Powerful tools designed for traders who want to leverage the wisdom of successful on-chain investors.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 sm:p-6 hover:bg-gray-800/70 transition-all duration-300 group"
            >
              <div className="mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}