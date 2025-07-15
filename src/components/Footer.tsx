import React from 'react';
import { Twitter, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 py-12">
      <div className="max-w-xl mx-auto px-4 flex flex-col items-center text-center">
        <div className="flex flex-col items-center mb-6">
          <img 
            src="/solawatch-logo.svg" 
            alt="SolaWatch" 
            className="h-12 w-auto mb-3"
          />
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
              {/* X (Twitter) icon SVG from Wikimedia */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1227" className="w-6 h-6" fill="currentColor">
                <path d="M1200 1010.4 926.7 614.2 1190.2 216.6h-273.7l-180.7 273.7-180.7-273.7H281.4l263.5 397.6L271.1 1010.4h273.7l155.4-235.5 155.4 235.5z"/>
              </svg>
            </a>
            <a
              href="https://github.com/Black7e/solawatch1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              {/* GitHub icon SVG from Wikimedia Octicons */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" className="w-6 h-6" fill="currentColor">
                <path d="M512 76C273.6 76 76 273.6 76 512c0 192.8 125 356.4 298.4 414.2 21.8 4 29.8-9.4 29.8-20.8 0-10.2-.4-44.2-.6-80.2-121.4 26.4-147-51.8-147-51.8-19.8-50.2-48.4-63.6-48.4-63.6-39.6-27 3-26.4 3-26.4 43.8 3.2 66.8 45 66.8 45 38.8 66.6 101.8 47.4 126.6 36.2 3.8-28 15.2-47.4 27.6-58.4-97-11-199-48.4-199-215.4 0-47.6 17-86.6 44.8-117.2-4.4-11-19.4-55.2 4.2-115 0 0 36.6-11.8 120 44.8 34.8-9.6 72-14.4 109.2-14.6 37.2.2 74.4 5 109.2 14.6 83.2-56.6 119.8-44.8 119.8-44.8 23.6 59.8 8.6 104 4.2 115 27.8 30.6 44.8 69.6 44.8 117.2 0 167.4-102.2 204.2-199.6 215 15.6 13.4 29.6 39.8 29.6 80.2 0 57.8-.6 104.4-.6 118.6 0 11.6 7.8 25 30 20.8C823 868.2 948 704.8 948 512c0-238.4-197.6-436-436-436z"/>
              </svg>
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