import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useCart } from './CartProvider';
import { X as XIcon } from 'lucide-react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, VersionedTransaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { JupiterSwapService, TOKEN_MINTS } from '../utils/jupiterSwap';

interface CartPopoverProps {
  cart: any[];
  open: boolean;
  onClose: () => void;
  handleRemoveFromCart: (symbol: string) => void;
  anchorRef?: React.RefObject<HTMLElement>;
}

const CartPopover: React.FC<CartPopoverProps> = ({ cart, open, onClose, handleRemoveFromCart, anchorRef }) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const { updateWeight, cart: cartItems, clearCart } = useCart();
  const [buyAmount, setBuyAmount] = useState('');
  const [buyCurrency, setBuyCurrency] = useState<'SOL' | 'USDC'>('SOL');
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
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
    // Fetch SOL
    connection.getBalance(publicKey).then(lamports => {
      setSolBalance(lamports / 1e9);
    });
    // Fetch USDC
    connection.getParsedTokenAccountsByOwner(publicKey, { mint: new PublicKey(TOKEN_MINTS.USDC) })
      .then(res => {
        let usdc = 0;
        if (res.value.length > 0) {
          usdc = res.value.reduce((sum, acc) => sum + (acc.account.data.parsed.info.tokenAmount.uiAmount || 0), 0);
        }
        setUsdcBalance(usdc);
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
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
        aria-label="Close cart drawer overlay"
      />
      {/* Drawer */}
      <div
        ref={popoverRef}
        className="fixed top-0 right-0 h-full w-full max-w-md bg-gray-900 border-l border-gray-800 shadow-2xl z-50 flex flex-col p-0"
        style={{ minWidth: 340 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h3 className="text-white font-semibold text-lg">Cart</h3>
          <div className="flex items-center gap-2">
            {cartItems.length > 0 && (
              <button
                className="text-xs text-purple-400 hover:underline hover:text-purple-300 font-medium px-2 py-1 bg-transparent border-none shadow-none outline-none"
                style={{ background: 'none', boxShadow: 'none' }}
                onClick={clearCart}
              >
                Clear
              </button>
            )}
            <button
              className="text-gray-400 hover:text-white p-2 rounded transition-colors"
              onClick={onClose}
              aria-label="Close cart drawer"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-40 pt-2">
          {cartItems.length === 0 ? (
            <p className="text-gray-400 text-sm mt-8">No tokens in cart.</p>
          ) : (
            <ul className="divide-y divide-gray-700">
              {cartItems.map((item, idx) => (
                <React.Fragment key={item.token.symbol}>
                  <li className="flex items-center justify-between py-3">
                    <div className="flex items-center flex-1 min-w-0 space-x-2">
                      <img
                        src={
                          item.token.symbol === 'SOL'
                            ? 'https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png'
                            : (item.token.logo || `https://img.jup.ag/tokens/${item.token.mint || ''}.png`)
                        }
                        alt={item.token.symbol}
                        className="w-7 h-7 rounded-full object-cover border border-gray-600 bg-gray-700 flex-shrink-0"
                        onError={e => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-white font-medium truncate">{item.token.symbol}</span>
                        {item.token.symbol === buyCurrency && (
                          <span className="text-xs text-gray-400 mt-0.5">Cannot buy {buyCurrency} with {buyCurrency}</span>
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
                        className="w-16 px-2 py-1 rounded bg-gray-800 text-white border border-gray-600 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 text-right"
                        style={{ textAlign: 'right' }}
                        disabled={item.token.symbol === buyCurrency}
                      />
                      <span className="text-gray-400 text-xs ml-1">%</span>
                      <button
                        onClick={() => handleRemoveFromCart(item.token.symbol)}
                        className="ml-2 p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors"
                        aria-label={`Remove ${item.token.symbol}`}
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                  {swapErrors[item.token.mint] && (
                    <div className="text-xs text-red-500 mt-1 ml-12">{swapErrors[item.token.mint]}</div>
                  )}
                </React.Fragment>
              ))}
            </ul>
          )}
        </div>
        {/* Sticky buy section at bottom */}
        <div className="sticky bottom-0 left-0 w-full bg-gray-900 border-t border-gray-800 px-6 py-4 z-10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-400" htmlFor="cart-buy-amount">Amount to Buy</label>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                Balance: {buyCurrency === 'SOL' ? (solBalance !== null ? solBalance.toFixed(4) + ' SOL' : '—') : (usdcBalance !== null ? usdcBalance.toFixed(2) + ' USDC' : '—')}
                <button
                  type="button"
                  className="ml-1 px-2 py-0.5 rounded bg-gray-800 border border-gray-600 text-xs text-purple-400 hover:bg-gray-700 hover:text-purple-300 transition disabled:opacity-50"
                  style={{ fontSize: '0.7rem' }}
                  disabled={buyCurrency === 'SOL' ? !solBalance : !usdcBalance}
                  onClick={() => {
                    if (buyCurrency === 'SOL' && solBalance !== null) setBuyAmount(solBalance.toString());
                    if (buyCurrency === 'USDC' && usdcBalance !== null) setBuyAmount(usdcBalance.toString());
                  }}
                >
                  Max
                </button>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="cart-buy-amount"
                type="number"
                min={0}
                step={0.0001}
                value={buyAmount}
                onChange={e => setBuyAmount(e.target.value)}
                placeholder="Enter amount"
                className={`flex-1 px-3 py-2 rounded-lg bg-gray-800 text-white border ${amountError ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-purple-500'} focus:outline-none focus:ring-2 text-base font-semibold`}
              />
              <select
                value={buyCurrency}
                onChange={e => setBuyCurrency(e.target.value as 'SOL' | 'USDC')}
                className="px-2 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-base font-semibold"
              >
                <option value="SOL">SOL</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
            {amountError && (
              <div className="text-xs text-red-500 mt-1 text-left">{amountError}</div>
            )}
            <button
              className={`mt-2 w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 text-base shadow ${!isAmountValid() || !!amountError || isBuying ? 'opacity-50 cursor-not-allowed bg-gray-700 bg-none hover:from-purple-500 hover:to-blue-500' : 'hover:from-purple-600 hover:to-blue-600'}`}
              type="button"
              disabled={!isAmountValid() || !!amountError || isBuying}
              onClick={async () => {
                console.log('Buy button clicked', { cartItems, buyAmount, buyCurrency, publicKey });
                setIsBuying(true);
                setBuyResult(null);
                setSwapErrors({});
                try {
                  if (!publicKey) {
                    console.log('Early return: Wallet not connected');
                    throw new Error('Wallet not connected');
                  }
                  if (!signAllTransactions) {
                    console.log('Early return: signAllTransactions not available');
                    setBuyResult('Your wallet does not support batch signing. Please use Phantom or a compatible wallet.');
                    setIsBuying(false);
                    return;
                  }
                  const jupiter = new JupiterSwapService(connection);
                  // 1. Build all swap transactions (unsigned)
                  const unsignedTxs = [];
                  const tokenSymbols = [];
                  const invalids: { symbol: string; error: string }[] = [];
                  for (const item of cartItems) {
                    try {
                      if (item.weight <= 0) continue;
                      const totalAmount = parseFloat(buyAmount);
                      const buyAmountForToken = (item.weight / 100) * totalAmount;
                      // Always use input token decimals for smallest unit conversion
                      const inputDecimals = buyCurrency === 'SOL' ? 9 : 6;
                      const amountInSmallestUnit = Math.floor(buyAmountForToken * Math.pow(10, inputDecimals));
                      console.log('Allocating', buyAmountForToken, buyCurrency, '(' + amountInSmallestUnit + ' in smallest unit) for', item.token.symbol);
                      const inputMint = TOKEN_MINTS[buyCurrency as keyof typeof TOKEN_MINTS];
                      const outputMint = item.token.mint;
                      if (!inputMint || !outputMint) {
                        console.log('Early return: Unknown mint', { item });
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
                        console.log('Got quote for', item.token.symbol, quote);
                      } catch (err) {
                        console.error('Error getting quote for', item.token.symbol, err);
                        invalids.push({ symbol: item.token.symbol, error: `Error getting quote: ${err instanceof Error ? err.message : String(err)}` });
                        continue;
                      }
                      let bestRoute: any = null;
                      if (Array.isArray(quote.data) && quote.data.length > 0) {
                        bestRoute = quote.data[0];
                      } else if (quote && (quote as any).outAmount) {
                        bestRoute = quote;
                      }
                      console.log('Best route for', item.token.symbol, bestRoute);
                      if (!bestRoute || !bestRoute.outAmount || parseFloat(bestRoute.outAmount) === 0) {
                        console.log('Early return: No route for token', { item, quote });
                        invalids.push({ symbol: item.token.symbol, error: `No route for ${item.token.symbol}` });
                        continue;
                      }
                      let swapResponse;
                      try {
                        swapResponse = await jupiter.getSwapTransaction(
                          quote, // pass the full quote object
                          publicKey.toString(),
                          true,
                          true
                        );
                        console.log('Got swapResponse for', item.token.symbol, swapResponse);
                        if (!swapResponse || !swapResponse.swapTransaction) {
                          invalids.push({ symbol: item.token.symbol, error: `Swap not available for ${item.token.symbol}` });
                          continue;
                        }
                      } catch (err) {
                        console.error('Error getting swap transaction for', item.token.symbol, err);
                        invalids.push({ symbol: item.token.symbol, error: `Error getting swap transaction: ${err instanceof Error ? err.message : String(err)}` });
                        continue;
                      }
                      try {
                        const buf = Buffer.from(swapResponse.swapTransaction, 'base64');
                        const tx = VersionedTransaction.deserialize(buf);
                        unsignedTxs.push(tx);
                        tokenSymbols.push(item.token.symbol);
                        console.log('Built unsigned transaction for', item.token.symbol, tx);
                      } catch (err) {
                        console.error('Error deserializing transaction for', item.token.symbol, err);
                        invalids.push({ symbol: item.token.symbol, error: `Error deserializing transaction: ${err instanceof Error ? err.message : String(err)}` });
                        continue;
                      }
                    } catch (err) {
                      console.error('Unexpected error in swap loop for', item.token.symbol, err);
                      invalids.push({ symbol: item.token.symbol, error: `Unexpected error: ${err instanceof Error ? err.message : String(err)}` });
                      continue;
                    }
                  }
                  console.log('Unsigned transactions:', unsignedTxs);
                  console.log('signAllTransactions available:', typeof signAllTransactions === 'function');
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
                    console.log('Early return: No valid swap transactions could be built.');
                    setBuyResult('No valid swap transactions could be built.');
                    setIsBuying(false);
                    return;
                  }
                  // 2. Request signAllTransactions
                  console.log('Prompting wallet for batch signing:', unsignedTxs);
                  const signedTxs = await signAllTransactions(unsignedTxs);
                  // 3. Send each signed transaction
                  const completed = [];
                  const failed = [];
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
                  if (completed.length === 0) throw new Error('All swaps failed.');
                  setBuyResult('success');
                } catch (err: any) {
                  setBuyResult(err.message || 'Buy failed');
                } finally {
                  setIsBuying(false);
                }
              }}
            >
              {isBuying ? 'Buying...' : 'Buy Tokens'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default CartPopover; 