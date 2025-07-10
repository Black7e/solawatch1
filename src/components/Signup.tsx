import React, { useState } from 'react';
import { Mail, Wallet, ArrowRight } from 'lucide-react';

interface SignupProps {
  onConnectWallet: () => void;
}

export default function Signup({ onConnectWallet }: SignupProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!email.trim()) {
      alert('Please enter a valid email address');
      return;
    }
    setSubmitted(true);
    // Handle form submission here
  };

  return (
    <section id="signup" className="py-12 sm:py-20 bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-2xl p-6 sm:p-8 lg:p-12">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Get Early Access
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto px-2">
              Join the waitlist to be among the first to experience the next generation of on-chain trading intelligence.
            </p>
          </div>
          
          {!submitted ? (
            <form onSubmit={handleSubmit} className="max-w-sm sm:max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-9 pr-3 py-2.5 sm:px-10 sm:py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center space-x-2 whitespace-nowrap text-sm sm:text-base"
                >
                  <span>Join Waitlist</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center">
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 max-w-sm sm:max-w-md mx-auto">
                <p className="text-green-400 font-semibold">
                  Thank you! You're on the waitlist.
                </p>
                <p className="text-gray-300 text-sm mt-2">
                  We'll notify you when early access is available.
                </p>
              </div>
            </div>
          )}
          
          <div className="mt-6 sm:mt-8 text-center">
            <div className="flex items-center justify-center space-x-2 text-gray-400 mb-4">
              <div className="h-px bg-gray-600 flex-1"></div>
              <span>or</span>
              <div className="h-px bg-gray-600 flex-1"></div>
            </div>
            
            <button 
              onClick={onConnectWallet}
              className="bg-gray-800 border border-gray-600 text-white px-6 py-2.5 sm:px-8 sm:py-3 rounded-lg font-semibold hover:bg-gray-700 transition-all duration-200 flex items-center space-x-2 mx-auto text-sm sm:text-base"
            >
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Connect Wallet to Start</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}