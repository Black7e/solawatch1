import React, { useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState } from '@solana/wallet-adapter-base';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WalletInfo {
  name: string;
  icon: string;
  adapter: any;
  detected: boolean;
  readyState: WalletReadyState;
  id: string;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { wallets, select, connect, connecting, connected } = useWallet();

  // Get wallet information using proper wallet adapter readyState
  const availableWallets = useMemo(() => {
    const walletIcons: { [key: string]: string } = {
      'Phantom': '👻',
      'MetaMask': '🦊', 
      'Coin98': '💰',
      'Solflare': '🔥',
      'Torus': '🔒'
    };

    return wallets.map((wallet) => {
      const readyState = wallet.adapter.readyState;
      return {
        name: wallet.adapter.name,
        icon: walletIcons[wallet.adapter.name] || '🔗',
        adapter: wallet,
        detected: readyState === WalletReadyState.Installed,
        readyState,
        id: wallet.adapter.name.toLowerCase().replace(/\s+/g, '')
      };
    }).filter((wallet) => {
      // Only show wallets that are installed, loadable, or supported
      return wallet.readyState !== WalletReadyState.Unsupported;
    });
  }, [wallets]);

  useEffect(() => {
    if (connected) {
      onClose();
    }
  }, [connected, onClose]);

  if (!isOpen) return null;

  const handleWalletConnect = async (wallet: WalletInfo) => {
    if (connected) {
      // Already connected, do nothing
      return;
    }
    
    try {
      // Check if wallet is not detected/installed
      if (wallet.readyState === WalletReadyState.NotDetected) {
        // Open wallet installation page
        const installUrls: { [key: string]: string } = {
          phantom: 'https://phantom.app/',
          metamask: 'https://metamask.io/',
          coin98: 'https://coin98.com/wallet',
          solflare: 'https://solflare.com/',
          torus: 'https://tor.us/'
        };
        
        const installUrl = installUrls[wallet.id] || wallet.adapter.adapter.url;
        if (installUrl) {
          window.open(installUrl, '_blank');
        }
        return;
      }
      
      // Use wallet adapter for all wallets
      select(wallet.adapter.adapter.name);
      await connect();
    } catch (error) {
      // Handle wallet connection errors
      console.error('Failed to connect wallet:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to connect wallet. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('User rejected') || error.message.includes('User denied')) {
          errorMessage = 'Connection was cancelled by user.';
        } else if (error.message.includes('already pending')) {
          errorMessage = 'Connection already in progress. Please check your wallet.';
        } else if (error.message.includes('Wallet not found')) {
          errorMessage = 'Wallet not found. Please make sure it is installed and unlocked.';
        } else if (error.name === 'WalletNotSelectedError') {
          // This is not a real error, just part of the wallet flow. Do nothing.
          return;
        } else if (error.name === 'WalletConnectionError') {
          errorMessage = 'Failed to connect to wallet. Please try again.';
        } else if (error.name === 'WalletNotReadyError') {
          errorMessage = 'Wallet is not ready. Please make sure it is installed and unlocked.';
        }
      }

      // Delay error dialog to allow wallet state to update
      setTimeout(() => {
        if (!connected) {
          alert(errorMessage);
        }
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md relative border border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Connect a wallet on
          </h2>
          <h3 className="text-2xl font-bold text-white">
            Solana to continue
          </h3>
        </div>
        
        <div className="space-y-3">
          {availableWallets.map((wallet, index) => (
            <button
              key={`${wallet.id}-${index}`}
              onClick={() => handleWalletConnect(wallet)}
              disabled={connecting}
              className="w-full flex items-center justify-between p-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-all duration-200 group border border-gray-600/50 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-xl">
                  {wallet.icon}
                </div>
                <span className="text-white font-medium text-lg">
                  {wallet.name}
                </span>
              </div>
              <span className={`text-sm ${wallet.detected ? 'text-green-400' : 'text-gray-400'}`}>
                {wallet.detected ? 'Detected' : 'Install'}
              </span>
            </button>
          ))}
        </div>
        
        {connecting && (
          <div className="mt-4 text-center">
            <p className="text-gray-400">Connecting...</p>
          </div>
        )}
      </div>
    </div>
  );
}