import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, Menu, X, ChevronDown, LogOut, ArrowLeft, ShoppingCart, Check } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getNetworkDisplayName, isTestnet } from '../config/network';
import CartPopover from './CartPopover';
import { useCart } from './CartProvider';
import phantomLogo from '../assets/phantom-logo.jpeg';
import solflareLogo from '../assets/solflare-logo.png';
import coin98Logo from '../assets/c98-loogo.png';

interface HeaderProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onConnectWallet: () => void;
  cartCount?: number;
  cartPopoverOpen?: boolean;
  setCartPopoverOpen?: (open: boolean) => void;
  safeCopySummary?: { cartLimit: number; notSwappable: number; added: number } | null;
  setSafeCopySummary?: (val: any) => void;
}

export default function Header({ mobileMenuOpen, setMobileMenuOpen, onConnectWallet, cartCount = 0, cartPopoverOpen: cartPopoverOpenProp, setCartPopoverOpen: setCartPopoverOpenProp, safeCopySummary, setSafeCopySummary }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { connected, disconnect, publicKey } = useWallet();
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [cartPopoverOpenLocal, setCartPopoverOpenLocal] = useState(false);
  const cartPopoverOpen = typeof cartPopoverOpenProp === 'boolean' ? cartPopoverOpenProp : cartPopoverOpenLocal;
  const setCartPopoverOpen = setCartPopoverOpenProp || setCartPopoverOpenLocal;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cartButtonRef = useRef<HTMLButtonElement>(null);
  const { cart, removeFromCart } = useCart();

  // Try to detect wallet type for logo
  const getWalletLogo = () => {
    const w = window as any;
    if (w?.phantom?.solana?.isPhantom) {
      return <img src={phantomLogo} alt="Phantom" className="w-5 h-5 mr-2 rounded" style={{ background: '#fff' }} />;
    }
    if (w?.solflare) {
      return <img src={solflareLogo} alt="Solflare" className="w-5 h-5 mr-2 rounded" style={{ background: '#fff' }} />;
    }
    if (w?.coin98?.sol) {
      return <img src={coin98Logo} alt="Coin98" className="w-5 h-5 mr-2 rounded" style={{ background: '#fff' }} />;
    }
    // Default wallet icon
    return <WalletIcon className="w-5 h-5 mr-2 text-purple-400" />;
  };
  function WalletIcon(props: any) {
    return <svg {...props} fill="none" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="5" rx="3" fill="#a78bfa"/><rect width="16" height="10" x="4" y="7" rx="2" fill="#fff"/><circle cx="18" cy="12" r="2" fill="#a78bfa"/></svg>;
  }

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
    <header className="bg-x-bg/95 backdrop-blur-sm border-b border-x-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity"
            >
            {location.pathname === '/' ? (
              <>
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <img 
                      src="/solawatch-logo.svg" 
                      alt="SolaWatch" 
                      className="h-5 sm:h-6 w-auto"
                    />
                    <span className="text-lg sm:text-xl font-bold text-x-text">solawatch</span>
                  </div>
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
                    <span className="text-sm sm:text-base text-x-text-secondary hover:text-x-text transition-colors">Back to Home</span>
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
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => navigate('/leaderboard')}
              className="text-x-text-secondary hover:text-x-text transition-colors px-3 py-2 rounded-lg hover:bg-x-bg-secondary"
            >
              Leaderboard
            </button>
          </div>
          </div>
          
          <div className="hidden md:block relative" ref={dropdownRef}>
            {/* Cart and Wallet Buttons Grouped */}
            <div className="flex items-center space-x-2">
              {/* Wallet Button */}
              {connected ? (
                <>
                  <button 
                    onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                    className="bg-x-bg-secondary hover:bg-x-bg-tertiary text-x-text px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 text-sm sm:text-base border border-x-border hover:border-x-border-light"
                  >
                    {getWalletLogo()}
                    <span>{getWalletButtonText()}</span>
                    <Check className="w-4 h-4 ml-2 text-green-400" />
                    <ChevronDown className={`w-4 h-4 transition-transform ${walletDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {walletDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-x-bg-secondary border border-x-border rounded-x shadow-lg z-50">
                      <div className="py-1">
                        <button
                          onClick={handleDisconnect}
                          className="w-full text-left px-4 py-2 text-x-text-secondary hover:bg-x-bg-tertiary hover:text-x-red transition-colors flex items-center space-x-2"
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
                  className="bg-x-purple text-white hover:bg-x-purple-hover px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-semibold transition-all duration-200 text-sm sm:text-base"
                >
                  {getWalletButtonText()}
                </button>
              )}
              {/* Cart View */}
              <button
                ref={cartButtonRef}
                className="relative bg-x-purple text-white px-3 py-1.5 rounded-lg font-bold shadow-md hover:bg-x-purple-hover transition-all duration-200 flex items-center text-sm border border-x-purple/30"
                title="View Cart"
                onClick={() => setCartPopoverOpen(!cartPopoverOpen)}
                style={{ zIndex: 2 }}
              >
                <ShoppingCart className="w-5 h-5 mr-1" />
                Cart
                {(cart?.length ?? 0) > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-xs rounded-full px-2 py-0.5">{cart?.length ?? 0}</span>
                )}
              </button>
              <CartPopover
                cart={cart}
                open={cartPopoverOpen}
                onClose={() => setCartPopoverOpen(false)}
                handleRemoveFromCart={removeFromCart}
                anchorRef={cartButtonRef}
                safeCopySummary={safeCopySummary}
                setSafeCopySummary={setSafeCopySummary}
              />
            </div>
          </div>

          <div className="md:hidden flex items-center gap-2 justify-end w-full">
            {/* Wallet Button as menu opener (icon only, exactly desktop style) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center justify-center w-9 h-9 bg-x-bg-secondary hover:bg-x-bg-tertiary text-x-text rounded-lg font-medium border border-x-border text-sm"
            >
              {getWalletLogo()}
            </button>
            {/* Cart Button for mobile (icon only, desktop style) */}
            <button
              ref={cartButtonRef}
              className="relative bg-x-purple text-white w-9 h-9 rounded-lg font-bold shadow-md hover:bg-x-purple-hover transition-all duration-200 flex items-center justify-center text-sm border border-x-purple/30"
              title="View Cart"
              onClick={() => setCartPopoverOpen(!cartPopoverOpen)}
              style={{ zIndex: 2 }}
            >
              <ShoppingCart className="w-5 h-5" />
              {(cart?.length ?? 0) > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-xs rounded-full px-2 py-0.5">{cart?.length ?? 0}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && location.pathname === '/' && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800">
          <div className="px-4 pt-6 pb-6 flex flex-col items-center space-y-4">
            {connected && publicKey ? (
              <>
                <div className="flex items-center space-x-3">
                  {getWalletLogo()}
                  <span className="text-white font-mono text-lg">{publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}</span>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="w-full mt-3 px-4 py-2 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white"
                >
                  Disconnect Wallet
                </button>
              </>
            ) : (
              <button
                onClick={onConnectWallet}
                className="w-full mt-3 px-4 py-2 rounded-lg font-semibold bg-purple-600 hover:bg-purple-700 text-white"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}