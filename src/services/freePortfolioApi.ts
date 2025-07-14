import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getAllRpcEndpoints, getSolPrice, isTestnet } from '../config/network';

export interface TokenHolding {
  symbol: string;
  name: string;
  amount: number;
  value: number;
  price: number;
  change24h: number;
  logo?: string;
  mint: string;
}

export interface PortfolioData {
  totalValue: number;
  change24h: number;
  change24hPercent: number;
  tokens: TokenHolding[];
  nftCount: number;
  lastActivity: string;
}

// Well-known token metadata
const WELL_KNOWN_TOKENS: Record<string, { symbol: string; name: string; decimals: number; logoURI?: string }> = {
  'So11111111111111111111111111111111111111112': {
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    logoURI: 'https://cryptologos.cc/logos/solana-sol-logo.png'
  },
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': {
    symbol: 'JUP',
    name: 'Jupiter',
    decimals: 6,
    logoURI: 'https://station.jup.ag/favicon.ico'
  },
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': {
    symbol: 'BONK',
    name: 'Bonk',
    decimals: 5,
    logoURI: 'https://bafkreifdq6f5dpfvlg6l6kzf4q3lnbewjdlq6l6kzf4q3lnbewjdlq6l6k.ipfs.nftstorage.link/'
  },
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': {
    symbol: 'RAY',
    name: 'Raydium',
    decimals: 6,
    logoURI: 'https://img.raydium.io/icon/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R.png'
  },
  'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE': {
    symbol: 'ORCA',
    name: 'Orca',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE/logo.png'
  },
  'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac': {
    symbol: 'MNGO',
    name: 'Mango',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac/logo.png'
  },
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoURI: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
  },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    logoURI: 'https://cryptologos.cc/logos/tether-usdt-logo.png'
  },
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': {
    symbol: 'mSOL',
    name: 'Marinade staked SOL',
    decimals: 9,
    logoURI: 'https://storage.googleapis.com/marinade-static-assets/icons/mSOL.png'
  },
  '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj': {
    symbol: 'stSOL',
    name: 'Lido Staked SOL',
    decimals: 9,
    logoURI: 'https://assets.coingecko.com/coins/images/18369/large/logo_-_2021-09-15T100934.765.png'
  },
  'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk': {
    symbol: 'WEN',
    name: 'Wen',
    decimals: 5,
    logoURI: 'https://bafkreifryvyui4gshimmxl26uec3ol3kummjnuljb34vt7gl7cgml3hnrq.ipfs.nftstorage.link/'
  },
  'A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6': {
    symbol: 'WIF',
    name: 'dogwifhat',
    decimals: 6,
    logoURI: 'https://bafkreibk3covs5ltyqxa272oieh7kqzle5ym4t7qhqpkcd7ywmvhp4d6h4.ipfs.nftstorage.link/'
  },
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3': {
    symbol: 'PYTH',
    name: 'Pyth Network',
    decimals: 6,
    logoURI: 'https://cryptologos.cc/logos/pyth-network-pyth-logo.png'
  },
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': {
    symbol: 'jitoSOL',
    name: 'Jito Staked SOL',
    decimals: 9,
    logoURI: 'https://assets.coingecko.com/coins/images/32617/large/jitosol.png'
  },
  '5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm': {
    symbol: 'INF',
    name: 'Infinity',
    decimals: 8,
    logoURI: 'https://arweave.net/MPfHZi2eKd4n8w4Zr6WyoWq4_aNjLJOjKZw8YfVQrPk/'
  },
  'Comp4ssDzXcLeu2MnLuGNNFC4cmLPMng8qWHPvzAMU1h': {
    symbol: 'COMP',
    name: 'Compound',
    decimals: 8,
    logoURI: 'https://cryptologos.cc/logos/compound-comp-logo.png'
  },
  // Add more popular tokens
  '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump': {
    symbol: 'FARTCOIN',
    name: 'Fartcoin',
    decimals: 6,
    logoURI: 'https://pump.fun/_next/image?url=https%3A%2F%2Fipfs.io%2Fipfs%2FQmVJKKQUqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq&w=256&q=75'
  },
  'CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump': {
    symbol: 'GOAT',
    name: 'Goatseus Maximus',
    decimals: 6,
    logoURI: 'https://pump.fun/_next/image?url=https%3A%2F%2Fipfs.io%2Fipfs%2FQmGoatGoatGoatGoatGoatGoatGoatGoatGoatGoatGoat&w=256&q=75'
  },
  'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82': {
    symbol: 'BOME',
    name: 'Book of Meme',
    decimals: 6,
    logoURI: 'https://arweave.net/YcjCREYjao7lUu6UuoXzB9VLy7AtRxCXBvASucrXXjI'
  },
  'SHDWyBxihqiCj6YekG2GUr7wqKLeLAMK1gHZck9pL6y': {
    symbol: 'SHDW',
    name: 'Shadow Token',
    decimals: 9,
    logoURI: 'https://assets.coingecko.com/coins/images/19706/large/GenesysGo.png'
  },
  'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1': {
    symbol: 'bSOL',
    name: 'BlazeStake Staked SOL',
    decimals: 9,
    logoURI: 'https://assets.coingecko.com/coins/images/26129/large/blazestake.png'
  },
  'Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1': {
    symbol: 'SBR',
    name: 'Saber',
    decimals: 6,
    logoURI: 'https://assets.coingecko.com/coins/images/17676/large/Saber-logo-250.png'
  },
  'kinXdEcpDQeHPEuQnqmUgtYykqKGVFq6CeVX5iAHJq6': {
    symbol: 'KIN',
    name: 'Kin',
    decimals: 5,
    logoURI: 'https://cryptologos.cc/logos/kin-kin-logo.png'
  },
  'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt': {
    symbol: 'SRM',
    name: 'Serum',
    decimals: 6,
    logoURI: 'https://cryptologos.cc/logos/serum-srm-logo.png'
  },
  'USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkRJTgkX': {
    symbol: 'USDH',
    name: 'USDH',
    decimals: 6,
    logoURI: 'https://assets.coingecko.com/coins/images/25969/large/usdh.png'
  }
};

export class FreePortfolioService {
  private connection: Connection;
  private fallbackEndpoints: string[];
  private tokenMetadataCache: Map<string, any> = new Map();
  private tokenRegistryCache: any[] = [];
  private registryCacheExpiry: number = 0;

  constructor(connection: Connection) {
    this.connection = connection;
    // Use network-aware RPC endpoints
    this.fallbackEndpoints = getAllRpcEndpoints();
    
    console.log('Configured fallback endpoints:', this.fallbackEndpoints);
  }

  private async tryWithFallback<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      console.warn('Primary RPC failed, trying fallback endpoints...', error.message);
        
      for (const endpoint of this.fallbackEndpoints) {
        try {
          console.log(`Trying fallback RPC endpoint: ${endpoint}`);
          const fallbackConnection = new Connection(endpoint, 'confirmed');
          const originalConnection = this.connection;
          this.connection = fallbackConnection;
          
          const result = await operation();
          
          console.log(`Success with fallback endpoint: ${endpoint}`);
          // Restore original connection
          this.connection = originalConnection;
          return result;
        } catch (fallbackError) {
          console.warn(`Fallback endpoint ${endpoint} failed:`, fallbackError instanceof Error ? fallbackError.message : fallbackError);
          continue;
        }
      }
      
      console.error('All fallback endpoints failed');
      throw error;
    }
  }

  async getPortfolioData(walletAddress: string): Promise<PortfolioData> {
    try {
      console.log(`Starting portfolio analysis for ${walletAddress} on ${isTestnet() ? 'testnet' : 'mainnet'}`);
      
      let publicKey: PublicKey;
      try {
        publicKey = new PublicKey(walletAddress);
      } catch (error) {
        throw new Error('Invalid wallet address format. Please enter a valid Solana wallet address.');
      }
      
      // Get SOL balance with fallback support
      let solBalance = 0;
      try {
        console.log('Fetching SOL balance...');
        solBalance = await this.tryWithFallback(async () => {
          return await this.connection.getBalance(publicKey);
        });
        console.log(`SOL balance: ${solBalance / LAMPORTS_PER_SOL} SOL`);
      } catch (error) {
        console.warn('Failed to get SOL balance:', error);
        // Continue without SOL balance
      }
      const solBalanceInSol = solBalance / LAMPORTS_PER_SOL;

      // Get token accounts with fallback support
      let tokenAccounts: any = { value: [] };
      try {
        console.log('Fetching token accounts...');
        tokenAccounts = await this.tryWithFallback(async () => {
          return await this.connection.getParsedTokenAccountsByOwner(
            publicKey,
            { programId: TOKEN_PROGRAM_ID }
          );
        });
        console.log(`Found ${tokenAccounts.value.length} token accounts`);
      } catch (error) {
        console.warn('Failed to get token accounts:', error);
        // Continue with empty token accounts
      }

      // Filter out tokens with zero balance and get unique mints
      const validTokens = tokenAccounts.value
        .map(account => {
          const info = account.account.data.parsed.info;
          return {
            mint: info.mint,
            amount: info.tokenAmount.uiAmount || 0,
            decimals: info.tokenAmount.decimals
          };
        })
        .filter(token => token.amount > 0);

      console.log(`Valid tokens: ${validTokens.length}`);

      // Get all unique token mints for price fetching
      const tokenMints = validTokens.map(token => token.mint);
      
      // Add SOL to the list for price fetching
      const solMint = 'So11111111111111111111111111111111111111112';
      const allMints = [solMint, ...tokenMints];

      // Get prices and metadata concurrently
      let prices: Record<string, number> = {};
      let metadataMap: Map<string, any> = new Map();
      
      try {
        console.log('Fetching prices and metadata...');
        [prices, metadataMap] = await Promise.all([
          this.getTokenPrices(allMints),
          this.getTokenMetadataMap(tokenMints)
        ]);
        console.log(`Got prices for ${Object.keys(prices).length} tokens`);
      } catch (error) {
        console.warn('Failed to get prices and metadata:', error);
        // Continue with empty data
      }
      
      // Get SOL price from CoinGecko as fallback
      const solPrice = prices[solMint] || getSolPrice();

      const tokens: TokenHolding[] = [];

      // Add SOL if balance > 0
      if (solBalanceInSol > 0) {
        tokens.push({
          symbol: 'SOL',
          name: 'Solana',
          amount: solBalanceInSol,
          value: solBalanceInSol * solPrice,
          price: solPrice,
          change24h: 0, // We don't have 24h change data from free APIs
          logo: WELL_KNOWN_TOKENS[solMint]?.logoURI,
          mint: solMint
        });
      }

      // Add other tokens
      for (const token of validTokens) {
        const metadata = metadataMap.get(token.mint) || WELL_KNOWN_TOKENS[token.mint];
        const price = prices[token.mint] || 0;
        const value = token.amount * price;

        if (token.amount > 0) {
          tokens.push({
            symbol: metadata?.symbol || `TOKEN-${token.mint.slice(0, 4)}`,
            name: metadata?.name || `Token ${token.mint.slice(0, 8)}...${token.mint.slice(-4)}`,
            amount: token.amount,
            value,
            price,
            change24h: 0, // We don't have 24h change data from free APIs
            logo: metadata?.logoURI || metadata?.image,
            mint: token.mint
          });
        }
      }

      // Sort tokens by value (highest first)
      tokens.sort((a, b) => b.value - a.value);

      // Calculate total portfolio value
      const totalValue = tokens.reduce((sum, token) => sum + token.value, 0);

      console.log(`Portfolio analysis complete. Total value: $${totalValue}, Tokens: ${tokens.length}`);

      // If no tokens found, create a minimal response
      if (tokens.length === 0) {
        return {
          totalValue: 0,
          change24h: 0,
          change24hPercent: 0,
          lastActivity: 'No recent activity',
          nftCount: 0,
          tokens: []
        };
      }

      return {
        totalValue,
        change24h: 0, // We don't have historical data for 24h change
        change24hPercent: 0,
        lastActivity: 'Recently', // We don't have last activity data from free APIs
        nftCount: 0, // We're not fetching NFT data in this implementation
        tokens
      };

    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      
      // Always provide a meaningful error message
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Invalid wallet address')) {
          throw error; // Re-throw validation errors as-is
        } else if (error.message.includes('403')) {
          throw new Error(`Access forbidden: ${error.message}\n\nThis may be due to rate limiting or API restrictions. Please try again in a few minutes.`);
        } else if (error.message.includes('429')) {
          throw new Error(`Rate limit exceeded: ${error.message}\n\nPlease wait a moment and try again.`);
        } else if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
          throw new Error(`Network connection failed: ${error.message}\n\nPlease check your internet connection and try again.`);
        } else {
          throw new Error(`Portfolio analysis failed: ${error.message}\n\nPlease try again or contact support if the issue persists.`);
        }
      } else {
        throw new Error('An unknown error occurred while fetching portfolio data. Please try again.');
      }
    }
  }

  // Enhanced method to get metadata for multiple tokens concurrently
  private async getTokenMetadataMap(tokenMints: string[]): Promise<Map<string, any>> {
    const metadataMap = new Map<string, any>();
    
    if (tokenMints.length === 0) {
      return metadataMap;
    }

    // Check cache first
    const uncachedMints = tokenMints.filter(mint => !this.tokenMetadataCache.has(mint));
    
    // Return cached data for already fetched tokens
    tokenMints.forEach(mint => {
      if (this.tokenMetadataCache.has(mint)) {
        metadataMap.set(mint, this.tokenMetadataCache.get(mint));
      }
    });

    if (uncachedMints.length === 0) {
      return metadataMap;
    }

    // Load token registry if not cached or expired
    await this.loadTokenRegistry();

    // Fetch metadata for uncached tokens in parallel (limited concurrency)
    const batchSize = 5; // Process 5 tokens at a time to avoid rate limits
    for (let i = 0; i < uncachedMints.length; i += batchSize) {
      const batch = uncachedMints.slice(i, i + batchSize);
      const batchPromises = batch.map(async (mint) => {
        try {
          const metadata = await this.getTokenMetadata(mint);
          if (metadata) {
            this.tokenMetadataCache.set(mint, metadata);
            metadataMap.set(mint, metadata);
          }
        } catch (error) {
          console.warn(`Failed to fetch metadata for ${mint}:`, error);
        }
      });
      
      try {
        await Promise.all(batchPromises);
      } catch (error) {
        console.warn('Batch metadata fetch failed:', error);
      }
      
      // Small delay between batches to be respectful to APIs
      if (i + batchSize < uncachedMints.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return metadataMap;
  }

  private async loadTokenRegistry(): Promise<void> {
    // Cache for 1 hour
    if (this.tokenRegistryCache.length > 0 && Date.now() < this.registryCacheExpiry) {
      return;
    }

    const registries = [
      'https://tokens.jup.ag/tokens?tags=verified', // Jupiter verified tokens first
      'https://token.jup.ag/all', // All Jupiter tokens
      'https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json',
      'https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json'
    ];

    for (const registryUrl of registries) {
      try {
        const response = await fetch(registryUrl, {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          console.warn(`Registry ${registryUrl} returned ${response.status}`);
          continue;
        }
        
        const data = await response.json();
        
        // Handle different registry formats
        if (Array.isArray(data)) {
          this.tokenRegistryCache = data;
        } else if (data.tokens && Array.isArray(data.tokens)) {
          this.tokenRegistryCache = data.tokens;
        }
        
        if (this.tokenRegistryCache.length > 0) {
          this.registryCacheExpiry = Date.now() + (60 * 60 * 1000); // 1 hour
          console.log(`Loaded ${this.tokenRegistryCache.length} tokens from registry`);
          break;
        }
      } catch (error) {
        console.warn(`Failed to load registry ${registryUrl}:`, error);
        continue;
      }
    }
    
    if (this.tokenRegistryCache.length === 0) {
      console.warn('Failed to load any token registry, using well-known tokens only');
    }
  }

  // Enhanced method to get token logo from multiple sources
  private async getTokenLogo(mint: string, symbol?: string): Promise<string | undefined> {
    // Try multiple logo sources in order of preference
    const logoSources = [
      // Jupiter token list
      `https://img.jup.ag/tokens/${mint}.png`,
      // Solana token list
      `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${mint}/logo.png`,
      // CoinGecko API (requires symbol)
      symbol ? `https://assets.coingecko.com/coins/images/search?query=${symbol.toLowerCase()}` : null,
      // Raydium token list
      `https://img.raydium.io/icon/${mint}.png`,
      // Orca token list
      `https://www.orca.so/static/media/token.png`,
      // Generic crypto logos
      symbol ? `https://cryptologos.cc/logos/${symbol.toLowerCase()}-${symbol.toLowerCase()}-logo.png` : null,
      // Fallback to a generic token icon
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/generic.png'
    ].filter(Boolean) as string[];

    for (const logoUrl of logoSources) {
      try {
        const response = await fetch(logoUrl, { method: 'HEAD' });
        if (response.ok) {
          return logoUrl;
        }
      } catch (error) {
        // Continue to next source
        continue;
      }
    }

    return undefined;
  }

  private async getTokenPrices(tokenMints: string[]): Promise<Record<string, number>> {
    try {
      if (tokenMints.length === 0) {
        return {};
      }
      
      const prices: Record<string, number> = {};
      
      // Try price sources sequentially to avoid overwhelming APIs
      const priceSources = [
        () => this.getTokenPricesFromJupiter(tokenMints),
        () => this.getTokenPricesFromCoinGecko(tokenMints),
        () => this.getTokenPricesFromDexScreener(tokenMints)
      ];
      
      for (const getPrice of priceSources) {
        try {
          const result = await getPrice();
          Object.entries(result).forEach(([mint, price]) => {
            if (price > 0 && (!prices[mint] || prices[mint] === 0)) {
              prices[mint] = price;
            }
          });
          
          // If we got prices for most tokens, we can stop
          const priceCount = Object.keys(prices).length;
          if (priceCount >= tokenMints.length * 0.7) {
            break;
          }
        } catch (error) {
          console.warn('Price source failed:', error);
          continue;
        }
      }
      
      return prices;
      
    } catch (error) {
      console.error('Error fetching token prices:', error);
      return {};
    }
  }

  private async getTokenPricesFromJupiter(tokenMints: string[]): Promise<Record<string, number>> {
    try {
      const response = await fetch(
        `https://price.jup.ag/v4/price?ids=${tokenMints.join(',')}`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const prices: Record<string, number> = {};
        
        if (data && data.data) {
          Object.entries(data.data).forEach(([mint, priceData]: [string, any]) => {
            prices[mint] = priceData.price || 0;
          });
        }
        
        return prices;
      }
      
      return {};
      
    } catch (error) {
      console.error('Error fetching prices from Jupiter:', error);
      return {};
    }
  }

  private async getTokenPricesFromDexScreener(tokenMints: string[]): Promise<Record<string, number>> {
    try {
      const prices: Record<string, number> = {};
      
      // DexScreener API - good for meme coins and new tokens
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${tokenMints.join(',')}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.pairs) {
          data.pairs.forEach((pair: any) => {
            if (pair.baseToken && tokenMints.includes(pair.baseToken.address)) {
              const price = parseFloat(pair.priceUsd);
              if (price > 0) {
                prices[pair.baseToken.address] = price;
              }
            }
            if (pair.quoteToken && tokenMints.includes(pair.quoteToken.address)) {
              const price = parseFloat(pair.priceUsd);
              if (price > 0) {
                prices[pair.quoteToken.address] = price;
              }
            }
          });
        }
      }
      
      return prices;
    } catch (error) {
      console.error('Error fetching prices from DexScreener:', error);
      return {};
    }
  }

  private async getTokenPricesFromBirdeye(tokenMints: string[]): Promise<Record<string, number>> {
    try {
      const prices: Record<string, number> = {};
      
      // Birdeye API - good for Solana ecosystem tokens
      for (const mint of tokenMints) {
        try {
          const response = await fetch(
            `https://public-api.birdeye.so/public/price?address=${mint}`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.data && data.data.value) {
              prices[mint] = data.data.value;
            }
          }
        } catch (error) {
          // Continue with other tokens
          continue;
        }
      }
      
      return prices;
    } catch (error) {
      console.error('Error fetching prices from Birdeye:', error);
      return {};
    }
  }

  private async getSolPrice(): Promise<number> {
    try {
      // CoinGecko API for SOL price (free, no API key required)
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch SOL price');
      }
      
      const data = await response.json();
      return data.solana?.usd || getSolPrice();
    } catch (error) {
      console.error('Error fetching SOL price:', error);
      return getSolPrice();
    }
  }

  private async getTokenPricesFromCoinGecko(tokenMints: string[]): Promise<Record<string, number>> {
    try {
      const prices: Record<string, number> = {};
      
      // Map of token mints to CoinGecko IDs
      const coinGeckoIds: Record<string, string> = {
        'So11111111111111111111111111111111111111112': 'solana',
        'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 'jupiter-exchange-solana',
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'bonk',
        '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': 'raydium',
        'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE': 'orca',
        'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac': 'mango-markets',
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'usd-coin',
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'tether',
        'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'msol',
        '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj': 'lido-staked-sol',
        'A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6': 'dogwifcoin',
        'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3': 'pyth-network',
        'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': 'jito-staked-sol',
        'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82': 'book-of-meme'
      };
      
      // Get CoinGecko IDs for the tokens we have
      const validIds = tokenMints
        .map(mint => coinGeckoIds[mint])
        .filter(Boolean);
      
      if (validIds.length === 0) {
        return prices;
      }
      
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${validIds.join(',')}&vs_currencies=usd`
      );
      
      if (!response.ok) {
        throw new Error('CoinGecko API failed');
      }
      
      const data = await response.json();
      
      // Map back to token mints
      tokenMints.forEach(mint => {
        const coinGeckoId = coinGeckoIds[mint];
        if (coinGeckoId && data[coinGeckoId]?.usd) {
          prices[mint] = data[coinGeckoId].usd;
        }
      });
      
      return prices;
    } catch (error) {
      console.error('Error fetching prices from CoinGecko:', error);
      return {};
    }
  }

  // Enhanced method to get real-time price for a specific token
  private async getTokenPriceRealtime(mint: string): Promise<number> {
    // Try multiple sources for a single token to get the most accurate price
    const priceSources = [
      () => this.getTokenPricesFromJupiter([mint]).then(prices => prices[mint] || 0),
      () => this.getTokenPricesFromDexScreener([mint]).then(prices => prices[mint] || 0),
      () => this.getTokenPricesFromBirdeye([mint]).then(prices => prices[mint] || 0),
      () => this.getTokenPricesFromCoinGecko([mint]).then(prices => prices[mint] || 0)
    ];

    for (const getPrice of priceSources) {
      try {
        const price = await getPrice();
        if (price > 0) {
          return price;
        }
      } catch (error) {
        continue;
      }
    }

    return 0;
  }

  // Enhanced token metadata fetching using multiple free sources
  async getTokenMetadata(mint: string): Promise<any> {
    try {
      // Check if we already have metadata for this token
      if (WELL_KNOWN_TOKENS[mint]) {
        return WELL_KNOWN_TOKENS[mint];
      }

      // Check token registry cache
      if (this.tokenRegistryCache.length > 0) {
        const registryToken = this.tokenRegistryCache.find((token: any) => 
          token.address === mint || token.mint === mint
        );
        
        if (registryToken) {
          // Use registry logo or try to get a better one
          let logoUrl = registryToken.logoURI || registryToken.image;
          
          // If no logo in registry, try to fetch one
          if (!logoUrl) {
            logoUrl = await this.getTokenLogo(mint, registryToken.symbol);
          }
          
          return {
            symbol: registryToken.symbol,
            name: registryToken.name,
            decimals: registryToken.decimals,
            logoURI: logoUrl,
            source: 'registry'
          };
        }
      }

      // Try multiple metadata sources in sequence (to avoid rate limits)
      const metadataPromises = [
        () => this.getMetadataFromJupiter(mint),
        () => this.getMetadataFromDexScreener(mint),
        () => this.getMetadataFromSolscan(mint),
        () => this.getMetadataFromBirdEye(mint),
        () => this.getMetadataFromSolanaFM(mint)
      ];

      // Try each source sequentially until we get a result
      for (const getMetadata of metadataPromises) {
        try {
          const result = await getMetadata();
          if (result && result.symbol && result.symbol !== 'UNKNOWN') {
            // Enhance with logo if missing
            if (!result.logoURI) {
              result.logoURI = await this.getTokenLogo(mint, result.symbol);
            }
            return result;
          }
        } catch (error) {
          // Continue to next source
          continue;
        }
      }

      // Try to get basic info from mint account
      try {
        const mintInfo = await this.connection.getParsedAccountInfo(new PublicKey(mint));
        if (mintInfo.value?.data && 'parsed' in mintInfo.value.data) {
          const parsedData = mintInfo.value.data.parsed;
          if (parsedData.type === 'mint') {
            const symbol = `TOKEN-${mint.slice(0, 4)}`;
            const logoUrl = await this.getTokenLogo(mint, symbol);
            
            return {
              symbol,
              name: `Token ${mint.slice(0, 8)}...${mint.slice(-4)}`,
              decimals: parsedData.info.decimals,
              logoURI: logoUrl,
              source: 'on-chain'
            };
          }
        }
      } catch (onChainError) {
        console.warn('Failed to get mint account info:', onChainError);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      return null;
    }
  }

  private async getMetadataFromJupiter(mint: string): Promise<any> {
    try {
      // Try multiple Jupiter endpoints
      const endpoints = [
        `https://tokens.jup.ag/token/${mint}`,
        `https://token.jup.ag/token/${mint}`,
        `https://api.jup.ag/tokens/${mint}`
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            headers: {
              'Accept': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.symbol) {
              return {
                symbol: data.symbol,
                name: data.name || data.symbol,
                decimals: data.decimals || 6,
                logoURI: data.logoURI || `https://img.jup.ag/tokens/${mint}.png`,
                source: 'jupiter'
              };
            }
          }
        } catch (endpointError) {
          continue;
        }
      }
      
      // Try the Jupiter token list search
      const searchResponse = await fetch(`https://tokens.jup.ag/tokens?search=${mint}`);
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data) && data.length > 0) {
          const token = data[0];
          return {
            symbol: token.symbol,
            name: token.name || token.symbol,
            decimals: token.decimals || 6,
            logoURI: token.logoURI || `https://img.jup.ag/tokens/${mint}.png`,
            source: 'jupiter'
          };
        }
      }
    } catch (error) {
      console.warn('Jupiter token API failed:', error);
    }
    return null;
  }

  private async getMetadataFromSolscan(mint: string): Promise<any> {
    try {
      const response = await fetch(`https://public-api.solscan.io/token/meta?tokenAddress=${mint}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.symbol) {
          return {
            symbol: data.symbol,
            name: data.name || data.symbol,
            decimals: data.decimals || 6,
            logoURI: data.icon || await this.getTokenLogo(mint, data.symbol),
            source: 'solscan'
          };
        }
      }
    } catch (error) {
      console.warn('Solscan API failed:', error);
    }
    return null;
  }

  private async getMetadataFromSolanaFM(mint: string): Promise<any> {
    try {
      const response = await fetch(`https://api.solana.fm/v1/tokens/${mint}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.tokenList) {
          return {
            symbol: data.tokenList.symbol,
            name: data.tokenList.name || data.tokenList.symbol,
            decimals: data.tokenList.decimals || 6,
            logoURI: data.tokenList.image || await this.getTokenLogo(mint, data.tokenList.symbol),
            source: 'solana.fm'
          };
        }
      }
    } catch (error) {
      console.warn('Solana.fm API failed:', error);
    }
    return null;
  }

  private async getMetadataFromDexScreener(mint: string): Promise<any> {
    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.pairs && data.pairs.length > 0) {
          const pair = data.pairs[0];
          const token = pair.baseToken.address === mint ? pair.baseToken : pair.quoteToken;
          
          if (token) {
            return {
              symbol: token.symbol,
              name: token.name || token.symbol,
              decimals: 6, // DexScreener doesn't provide decimals
              logoURI: token.logoURI || await this.getTokenLogo(mint, token.symbol),
              source: 'dexscreener'
            };
          }
        }
      }
    } catch (error) {
      console.warn('DexScreener API failed:', error);
    }
    return null;
  }

  private async getMetadataFromBirdEye(mint: string): Promise<any> {
    try {
      const response = await fetch(`https://public-api.birdeye.so/public/tokenlist?offset=0&limit=1&sort_by=v24hUSD&sort_type=desc&address=${mint}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.data && data.data.tokens && data.data.tokens.length > 0) {
          const token = data.data.tokens[0];
          return {
            symbol: token.symbol,
            name: token.name || token.symbol,
            decimals: token.decimals || 6,
            logoURI: token.logoURI || await this.getTokenLogo(mint, token.symbol),
            source: 'birdeye'
          };
        }
      }
    } catch (error) {
      console.warn('Birdeye API failed:', error);
    }
    return null;
  }
}