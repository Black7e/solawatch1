import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X as XIcon } from 'lucide-react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Connection } from '@solana/web3.js';
import { TOKEN_MINTS, JupiterSwapService } from '../utils/jupiterSwap';
import { getBalanceWithFallback, getTokenAccountsWithFallback } from '../utils/rpcFallback';
import { calculateFee, formatFeeInfo, feesEnabled, getFeePercent } from '../utils/feeUtils';

interface QuickBuyModalProps {
  open: boolean;
  onClose: () => void;
  token: any; // TrendingToken
}

// Simple toast notification component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
    }`}>
      {message}
    </div>,
    document.body
  );
};

const QuickBuyModal: React.FC<QuickBuyModalProps> = ({ open, onClose, token }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  
  // Create a new connection instance to match CartPopover approach
  const [swapConnection] = useState(() => new Connection('https://api.mainnet-beta.solana.com'));
  const [buyAmount, setBuyAmount] = useState('');
  const [buyCurrency, setBuyCurrency] = useState<'SOL' | 'USDC'>('SOL');
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [buyResult, setBuyResult] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Add minimum amount validation (matching CartPopover) - MOVED BEFORE USE
  const getMinimumAmount = () => {
    if (buyCurrency === 'SOL') return 0.001; // Minimum 0.001 SOL
    if (buyCurrency === 'USDC') return 0.1; // Minimum 0.1 USDC
    return 0;
  };

  // Fee calculation
  const feeCalc = calculateFee(parseFloat(buyAmount) || 0);
  const { feeAmount, netAmount } = feeCalc;

  useEffect(() => {
    if (!publicKey || !open) return;
    
    setIsLoadingBalances(true);
    
    // Fetch SOL balance with RPC fallback
    const fetchSolBalance = async () => {
      try {
        const lamports = await getBalanceWithFallback(publicKey);
        setSolBalance(lamports / 1e9);
      } catch (error) {
        console.error('Failed to fetch SOL balance on all RPC endpoints:', error);
        // Set a default balance and show user-friendly error
        setSolBalance(0);
        setToast({ 
          message: 'Unable to fetch wallet balance. The Solana network may be experiencing issues. Please try again later.', 
          type: 'error' 
        });
      }
    };

    // Fetch USDC balance with RPC fallback
    const fetchUsdcBalance = async () => {
      try {
        const res = await getTokenAccountsWithFallback(publicKey, new PublicKey(TOKEN_MINTS.USDC));
        let usdc = 0;
        if (res.value.length > 0) {
          usdc = res.value.reduce((sum: number, acc: any) => sum + (acc.account.data.parsed.info.tokenAmount.uiAmount || 0), 0);
        }
        setUsdcBalance(usdc);
      } catch (error) {
        console.error('Failed to fetch USDC balance on all RPC endpoints:', error);
        // Set a default balance and show user-friendly error
        setUsdcBalance(0);
        setToast({ 
          message: 'Unable to fetch USDC balance. The Solana network may be experiencing issues. Please try again later.', 
          type: 'error' 
        });
      }
    };

    // Fetch both balances in parallel
    Promise.all([
      fetchSolBalance().catch(() => {}), // Don't throw, just log
      fetchUsdcBalance().catch(() => {}) // Don't throw, just log
    ]).finally(() => {
      setIsLoadingBalances(false);
    });
  }, [publicKey, connection, open]);

  useEffect(() => {
    const amt = parseFloat(buyAmount);
    const minAmount = getMinimumAmount();
    
    if (!buyAmount || isNaN(amt) || amt <= 0) {
      setAmountError('Enter a valid amount');
      return;
    }
    if (amt < minAmount) {
      setAmountError(`Minimum amount is ${minAmount} ${buyCurrency}`);
      return;
    }
    if (buyCurrency === 'SOL' && solBalance !== null && amt > solBalance) {
      setAmountError('Insufficient SOL balance');
      return;
    }
    if (buyCurrency === 'USDC' && usdcBalance !== null && amt > usdcBalance) {
      setAmountError('Insufficient USDC balance');
      return;
    }
    setAmountError(null);
  }, [buyAmount, buyCurrency, solBalance, usdcBalance]);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  if (!open) return null;

  const isAmountValid = () => {
    const amt = parseFloat(buyAmount);
    if (!publicKey || !open) return false;
    if (isNaN(amt) || amt <= 0) return false;
    if (buyCurrency === 'SOL') return solBalance !== null && amt <= solBalance;
    if (buyCurrency === 'USDC') return usdcBalance !== null && amt <= usdcBalance;
    return false;
  };

  // Implement buy logic with JupiterSwapService (matching CartPopover implementation)
  const handleBuy = async () => {
    setIsBuying(true);
    setBuyResult(null);
    try {
      if (!publicKey || !signTransaction) {
        setToast({ message: 'Please connect your wallet.', type: 'error' });
        setIsBuying(false);
        return;
      }

      const inputAmount = parseFloat(buyAmount);
      const { feeAmount: calculatedFee, netAmount: calculatedNetAmount } = calculateFee(inputAmount);

      console.log('Starting swap with params:', {
        inputMint: buyCurrency === 'SOL' ? TOKEN_MINTS.SOL : TOKEN_MINTS.USDC,
        outputMint: token.mint,
        originalAmount: inputAmount,
        feeAmount: calculatedFee,
        netAmount: calculatedNetAmount,
        amount: buyCurrency === 'SOL' ? Math.round(calculatedNetAmount * 1e9) : Math.round(calculatedNetAmount * 1e6),
        slippageBps: 300
      });

      const inputMint = buyCurrency === 'SOL' ? TOKEN_MINTS.SOL : TOKEN_MINTS.USDC;
      const outputMint = token.mint;
      const amount = buyCurrency === 'SOL'
        ? Math.round(inputAmount * 1e9) // SOL to lamports (original amount for fee calculation)
        : Math.round(inputAmount * 1e6); // USDC to 6 decimals (original amount for fee calculation)
      const slippageBps = 300; // 3% (matching CartPopover)
      
      const jupiter = new JupiterSwapService(swapConnection);
      
      // 1. Get quote (matching CartPopover logic)
      console.log('Getting quote from Jupiter...');
      let quote;
      try {
        quote = await jupiter.getQuote({ inputMint, outputMint, amount, slippageBps });
      } catch (err) {
        throw new Error(`Error getting quote: ${err instanceof Error ? err.message : String(err)}`);
      }
      
      console.log('Quote response:', quote);
      
      // Check for valid quote (matching CartPopover logic)
      let bestRoute: any = null;
      if (Array.isArray(quote.data) && quote.data.length > 0) {
        bestRoute = quote.data[0];
      } else if (quote && (quote as any).outAmount) {
        bestRoute = quote;
      }
      
      if (!bestRoute || !bestRoute.outAmount || parseFloat(bestRoute.outAmount) === 0) {
        throw new Error(`No swap route found for ${token.symbol}. This token may not have sufficient liquidity or may not be available for trading.`);
      }
      
      // 2. Get swap transaction (matching CartPopover logic)
      console.log('Getting swap transaction...');
      let swapResponse;
      try {
        swapResponse = await jupiter.getSwapTransaction(
          quote,
          publicKey.toString(),
          true,
          true
        );
        if (!swapResponse || !swapResponse.swapTransaction) {
          throw new Error(`Swap not available for ${token.symbol}`);
        }
      } catch (err) {
        throw new Error(`Error getting swap transaction: ${err instanceof Error ? err.message : String(err)}`);
      }
      
      console.log('Swap transaction response:', swapResponse);
      
      // 3. Execute swap (matching CartPopover logic)
      console.log('Executing swap...');
      const signature = await jupiter.executeSwap(swapResponse.swapTransaction, { signTransaction }, swapConnection);
      console.log('Swap successful, signature:', signature);
      
      const feeMessage = feesEnabled() ? ` (${getFeePercent()}% fee applied)` : '';
      setToast({ message: `Successfully bought ${token.symbol}!${feeMessage} Transaction: ${signature.slice(0, 8)}...`, type: 'success' });
      onClose(); // Close modal on success
      
    } catch (err: any) {
      console.error('Swap error:', err);
      const errorMessage = err.message || 'Swap failed. Please try again.';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsBuying(false);
    }
  };

  return ReactDOM.createPortal(
    <>
      {/* Toast notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
        aria-label="Close quick buy modal overlay"
      />
      {/* Centered Modal */}
      <div
        ref={modalRef}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div className="bg-gray-900 border border-gray-800 shadow-2xl rounded-xl w-full max-w-md flex flex-col p-0"
             style={{ minWidth: 340 }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 rounded-t-xl">
            <h3 className="text-white font-semibold text-lg">Quick Buy: {token?.name || token?.symbol}</h3>
            <button
              className="text-gray-400 hover:text-white p-2 rounded transition-colors"
              onClick={onClose}
              aria-label="Close quick buy modal"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-4 pt-2">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={token.image}
                alt={token.name}
                className="w-10 h-10 rounded-full bg-gray-700 border border-gray-600 object-cover"
                onError={e => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/unknown-logo.png';
                }}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-white font-bold text-lg leading-tight truncate">{token.name}</span>
                <span className="text-gray-400 text-sm font-medium">{token.symbol}</span>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 text-sm mb-1">Amount</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={buyAmount}
                onChange={e => setBuyAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter amount to buy"
              />
              {amountError && <div className="text-xs text-red-400 mt-1">{amountError}</div>}
              
              {/* Fee Information */}
              {feesEnabled() && parseFloat(buyAmount) > 0 && (
                <div className="mt-2 p-2 bg-gray-800 rounded border border-gray-700">
                  <div className="text-xs text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Original Amount:</span>
                      <span className="text-white">{parseFloat(buyAmount).toFixed(4)} {buyCurrency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fee ({getFeePercent()}%):</span>
                      <span className="text-red-400">-{feeAmount.toFixed(4)} {buyCurrency}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-700 pt-1">
                      <span className="font-medium">Net Amount:</span>
                      <span className="text-green-400 font-medium">{netAmount.toFixed(4)} {buyCurrency}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 text-sm mb-1">Pay with</label>
              <div className="flex gap-2">
                <button
                  className={`px-4 py-2 rounded-lg font-semibold border transition-colors ${buyCurrency === 'SOL' ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-800 text-gray-300 border-gray-700'}`}
                  onClick={() => setBuyCurrency('SOL')}
                  disabled={isLoadingBalances}
                >
                  SOL {isLoadingBalances ? (
                    <span className="text-xs ml-1">(Loading...)</span>
                  ) : solBalance !== null ? (
                    <span className="text-xs ml-1">({solBalance.toFixed(2)})</span>
                  ) : (
                    <span className="text-xs ml-1">(--)</span>
                  )}
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-semibold border transition-colors ${buyCurrency === 'USDC' ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-800 text-gray-300 border-gray-700'}`}
                  onClick={() => setBuyCurrency('USDC')}
                  disabled={isLoadingBalances}
                >
                  USDC {isLoadingBalances ? (
                    <span className="text-xs ml-1">(Loading...)</span>
                  ) : usdcBalance !== null ? (
                    <span className="text-xs ml-1">({usdcBalance.toFixed(2)})</span>
                  ) : (
                    <span className="text-xs ml-1">(--)</span>
                  )}
                </button>
              </div>
            </div>
            <div className="mt-6">
              <button
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-all text-base shadow-md disabled:opacity-60"
                disabled={!isAmountValid() || isBuying || isLoadingBalances}
                onClick={handleBuy}
              >
                {isBuying ? 'Buying...' : isLoadingBalances ? 'Loading...' : 'Confirm Buy'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default QuickBuyModal; 