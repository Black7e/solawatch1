import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { getJupiterApiUrl, getTokenMints } from '../config/network';

interface SwapParams {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps: number;
}

interface JupiterQuoteResponse {
  data: Array<{
    inAmount: string;
    outAmount: string;
    priceImpactPct: number;
    marketInfos: Array<{
      id: string;
      label: string;
      inputMint: string;
      outputMint: string;
      notEnoughLiquidity: boolean;
      inAmount: string;
      outAmount: string;
      priceImpactPct: number;
      lpFee: {
        amount: string;
        mint: string;
        pct: number;
      };
      platformFee: {
        amount: string;
        mint: string;
        pct: number;
      };
    }>;
    otherAmountThreshold: string;
    swapMode: string;
    slippageBps: number;
    platformFee: null;
    mainnetOnly: boolean;
    prioritizationFeeLamports: number;
  }>;
  timeTaken: number;
}

interface JupiterSwapResponse {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports: number;
}

export class JupiterSwapService {
  private connection: Connection;
  private baseUrl: string;

  constructor(connection: Connection) {
    this.connection = connection;
    this.baseUrl = getJupiterApiUrl();
  }

  async getQuote(params: SwapParams): Promise<JupiterQuoteResponse> {
    const { inputMint, outputMint, amount, slippageBps } = params;
    
    const feeBps = 100; // 1%
    const feeAccount = 'ATMZV7kBh4ntquvW5vVbH6DCzgxdXTrs2MwgjF2TNy9h';

    console.log('Jupiter API request:', {
      inputMint,
      outputMint,
      amount,
      slippageBps,
      baseUrl: this.baseUrl,
      feeBps,
      feeAccount
    });
    
    const url = new URL(`${this.baseUrl}/quote`);
    url.searchParams.append('inputMint', inputMint);
    url.searchParams.append('outputMint', outputMint);
    url.searchParams.append('amount', amount.toString());
    url.searchParams.append('slippageBps', slippageBps.toString());
    url.searchParams.append('onlyDirectRoutes', 'false');
    url.searchParams.append('asLegacyTransaction', 'false');
    url.searchParams.append('maxAccounts', '64');
    url.searchParams.append('minimizeSlippage', 'true');
    url.searchParams.append('feeBps', feeBps.toString());
    url.searchParams.append('feeAccount', feeAccount);

    console.log('Jupiter quote URL:', url.toString());
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Jupiter API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('Jupiter API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      if (response.status === 400) {
        throw new Error('Invalid swap parameters. Please check the token addresses and amount.');
      } else if (response.status === 404) {
        throw new Error('No routes found for this token pair.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else {
        throw new Error(`Jupiter API error (${response.status}): ${errorText}`);
      }
    }

    const data = await response.json();
    console.log('Jupiter quote response:', data);
    
    return data;
  }

  async getSwapTransaction(
    quoteResponse: JupiterQuoteResponse,
    userPublicKey: string,
    wrapAndUnwrapSol: boolean = true,
    useSharedAccounts: boolean = true,
    feeAccount: string = 'ATMZV7kBh4ntquvW5vVbH6DCzgxdXTrs2MwgjF2TNy9h',
    trackingAccount?: string,
    prioritizationFeeLamports?: number
  ): Promise<JupiterSwapResponse> {
    const swapRequest = {
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol,
      useSharedAccounts,
      feeAccount,
      feeBps: 100, // 1%
      trackingAccount,
      prioritizationFeeLamports,
    };

    const response = await fetch(`${this.baseUrl}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(swapRequest),
    });

    if (!response.ok) {
      throw new Error(`Failed to get swap transaction: ${response.statusText}`);
    }

    return response.json();
  }

  async executeSwap(
    swapTransaction: string,
    wallet: any,
    connection: Connection
  ): Promise<string> {
    try {
      // Deserialize the transaction
      const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      // Sign the transaction
      const signedTransaction = await wallet.signTransaction(transaction);

      // Send the transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });

      // Confirm the transaction
      await connection.confirmTransaction(signature, 'confirmed');

      return signature;
    } catch (error) {
      console.error('Error executing swap:', error);
      throw error;
    }
  }
}

// Ultra API integration for simplified swaps
export class UltraSwapService {
  private baseUrl: string;

  constructor() {
    // Ultra API base URL (replace with the actual endpoint if different)
    this.baseUrl = 'https://quote-api.jup.ag/v6';
  }

  async getQuote(params: SwapParams): Promise<any> {
    const { inputMint, outputMint, amount, slippageBps } = params;
    const url = new URL(`${this.baseUrl}/quote`);
    url.searchParams.append('inputMint', inputMint);
    url.searchParams.append('outputMint', outputMint);
    url.searchParams.append('amount', amount.toString());
    url.searchParams.append('slippageBps', slippageBps.toString());
    url.searchParams.append('swapMode', 'ExactIn');
    url.searchParams.append('onlyDirectRoutes', 'false');
    url.searchParams.append('asLegacyTransaction', 'false');
    url.searchParams.append('maxAccounts', '64');
    url.searchParams.append('minimizeSlippage', 'true');
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Swap API quote error: ${response.statusText}`);
    }
    return response.json();
  }

  getBestRouteFromQuote(quote: any): any {
    if (quote && Array.isArray(quote.data) && quote.data.length > 0 && quote.data[0].marketInfos) {
      return quote.data[0];
    }
    return null;
  }

  async getSwapTransaction(route: any, userPublicKey: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route,
        userPublicKey,
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Swap API swap error: ${errorText}`);
    }
    return response.json();
  }

  async executeSwap(swapTransaction: string, wallet: any, connection: Connection): Promise<string> {
    try {
      const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      const signedTransaction = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });
      await connection.confirmTransaction(signature, 'confirmed');
      return signature;
    } catch (error) {
      console.error('Ultra API swap execution error:', error);
      throw error;
    }
  }

  // Ultra API: Get Order (swap transaction)
  async getUltraOrder({ inputMint, outputMint, amount, userPublicKey, slippageBps }: { inputMint: string, outputMint: string, amount: number, userPublicKey: string, slippageBps: number }) {
    const response = await fetch('https://quote-api.jup.ag/ultra/v1/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputMint,
        outputMint,
        amount,
        userPublicKey,
        slippageBps
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ultra API /order error: ${errorText}`);
    }
    return response.json();
  }
}

// Get token mints for current network
export const TOKEN_MINTS = getTokenMints();

export type TokenSymbol = keyof typeof TOKEN_MINTS;