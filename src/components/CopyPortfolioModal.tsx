import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X as XIcon, ArrowUpDown, Wallet, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { JupiterSwapService, TOKEN_MINTS, TokenSymbol } from '../utils/jupiterSwap';
import { LAMPORTS_PER_SOL, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { getSolPrice, getNetworkDisplayName, isTestnet } from '../config/network';
import { calculateFee, formatFeeInfo, feesEnabled, getFeePercent } from '../utils/feeUtils';
import CartPopover from './CartPopover';
import { SolanaTracker } from "solana-swap";

interface TokenHolding {
  symbol: string;
  name: string;
  amount: number;
  value: number;
  price: number;
  change24h: number;
  logo?: string;
  mint: string;
  marketName?: string;
  priceError?: boolean;
}

interface PortfolioData {
  totalValue: number;
  change24h: number;
  change24hPercent: number;
  tokens: TokenHolding[];
  nftCount: number;
  lastActivity: string;
}

interface SwapAllocation {
  token: TokenHolding;
  percentage: number;
  solAmount: number;
  estimatedTokens: number;
}

interface CopyPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioData: PortfolioData | null;
  walletAddress: string;
  cart: any[];
  handleAddToCart: (allocation: any) => void;
  handleRemoveFromCart: (symbol: string) => void;
}

type CopyOption = 'all' | 'min-allocation' | 'top-10';
export default function CopyPortfolioModal({ isOpen, onClose, portfolioData, walletAddress, cart, handleAddToCart, handleRemoveFromCart }: CopyPortfolioModalProps) {
  const [solAmount, setSolAmount] = useState<string>('10');
  const [allocations, setAllocations] = useState<SwapAllocation[]>([]);
  const [copyOption, setCopyOption] = useState<CopyOption>('min-allocation');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStep, setExecutionStep] = useState<string>('');
  const [completedSwaps, setCompletedSwaps] = useState<string[]>([]);
  const [failedSwaps, setFailedSwaps] = useState<string[]>([]);
  const [walletSolBalance, setWalletSolBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState<boolean>(false);
  const [cartPopoverOpen, setCartPopoverOpen] = useState(false);
  const cartButtonRef = useRef<HTMLButtonElement>(null);
  const [swapSuccess, setSwapSuccess] = useState<boolean>(false);
  
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();

  // Add state for grouped error modal
  const [safeCopyErrorSummary, setSafeCopyErrorSummary] = useState<{cartLimit: number, notSwappable: number} | null>(null);

  // Fee calculation
  const feeCalc = calculateFee(parseFloat(solAmount) || 0);
  const { feeAmount, netAmount } = feeCalc;

  // Fetch wallet SOL balance when modal opens and wallet is connected
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (publicKey && isOpen) {
        setLoadingBalance(true);
        try {
          const balance = await connection.getBalance(publicKey);
          setWalletSolBalance(balance / LAMPORTS_PER_SOL);
        } catch (error) {
          console.error('Error fetching wallet balance:', error);
          setWalletSolBalance(0);
        } finally {
          setLoadingBalance(false);
        }
      }
    };

    fetchWalletBalance();
  }, [publicKey, isOpen, connection]);

  useEffect(() => {
    if (portfolioData && isOpen) {
      calculateAllocations();
    }
  }, [portfolioData, solAmount, copyOption, isOpen]);

  const getFilteredTokens = () => {
    if (!portfolioData) return [];
    
    const totalPortfolioValue = portfolioData.totalValue;
    
    switch (copyOption) {
      case 'min-allocation':
        // Filter tokens with more than 1% allocation
        return portfolioData.tokens.filter(token => {
          const percentage = (token.value / totalPortfolioValue) * 100;
          return percentage > 1;
        });
      
      case 'top-10':
        // Get top 10 tokens by value
        return portfolioData.tokens
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);
      
      case 'all':
      default:
        return portfolioData.tokens;
    }
  };
  const calculateAllocations = () => {
    if (!portfolioData || !solAmount) return;

    const filteredTokens = getFilteredTokens();
    const totalFilteredValue = filteredTokens.reduce((sum, token) => sum + token.value, 0);
    const solAmountNum = parseFloat(solAmount);
    const { netAmount: calculatedNetAmount } = calculateFee(solAmountNum);
    
    // Calculate percentage allocation for each filtered token based on their value in the filtered set
    const newAllocations: SwapAllocation[] = filteredTokens.map(token => {
      const percentage = totalFilteredValue > 0 ? (token.value / totalFilteredValue) * 100 : 0;
      const solAmountForToken = (calculatedNetAmount * percentage) / 100; // Use net amount after fee
      const estimatedTokens = solAmountForToken / token.price * getSolPrice();
      
      return {
        token,
        percentage,
        solAmount: solAmountForToken,
        estimatedTokens
      };
    });

    setAllocations(newAllocations);
  };

  const getCopyOptionLabel = (option: CopyOption) => {
    switch (option) {
      case 'min-allocation':
        return 'Tokens with >1% allocation';
      case 'top-10':
        return 'Top 10 tokens by value';
      case 'all':
        return 'All tokens';
    }
  };

  const getCopyOptionDescription = (option: CopyOption) => {
    switch (option) {
      case 'min-allocation':
        return `Only copy tokens that represent more than 1% of the portfolio value (${getFilteredTokens().length} tokens)`;
      case 'top-10':
        return `Copy the 10 largest token holdings by USD value (${Math.min(10, portfolioData?.tokens.length || 0)} tokens)`;
      case 'all':
        return `Copy the entire portfolio including small holdings (${portfolioData?.tokens.length || 0} tokens)`;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
    if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
    if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K';
    return value.toFixed(2);
  };

  const handleExecuteSwaps = async () => {
    if (!publicKey || !signTransaction || !connection) {
      alert('Please connect your wallet first');
      return;
    }
    if (!signAllTransactions) {
      alert('Your wallet does not support batch signing. Please use Phantom or a compatible wallet.');
      return;
    }
    if (!portfolioData || allocations.length === 0) {
      alert('No portfolio data available');
      return;
    }
    setIsExecuting(true);
    setCompletedSwaps([]);
    setFailedSwaps([]);
    setExecutionStep('Building swap transactions...');
    const jupiterService = new JupiterSwapService(connection);
    
    // Calculate fee and net amount
    const inputAmount = parseFloat(solAmount);
    const { netAmount: calculatedNetAmount } = calculateFee(inputAmount);
    
    try {
      // 1. Build all swap transactions (unsigned)
      const unsignedTxs: VersionedTransaction[] = [];
      const tokenSymbols: string[] = [];
      for (const allocation of allocations) {
        const outputMint = allocation.token.mint;
        if (!outputMint || outputMint === TOKEN_MINTS.SOL) continue;
        const solAmountLamports = Math.floor(allocation.solAmount * LAMPORTS_PER_SOL);
        setExecutionStep(`Building SOL → ${allocation.token.symbol} swap...`);
        // Get quote
        const quote = await jupiterService.getQuote({
          inputMint: TOKEN_MINTS.SOL,
          outputMint,
          amount: solAmountLamports,
          slippageBps: 300,
        });
        if (!quote.data || quote.data.length === 0) continue;
        // Get swap transaction (base64)
        const swapResponse = await jupiterService.getSwapTransaction(
          quote,
          publicKey.toString(),
          true,
          true,
          undefined,
          undefined,
          100000
        );
        // Decode to VersionedTransaction
        const buf = Buffer.from(swapResponse.swapTransaction, 'base64');
        const tx = VersionedTransaction.deserialize(buf);
        unsignedTxs.push(tx);
        tokenSymbols.push(allocation.token.symbol);
      }
      if (unsignedTxs.length === 0) throw new Error('No valid swap transactions could be built.');
      setExecutionStep('Requesting wallet signature for all swaps...');
      // 2. Request signAllTransactions
      const signedTxs = await signAllTransactions(unsignedTxs);
      setExecutionStep('Sending signed transactions to Solana...');
      // 3. Send each signed transaction
      const completed: string[] = [];
      const failed: string[] = [];
      for (let i = 0; i < signedTxs.length; i++) {
        const tx = signedTxs[i];
        const symbol = tokenSymbols[i];
        try {
          setExecutionStep(`Sending ${symbol} swap...`);
          const sig = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: false, maxRetries: 3 });
          await connection.confirmTransaction(sig, 'confirmed');
          completed.push(symbol);
        } catch (err) {
          failed.push(symbol);
        }
      }
      setCompletedSwaps(completed);
      setFailedSwaps(failed);
      setExecutionStep('Portfolio copy completed!');
      setTimeout(() => {
        setIsExecuting(false);
        setExecutionStep('');
        if (completed.length > 0) {
          setSwapSuccess(true);
          onClose();
        }
        // alert(`${completed.length} swaps succeeded, ${failed.length} failed.`);
      }, 2000);
    } catch (error) {
      setIsExecuting(false);
      setExecutionStep('');
      alert(`Portfolio copy failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Example Safe Copy handler (replace with your actual logic)
  const handleSafeCopy = () => {
    // ... logic to determine which tokens failed for which reason ...
    // For demonstration, let's say 23 tokens hit cart limit, 5 not swappable
    setSafeCopyErrorSummary({ cartLimit: 23, notSwappable: 5 });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-700">
        {/* Header with Cart Popover */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Portfolio Tokens</h2>
            <p className="text-gray-400 text-sm mt-1">
              {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Cart Button */}
            <button
              ref={cartButtonRef}
              onClick={() => setCartPopoverOpen((v) => !v)}
              className="relative bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-all duration-200"
            >
              Cart
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-purple-500 text-xs rounded-full px-2 py-0.5">{cart.length}</span>
              )}
            </button>
            <CartPopover
              cart={cart}
              open={cartPopoverOpen}
              onClose={() => setCartPopoverOpen(false)}
              handleRemoveFromCart={handleRemoveFromCart}
              anchorRef={cartButtonRef}
            />
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
        {/* Allocation Breakdown with Add to Cart */}
        <div className="p-6 overflow-y-auto max-h-[calc(60vh-140px)]">
          <div className="space-y-3">
            {allocations.map((allocation: SwapAllocation, index: number) => (
              <div
                key={index}
                className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative w-8 h-8 flex-shrink-0">
                    <img
                      src={
                        allocation.token.symbol === 'SOL'
                          ? 'https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png'
                          : `https://img.jup.ag/tokens/${allocation.token.mint || 'unknown'}.png`
                      }
                      alt={allocation.token.symbol}
                      className="w-8 h-8 rounded-full object-cover border border-gray-600 bg-gray-700"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div 
                      className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full items-center justify-center text-white text-sm font-bold absolute top-0 left-0 hidden"
                    >
                      {allocation.token.symbol.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-white font-medium">{allocation.token.symbol}</div>
                    <div className="text-gray-400 text-sm">{allocation.token.name}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleAddToCart(allocation)}
                  disabled={cart.some(item => item.token.symbol === allocation.token.symbol)}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cart.some(item => item.token.symbol === allocation.token.symbol) ? 'Added' : 'Add to Cart'}
                </button>
              </div>
            ))}
          </div>
        </div>
        {/* Footer with Amount Input and Copy Button */}
        <div className="p-6 border-t border-gray-700">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
            <div className="w-full sm:w-auto">
              <label className="block text-gray-300 text-sm mb-1">Amount to invest (SOL)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={solAmount}
                onChange={e => setSolAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter SOL amount"
              />
              
                             {/* Fee Information */}
               {feesEnabled() && parseFloat(solAmount) > 0 && (
                 <div className="mt-2 p-2 bg-gray-800 rounded border border-gray-700">
                   <div className="text-xs text-gray-400 space-y-1">
                     <div className="flex justify-between">
                       <span>Original Amount:</span>
                       <span className="text-white">{parseFloat(solAmount).toFixed(4)} SOL</span>
                     </div>
                     <div className="flex justify-between">
                       <span>Fee ({getFeePercent()}%):</span>
                       <span className="text-red-400">-{feeAmount.toFixed(4)} SOL</span>
                     </div>
                     <div className="flex justify-between border-t border-gray-700 pt-1">
                       <span className="font-medium">Net Amount:</span>
                       <span className="text-green-400 font-medium">{netAmount.toFixed(4)} SOL</span>
                     </div>
                   </div>
                 </div>
               )}
            </div>
            <button
              onClick={handleExecuteSwaps}
              disabled={isExecuting || !publicKey || !signAllTransactions || !portfolioData || allocations.length === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExecuting ? 'Executing...' : 'Copy Portfolio'}
            </button>
          </div>
        </div>
      </div>
      {safeCopyErrorSummary && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full border border-gray-700 text-center">
            <h3 className="text-lg font-bold text-white mb-4">Safe Copy Results</h3>
            <div className="text-gray-300 space-y-2">
              {safeCopyErrorSummary.cartLimit > 0 && (
                <div>Cart limit reached (<b>{safeCopyErrorSummary.cartLimit}</b> tokens not added)</div>
              )}
              {safeCopyErrorSummary.notSwappable > 0 && (
                <div>Not swappable (<b>{safeCopyErrorSummary.notSwappable}</b> tokens)</div>
              )}
            </div>
            <button
              className="mt-6 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold"
              onClick={() => setSafeCopyErrorSummary(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {swapSuccess && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full border border-gray-700 text-center">
            <h3 className="text-lg font-bold text-green-400 mb-4">Swap Successful!</h3>
            <div className="text-gray-300 mb-4">Your tokens have been swapped and added to your wallet.</div>
            <button
              className="mt-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold"
              onClick={() => setSwapSuccess(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}