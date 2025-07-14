import React from 'react';
import { Twitter, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 py-12">
      <div className="max-w-xl mx-auto px-4 flex flex-col items-center text-center">
        <div className="flex flex-col items-center mb-6">
          {/* Logo image removed, only text remains */}
          <span className="text-2xl font-bold text-white mb-2">solawatch</span>
          <p className="text-gray-400 max-w-xl mb-4">
              On-chain intelligence for real-time traders. Track, analyze, and copy high-performance portfolios from smart wallets on Solana.
            </p>
          <div className="flex space-x-6 mt-2">
            <a 
              href="https://x.com/solawatch" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Twitter className="w-6 h-6" />
            </a>
            <a 
              href="mailto:hey@solawatch.com" 
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Mail className="w-6 h-6" />
            </a>
          </div>
        </div>
        <div className="border-t border-gray-800 w-full mt-8 pt-6">
          <p className="text-gray-400 text-sm">
            © 2025 solawatch. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}