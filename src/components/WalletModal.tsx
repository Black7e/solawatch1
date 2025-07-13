import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WalletInfo {
  name: string;
  icon: string;
  adapter?: any;
  detected: boolean;
  id: string;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { wallets, select, connect, connecting, connected } = useWallet();
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);

  useEffect(() => {
    const checkWallets = () => {
      const walletList: WalletInfo[] = [
        {
          name: 'Phantom',
          icon: '👻',
          detected: !!(window as any).phantom?.solana,
          id: 'phantom',
          adapter: wallets.find(w => w.adapter.name === 'Phantom')
        },
        {
          name: 'MetaMask',
          icon: '🦊',
          detected: !!(window as any).solana?.isMetaMask,
          id: 'metamask',
          adapter: null // We'll handle MetaMask Solana connection manually
        },
        {
          name: 'Coin98',
          icon: '💰',
          detected: !!(window as any).coin98?.sol,
          id: 'coin98',
          adapter: wallets.find(w => w.adapter.name === 'Coin98')
        },
        {
          name: 'Solflare',
          icon: '🔥',
          detected: !!(window as any).solflare,
          id: 'solflare',
          adapter: wallets.find(w => w.adapter.name === 'Solflare')
        }
      ];
      
      setAvailableWallets(walletList);
    };

    if (isOpen) {
      checkWallets();
    }
  }, [isOpen, wallets]);

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
      if (wallet.id === 'metamask') {
        // Handle MetaMask Solana wallet connection
        if (!wallet.detected) {
          window.open('https://metamask.io/', '_blank');
          return;
        }
        
        try {
          const metamaskSolana = (window as any).solana;
          if (!metamaskSolana?.isMetaMask) {
            throw new Error('MetaMask Solana wallet not found');
          }
          
          // Connect to MetaMask Solana wallet directly
          const response = await metamaskSolana.connect();
          
          if (response && response.publicKey) {
            // Successfully connected
            console.log('Connected to MetaMask Solana wallet:', response.publicKey.toString());
            // The wallet adapter should handle the connection state
            setTimeout(() => {
              onClose();
            }, 500);
          } else {
            throw new Error('No accounts returned from MetaMask Solana wallet');
          }
        } catch (metamaskError) {
          console.error('MetaMask Solana wallet error:', metamaskError);
          
          // Provide more specific error messages
          let errorMessage = 'Failed to connect to MetaMask Solana wallet.';
          
          if (metamaskError instanceof Error) {
            if (metamaskError.message.includes('User rejected')) {
              errorMessage = 'Connection was cancelled by user.';
            } else if (metamaskError.message.includes('not found')) {
              errorMessage = 'MetaMask Solana wallet not found. Please install the MetaMask extension and enable Solana support.';
            } else {
              errorMessage = `MetaMask error: ${metamaskError.message}`;
            }
          }
          
          alert(errorMessage);
        }
        return;
      }

      if (!wallet.detected) {
        // Open wallet installation page
        const installUrls: { [key: string]: string } = {
          phantom: 'https://phantom.app/',
          coin98: 'https://coin98.com/wallet',
          solflare: 'https://solflare.com/'
        };
        
        if (installUrls[wallet.id]) {
          window.open(installUrls[wallet.id], '_blank');
        }
        return;
      }

      if (wallet.adapter) {
        // Use wallet adapter for supported wallets
        select(wallet.adapter.adapter.name);
        await connect();
      } else {
        // Direct wallet connection for wallets not in the adapter list
        if (wallet.id === 'phantom' && (window as any).phantom?.solana) {
          const phantom = (window as any).phantom.solana;
          await phantom.connect();
          onClose();
        } else if (wallet.id === 'coin98' && (window as any).coin98?.sol) {
          const coin98 = (window as any).coin98.sol;
          await coin98.connect();
          onClose();
        }
      }
    } catch (error) {
      // Only log unexpected errors
      if (!(typeof error === 'object' && error !== null && 'name' in error && (error as any).name === 'WalletNotSelectedError')) {
        console.error('Failed to connect wallet:', error);
      }
      
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
        }
      }

      // Delay error dialog to allow wallet state to update
      setTimeout(() => {
        if (!connected) {
          alert(errorMessage);
        }
        // If wallet is connected, do nothing (no error dialog)
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