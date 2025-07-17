import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useCart } from './CartProvider';
import { X as XIcon, Trash2 as TrashIcon } from 'lucide-react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, VersionedTransaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { JupiterSwapService, TOKEN_MINTS } from '../utils/jupiterSwap';
import { getBalanceWithFallback, getTokenAccountsWithFallback } from '../utils/rpcFallback';
import { calculateFee, formatFeeInfo, feesEnabled, getFeePercent } from '../utils/feeUtils';

interface CartPopoverProps {
  cart: any[];
  open: boolean;
  onClose: () => void;
  handleRemoveFromCart: (symbol: string) => void;
  anchorRef?: React.RefObject<HTMLElement>;
  safeCopySummary?: { cartLimit: number; notSwappable: number; added: number } | null;
  setSafeCopySummary?: (val: any) => void;
}

const CartPopover: React.FC<CartPopoverProps> = ({ cart, open, onClose, handleRemoveFromCart, anchorRef, safeCopySummary, setSafeCopySummary }) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const { updateWeight, cart: cartItems, clearCart } = useCart();
  const [buyAmount, setBuyAmount] = useState('');
  const [buyCurrency, setBuyCurrency] = useState<'SOL' | 'USDC'>('SOL');
  const { publicKey, signTransaction, signAllTransactions, connect, wallet } = useWallet();
  const { connection } = useConnection();
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [buyResult, setBuyResult] = useState<string | null>(null);
  // Track per-token swap errors
  const [swapErrors, setSwapErrors] = useState<{ [mint: string]: string }>({});
  // Remove modal state, just use swapErrors for all error display
  // Add state to store estimated outputs for each token
  const [estimatedOutputs, setEstimatedOutputs] = useState<{ [mint: string]: string }>({});
  // Add toastMessages state at the top:
  const [toastMessages, setToastMessages] = useState<string[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Auto-set SOL/USDC weight to 0% when buyCurrency changes, and re-normalize others
  useEffect(() => {
    if (!cartItems.length) return;
    const symbol = buyCurrency;
    const hasToken = cartItems.some(item => item.token.symbol === symbol);
    if (!hasToken) return;
    // Only update if not already 0
    const token = cartItems.find(item => item.token.symbol === symbol);
    if (token && token.weight !== 0) {
      updateWeight(symbol, 0);
    }
  }, [buyCurrency, cartItems, updateWeight]);

  // Fetch balances when wallet or popover opens
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
        setSolBalance(0);
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
        setUsdcBalance(0);
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

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        (!anchorRef || !anchorRef.current || !anchorRef.current.contains(event.target as Node))
      ) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose, anchorRef]);

  useEffect(() => {
    const amt = parseFloat(buyAmount);
    if (!buyAmount || isNaN(amt) || amt <= 0) {
      setAmountError('Enter a valid amount');
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

  // Fee calculation (hidden from UI but still used for swap logic)
  const feeCalc = calculateFee(parseFloat(buyAmount) || 0);

  if (!open) return null;

  const isAmountValid = () => {
    const amt = parseFloat(buyAmount);
    if (!publicKey || !open) return false;
    if (isNaN(amt) || amt <= 0) return false;
    if (buyCurrency === 'SOL') return solBalance !== null && amt <= solBalance;
    if (buyCurrency === 'USDC') return usdcBalance !== null && amt <= usdcBalance;
    return false;
  };

  // Flyover right panel (drawer)
  return ReactDOM.createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-40 transition-opacity"
        onClick={onClose}
        aria-label="Close cart modal overlay"
      />
      {/* Centered Modal */}
      <div
        ref={popoverRef}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div className="bg-x-bg-secondary border border-x-border shadow-2xl rounded-x-lg w-full max-w-md flex flex-col p-0"
             style={{ minWidth: 340 }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-x-border rounded-t-xl">
            <h3 className="text-x-text font-semibold text-lg">Cart</h3>
            <div className="flex items-center gap-2">
              {cartItems.length > 0 && (
                <button
                  className="text-xs text-x-blue hover:underline hover:text-x-blue-hover font-medium px-2 py-1 bg-transparent border-none shadow-none outline-none"
                  style={{ background: 'none', boxShadow: 'none' }}
                  onClick={clearCart}
                >
                  Clear
                </button>
              )}
              <button
                className="text-x-text-secondary hover:text-x-text p-2 rounded transition-colors"
                onClick={onClose}
                aria-label="Close cart modal"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-4 pt-2">
            {/* Add All Results message */}
            {safeCopySummary && (
              <div className="mb-2 text-center">
                {safeCopySummary.cartLimit === 0 && safeCopySummary.added === 0 && (
                  <div className="text-xs text-red-400">Cart already has 10 tokens. Remove some to add more.</div>
                )}
                {safeCopySummary.cartLimit > 0 && (
                  <div className="text-xs text-yellow-400">Cart limit reached. You can only add up to <b>10</b> tokens for bulk swapping.</div>
                )}
              </div>
            )}
            {cartItems.length === 0 ? (
              <p className="text-x-text-secondary text-sm mt-8">No tokens in cart.</p>
            ) : (
              <ul className="divide-y divide-x-border" style={{ maxHeight: '40vh', overflowY: 'auto' }}>
                {cartItems.map((item, idx) => (
                  <React.Fragment key={item.token.symbol}>
                    <li className="flex items-center justify-between py-3">
                      <div className="flex items-center flex-1 min-w-0 space-x-2">
                        <button
                          onClick={() => handleRemoveFromCart(item.token.symbol)}
                          className="p-1 rounded hover:bg-x-bg-tertiary text-x-text-secondary hover:text-x-red transition-colors flex-shrink-0"
                          aria-label={`Remove ${item.token.symbol}`}
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                        <img
                          src={
                            item.token.symbol === 'SOL'
                              ? 'https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png'
                              : (item.token.logo || `https://img.jup.ag/tokens/${item.token.mint || ''}.png`)
                          }
                          alt={item.token.symbol}
                          className="w-7 h-7 rounded-full object-cover border border-x-border bg-x-bg-tertiary flex-shrink-0"
                          onError={e => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-x-text font-medium truncate">{item.token.symbol}</span>
                          {item.token.symbol === buyCurrency && (
                            <span className="text-xs text-x-text-secondary mt-0.5">Cannot buy {buyCurrency} with {buyCurrency}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-end" style={{ minWidth: 90 }}>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.01}
                          value={item.weight}
                          onChange={e => updateWeight(item.token.symbol, parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 rounded bg-x-bg-tertiary text-x-text border border-x-border text-xs focus:outline-none focus:ring-2 focus:ring-x-blue text-right"
                          style={{ textAlign: 'right' }}
                          disabled={item.token.symbol === buyCurrency}
                        />
                        <span className="text-x-text-secondary text-xs ml-1">%</span>
                      </div>
                    </li>
                    {swapErrors[item.token.mint] && (
                      <div className="text-xs text-x-red mt-1 ml-12">Unable to swap this, remove it to continue.</div>
                    )}
                  </React.Fragment>
                ))}
              </ul>
            )}
            {/* Buy section at bottom */}
            {cartItems.length > 0 && (
              <div className="sticky bottom-0 left-0 w-full bg-x-bg-secondary border-t border-x-border px-0 py-4 z-10 mt-4">
                <div className="flex flex-col gap-2 px-2">
                  <div className="mb-4">
                    <input
                      id="cart-buy-amount"
                      type="number"
                      min={0}
                      step={0.01}
                      value={buyAmount}
                      onChange={e => setBuyAmount(e.target.value)}
                      placeholder="Enter total amount to buy"
                      className="w-full px-3 py-2 rounded-x bg-x-bg-tertiary border border-x-border text-x-text focus:outline-none focus:ring-2 focus:ring-x-blue"
                    />
                    {amountError && (
                      <div className="text-xs text-x-red mt-1 text-left">{amountError}</div>
                    )}
                  </div>
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <button
                        className={`flex-1 px-3 py-1.5 rounded-x font-semibold border transition-colors text-sm ${buyCurrency === 'SOL' ? 'bg-x-blue text-white border-x-blue' : 'bg-x-bg-tertiary text-x-text-secondary border-x-border'}`}
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
                        className={`flex-1 px-3 py-1.5 rounded-x font-semibold border transition-colors text-sm ${buyCurrency === 'USDC' ? 'bg-x-blue text-white border-x-blue' : 'bg-x-bg-tertiary text-x-text-secondary border-x-border'}`}
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
                  {!publicKey ? (
                    <button
                      className="mt-2 w-full bg-x-bg-tertiary text-x-text-secondary font-bold py-2 px-4 rounded-x transition-all duration-200 text-base shadow opacity-50 cursor-not-allowed"
                      type="button"
                      disabled={true}
                    >
                      Connect your wallet to buy tokens
                    </button>
                  ) : (
                    <button
                      className="w-full bg-x-blue hover:bg-x-blue-hover text-white font-semibold px-6 py-3 rounded-x transition-all text-base shadow-md disabled:opacity-60"
                      type="button"
                      disabled={!isAmountValid() || !!amountError || isBuying || isLoadingBalances}
                      onClick={async () => {
                      setIsBuying(true);
                      setBuyResult(null);
                      setSwapErrors({});
                      try {
                        if (!publicKey) {
                          throw new Error('Wallet not connected');
                        }
                        // Check if wallet supports signAndSendAllTransactions (recommended) or signAllTransactions (fallback)
                        const supportsSignAndSend = (wallet && typeof (wallet as any).signAndSendAllTransactions === 'function') || 
                                                   (typeof window !== 'undefined' && (window as any).solana && typeof (window as any).solana.signAndSendAllTransactions === 'function');
                        const supportsSignAll = !!signAllTransactions;
                        
                        console.log('Wallet capabilities:', {
                          wallet: !!wallet,
                          walletSignAndSend: wallet && typeof (wallet as any).signAndSendAllTransactions === 'function',
                          windowSolana: typeof window !== 'undefined' && !!(window as any).solana,
                          windowSignAndSend: typeof window !== 'undefined' && (window as any).solana && typeof (window as any).solana.signAndSendAllTransactions === 'function',
                          supportsSignAndSend,
                          supportsSignAll
                        });
                        
                        if (!supportsSignAndSend && !supportsSignAll) {
                          setBuyResult('Your wallet does not support batch signing. Please use Phantom or a compatible wallet.');
                          setIsBuying(false);
                          return;
                        }
                        const jupiter = new JupiterSwapService(connection);
                        
                        // Calculate fee and net amount
                        const inputAmount = parseFloat(buyAmount);
                        const { feeAmount: calculatedFee, netAmount: calculatedNetAmount } = calculateFee(inputAmount);
                        
                        // 1. Build all swap transactions (unsigned)
                        const unsignedTxs = [];
                        const tokenSymbols = [];
                        const invalids: { symbol: string; error: string }[] = [];
                        for (const item of cartItems) {
                          try {
                            if (item.weight <= 0) continue;
                            const totalAmount = calculatedNetAmount; // Use net amount after fee
                            const buyAmountForToken = (item.weight / 100) * totalAmount;
                            // Always use input token decimals for smallest unit conversion
                            const inputDecimals = buyCurrency === 'SOL' ? 9 : 6;
                            const amountInSmallestUnit = Math.floor(buyAmountForToken * Math.pow(10, inputDecimals));
                            const inputMint = TOKEN_MINTS[buyCurrency as keyof typeof TOKEN_MINTS];
                            const outputMint = item.token.mint;
                            if (!inputMint || !outputMint) {
                              invalids.push({ symbol: item.token.symbol, error: `Unknown mint for ${item.token.symbol}` });
                              continue;
                            }
                            let quote;
                            try {
                              quote = await jupiter.getQuote({
                                inputMint,
                                outputMint,
                                amount: amountInSmallestUnit,
                                slippageBps: 300,
                              });
                            } catch (err) {
                              invalids.push({ symbol: item.token.symbol, error: `Error getting quote: ${err instanceof Error ? err.message : String(err)}` });
                              continue;
                            }
                            let bestRoute: any = null;
                            if (Array.isArray(quote.data) && quote.data.length > 0) {
                              bestRoute = quote.data[0];
                            } else if (quote && (quote as any).outAmount) {
                              bestRoute = quote;
                            }
                            if (!bestRoute || !bestRoute.outAmount || parseFloat(bestRoute.outAmount) === 0) {
                              invalids.push({ symbol: item.token.symbol, error: `No route for ${item.token.symbol}` });
                              continue;
                            }
                            let swapResponse;
                            try {
                              swapResponse = await jupiter.getSwapTransaction(
                                quote,
                                publicKey.toString(),
                                true,
                                true
                              );
                              if (!swapResponse || !swapResponse.swapTransaction) {
                                invalids.push({ symbol: item.token.symbol, error: `Swap not available for ${item.token.symbol}` });
                                continue;
                              }
                            } catch (err) {
                              invalids.push({ symbol: item.token.symbol, error: `Error getting swap transaction: ${err instanceof Error ? err.message : String(err)}` });
                              continue;
                            }
                            try {
                              const buf = Buffer.from(swapResponse.swapTransaction, 'base64');
                              const tx = VersionedTransaction.deserialize(buf);
                              unsignedTxs.push(tx);
                              tokenSymbols.push(item.token.symbol);
                            } catch (err) {
                              invalids.push({ symbol: item.token.symbol, error: `Error deserializing transaction: ${err instanceof Error ? err.message : String(err)}` });
                              continue;
                            }
                          } catch (err) {
                            invalids.push({ symbol: item.token.symbol, error: `Unexpected error: ${err instanceof Error ? err.message : String(err)}` });
                            continue;
                          }
                        }
                        if (invalids.length > 0) {
                          // Show all errors inline in the cart popover
                          const newErrors = { ...swapErrors };
                          for (const inv of invalids) {
                            // Find the mint for the symbol
                            const item = cartItems.find(i => i.token.symbol === inv.symbol);
                            if (item) newErrors[item.token.mint] = inv.error;
                          }
                          setSwapErrors(newErrors);
                          setIsBuying(false);
                          return;
                        }
                        if (unsignedTxs.length === 0) {
                          setBuyResult('No valid swap transactions could be built.');
                          setIsBuying(false);
                          return;
                        }
                        // 2. Use signAndSendAllTransactions if available (recommended), otherwise fallback to signAllTransactions
                        let completed: string[] = [];
                        let failed: string[] = [];
                        
                        if (supportsSignAndSend) {
                          // Use the recommended signAndSendAllTransactions method
                          try {
                            // Try wallet adapter first, then window.solana
                            let result;
                            if (wallet && typeof (wallet as any).signAndSendAllTransactions === 'function') {
                              result = await (wallet as any).signAndSendAllTransactions(unsignedTxs);
                            } else if (typeof window !== 'undefined' && (window as any).solana && typeof (window as any).solana.signAndSendAllTransactions === 'function') {
                              result = await (window as any).solana.signAndSendAllTransactions(unsignedTxs);
                            } else {
                              throw new Error('signAndSendAllTransactions not available');
                            }
                            console.log('signAndSendAllTransactions result:', result);
                            
                            // Handle the result - it should contain signatures for successful transactions
                            if (result && result.signatures) {
                              completed = tokenSymbols.slice(0, result.signatures.length);
                              failed = tokenSymbols.slice(result.signatures.length);
                            } else {
                              // If no signatures returned, assume all failed
                              failed = tokenSymbols;
                            }
                          } catch (err) {
                            console.error('signAndSendAllTransactions error:', err);
                            failed = tokenSymbols;
                            setSwapErrors(prev => ({ 
                              ...prev, 
                              [cartItems[0]?.token.mint || '']: `Batch swap failed: ${err instanceof Error ? err.message : 'Unknown error'}` 
                            }));
                          }
                        } else {
                          // Fallback to signAllTransactions + manual sending
                          const signedTxs = await signAllTransactions!(unsignedTxs);
                          for (let i = 0; i < signedTxs.length; i++) {
                            const tx = signedTxs[i];
                            const symbol = tokenSymbols[i];
                            try {
                              const sig = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: false, maxRetries: 3 });
                              await connection.confirmTransaction(sig, 'confirmed');
                              completed.push(symbol);
                            } catch (err) {
                              failed.push(symbol);
                              setSwapErrors(prev => ({ ...prev, [cartItems[i].token.mint]: `Swap failed for ${symbol}` }));
                            }
                          }
                        }
                        if (completed.length === 0) throw new Error('All swaps failed.');
                        setBuyResult('success');
                        const feeMessage = feesEnabled() ? ` (${getFeePercent()}% fee applied)` : '';
                        setToastMessages(msgs => [...msgs, `Swap successful!${feeMessage}`]);
                        setTimeout(() => {
                          setToastMessages(msgs => msgs.slice(1));
                          clearCart();
                          onClose();
                        }, 2000);
                      } catch (err: any) {
                        setBuyResult(err.message || 'Buy failed');
                        setToastMessages(msgs => [...msgs, `Swap failed: ${err.message || 'Unknown error'}`]);
                        setTimeout(() => setToastMessages(msgs => msgs.slice(1)), 2000);
                      } finally {
                        setIsBuying(false);
                      }
                    }}
                  >
                    {isBuying ? 'Buying...' : isLoadingBalances ? 'Loading...' : 'Buy Now'}
                  </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {toastMessages.length > 0 && (
        <div className="fixed right-8 top-20 z-50 flex flex-col items-end space-y-2">
          {toastMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`px-6 py-3 rounded-x shadow-lg text-sm font-semibold animate-fade-in-out ${msg.startsWith('Swap failed') ? 'bg-x-red' : 'bg-x-green'} text-white`}
              style={{ minWidth: 220 }}
            >
              {msg}
            </div>
          ))}
        </div>
      )}
    </>,
    document.body
  );
};

export default CartPopover; 