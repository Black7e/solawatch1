import React, { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    TorusWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { getCurrentNetworkConfig, getNetworkDisplayName, getPrimaryRpcEndpoint } from '../config/network';

// Custom MetaMask Solana Wallet Adapter
class MetaMaskSolanaWalletAdapter {
    name = 'MetaMask';
    url = 'https://metamask.io/flask/';
    icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTI4LjA2IDEuMDYgMTcuNzUgOC41bC0xLjkxLTQuNTJMMjguMDYgMS4wNloiIGZpbGw9IiNFMjc2MkYiLz48L3N2Zz4=';
    
    get readyState() {
        if (typeof window === 'undefined') return 'Unsupported';
        try {
            return !!(window as any).solana?.isMetaMask ? 'Installed' : 'NotDetected';
        } catch (error) {
            console.warn('Error checking MetaMask wallet:', error);
            return 'NotDetected';
        }
    }
    
    get publicKey() {
        try {
            return (window as any).solana?.publicKey || null;
        } catch (error) {
            console.warn('Error getting MetaMask public key:', error);
            return null;
        }
    }
    
    get connected() {
        try {
            return !!(window as any).solana?.isConnected;
        } catch (error) {
            console.warn('Error checking MetaMask connection:', error);
            return false;
        }
    }
    
    async connect() {
        if (typeof window === 'undefined' || !(window as any).solana?.isMetaMask) {
            throw new Error('MetaMask Solana wallet not found');
        }
        
        try {
            const response = await (window as any).solana.connect();
            return response;
        } catch (error) {
            throw new Error(`Failed to connect to MetaMask Solana wallet: ${error}`);
        }
    }
    
    async disconnect() {
        try {
            if ((window as any).solana?.disconnect) {
                await (window as any).solana.disconnect();
            }
        } catch (error) {
            console.warn('Error disconnecting MetaMask wallet:', error);
        }
    }
    
    async signTransaction(transaction: any) {
        if (!(window as any).solana?.signTransaction) {
            throw new Error('MetaMask Solana wallet does not support transaction signing');
        }
        return await (window as any).solana.signTransaction(transaction);
    }
    
    async signAllTransactions(transactions: any[]) {
        if (!(window as any).solana?.signAllTransactions) {
            throw new Error('MetaMask Solana wallet does not support signing multiple transactions');
        }
        return await (window as any).solana.signAllTransactions(transactions);
    }
    
    async signAndSendAllTransactions(transactions: any[]) {
        if (!(window as any).solana?.signAndSendAllTransactions) {
            throw new Error('MetaMask Solana wallet does not support signAndSendAllTransactions');
        }
        return await (window as any).solana.signAndSendAllTransactions(transactions);
    }
    
    async signMessage(message: Uint8Array) {
        if (!(window as any).solana?.signMessage) {
            throw new Error('MetaMask Solana wallet does not support message signing');
        }
        return await (window as any).solana.signMessage(message);
    }

    // Add no-op event emitter methods to match adapter interface
    on(..._args: any[]) {}
    off(..._args: any[]) {}
}

// Default styles that can be overridden by your app
try {
    import('@solana/wallet-adapter-react-ui/styles.css');
} catch (error) {
    console.warn('Failed to load wallet adapter styles:', error);
}

interface Props {
    children: ReactNode;
}

export const WalletContextProvider: FC<Props> = ({ children }) => {
    // Get network configuration
    const endpoint = useMemo(() => {
        try {
            const endpoint = getPrimaryRpcEndpoint();
            console.log(`Using ${getNetworkDisplayName()} RPC endpoint:`, endpoint);
            return endpoint;
        } catch (error) {
            console.error('Error getting RPC endpoint:', error);
            // Fallback to public endpoint
            return 'https://api.mainnet-beta.solana.com';
        }
    }, []);

    const wallets = useMemo(
        () => {
            try {
                // Safari-compatible wallet initialization
                const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
                
                if (isSafari) {
                    console.log('Safari detected - using minimal wallet setup');
                    // Only use Phantom for Safari initially
                    return [new PhantomWalletAdapter()];
                }
                
                return [
                    new PhantomWalletAdapter(),
                    new MetaMaskSolanaWalletAdapter() as any,
                    new SolflareWalletAdapter(),
                    new TorusWalletAdapter(),
                ];
            } catch (error) {
                console.error('Error initializing wallets:', error);
                // Return minimal wallet setup
                return [new PhantomWalletAdapter()];
            }
        },
        []
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                {children}
            </WalletProvider>
        </ConnectionProvider>
    );
};