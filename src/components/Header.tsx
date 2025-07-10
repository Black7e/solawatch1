import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, Menu, X, ChevronDown, LogOut, ArrowLeft, ShoppingCart } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getNetworkDisplayName, isTestnet } from '../config/network';
import CartPopover from './CartPopover';
import { useCart } from './CartProvider';

interface HeaderProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onConnectWallet: () => void;
  cartCount?: number;
}

export default function Header({ mobileMenuOpen, setMobileMenuOpen, onConnectWallet, cartCount = 0 }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { connected, disconnect, publicKey } = useWallet();
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [cartPopoverOpen, setCartPopoverOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cartButtonRef = useRef<HTMLButtonElement>(null);
  const { cart, removeFromCart } = useCart();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setWalletDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const handleDisconnect = () => {
    disconnect();
    setWalletDropdownOpen(false);
  };


  const getWalletButtonText = () => {
    if (connected && publicKey) {
      return `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`;
    }
    return 'Connect Wallet';
  };

  return (
    <header className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity"
          >
            {location.pathname === '/' ? (
              <>
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-1.5 sm:p-2 rounded-lg">
                  <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl font-bold text-white">Solawatch.com</span>
                  {isTestnet() && (
                    <span className="text-xs text-yellow-400 font-medium -mt-1">
                      {getNetworkDisplayName()}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-3">
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <div className="flex flex-col">
                    <span className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors">Back to Home</span>
                    {isTestnet() && (
                      <span className="text-xs text-yellow-400 font-medium -mt-1">
                        {getNetworkDisplayName()}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </button>
          
          {location.pathname === '/' && (
            <nav className="hidden md:flex space-x-8">
            <a href="#features" className="text-sm lg:text-base text-gray-300 hover:text-white transition-colors">
              Features
            </a>
            <a href="#leaderboard" className="text-sm lg:text-base text-gray-300 hover:text-white transition-colors">
              Leaderboard
            </a>
            <a href="#signup" className="text-sm lg:text-base text-gray-300 hover:text-white transition-colors">
              Early Access
            </a>
            </nav>
          )}

          <div className="hidden md:block relative" ref={dropdownRef}>
            {/* Cart and Wallet Buttons Grouped */}
            <div className="flex items-center space-x-2">
              {/* Cart View */}
              <button
                ref={cartButtonRef}
                className="relative bg-gray-700 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-600 transition-all duration-200 flex items-center"
                title="View Cart"
                onClick={() => setCartPopoverOpen((v) => !v)}
              >
                <ShoppingCart className="w-5 h-5" />
                {(cart?.length ?? 0) > 0 && (
                  <span className="absolute -top-2 -right-2 bg-purple-500 text-xs rounded-full px-2 py-0.5">{cart?.length ?? 0}</span>
                )}
              </button>
              <CartPopover
                cart={cart}
                open={cartPopoverOpen}
                onClose={() => setCartPopoverOpen(false)}
                handleRemoveFromCart={removeFromCart}
                anchorRef={cartButtonRef}
              />
              {/* Wallet Button */}
              {connected ? (
                <>
                  <button 
                    onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 sm:px-6 sm:py-2 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 text-sm sm:text-base"
                  >
                    <span>{getWalletButtonText()}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${walletDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {walletDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                      <div className="py-1">
                        <button
                          onClick={handleDisconnect}
                          className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-red-400 transition-colors flex items-center space-x-2"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Disconnect</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <button 
                  onClick={onConnectWallet}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 px-3 py-1.5 sm:px-6 sm:py-2 rounded-lg font-semibold transition-all duration-200 text-sm sm:text-base"
                >
                  {getWalletButtonText()}
                </button>
              )}
            </div>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && location.pathname === '/' && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <a href="#features" className="block px-3 py-2 text-gray-300 hover:text-white">
              Features
            </a>
            <a href="#leaderboard" className="block px-3 py-2 text-gray-300 hover:text-white">
              Leaderboard
            </a>
            <a href="#signup" className="block px-3 py-2 text-gray-300 hover:text-white">
              Early Access
            </a>
            <button 
              onClick={connected ? handleDisconnect : onConnectWallet}
              className={`w-full mt-3 px-4 py-2 rounded-lg font-semibold ${
                connected 
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
              }`}
            >
              {connected ? 'Disconnect Wallet' : getWalletButtonText()}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}