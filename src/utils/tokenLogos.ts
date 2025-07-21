// Token logo utility functions
export const getTokenLogoUrl = (tokenName: string): string => {
  const normalizedName = tokenName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Common token name mappings
  const tokenMappings: { [key: string]: string } = {
    'sol': 'solana',
    'btc': 'bitcoin',
    'eth': 'ethereum',
    'usdc': 'usd-coin',
    'usdt': 'tether',
    'dai': 'dai',
    'weth': 'weth',
    'wbtc': 'wrapped-bitcoin',
    'matic': 'matic-network',
    'link': 'chainlink',
    'uni': 'uniswap',
    'aave': 'aave',
    'comp': 'compound-governance-token',
    'sushi': 'sushi',
    'crv': 'curve-dao-token',
    'yfi': 'yearn-finance',
    '1inch': '1inch',
    'bal': 'balancer',
    'snx': 'havven',
    'ren': 'republic-protocol',
    'zrx': '0x',
    'knc': 'kyber-network-crystal',
    'bnt': 'bancor',
    'mkr': 'maker',
    'rep': 'augur',
    'bat': 'basic-attention-token',
    'zec': 'zcash',
    'xmr': 'monero',
    'ltc': 'litecoin',
    'bch': 'bitcoin-cash',
    'ada': 'cardano',
    'dot': 'polkadot',
    'xrp': 'ripple',
    'trx': 'tron',
    'eos': 'eos',
    'neo': 'neo',
    'vet': 'vechain',
    'icp': 'internet-computer',
    'fil': 'filecoin',
    'atom': 'cosmos',
    'algo': 'algorand',
    'avax': 'avalanche-2',
    'near': 'near',
    'ftm': 'fantom',
    'hbar': 'hedera-hashgraph',
    'sand': 'the-sandbox',
    'mana': 'decentraland',
    'enj': 'enjincoin',
    'axs': 'axie-infinity',
    'gala': 'gala',
    'chz': 'chiliz',
    'hot': 'holochain',
    'theta': 'theta-token',
    'xtz': 'tezos',
    'xlm': 'stellar',
    'dash': 'dash',
    'etc': 'ethereum-classic',
    'xem': 'nem',
    'waves': 'waves',
    'qtum': 'qtum',
    'omg': 'omisego',
    'zil': 'zilliqa',
    'ont': 'ontology',
    'iost': 'iostoken',
    'nano': 'nano',
    'btt': 'bittorrent',
    'win': 'wink',
    'cake': 'pancakeswap-token',
    'bnb': 'binancecoin',
    'busd': 'binance-usd',
  };

  // Try to get the mapped name
  const mappedName = tokenMappings[normalizedName] || normalizedName;
  
  // Return CoinGecko URL (most reliable)
  return `https://api.coingecko.com/api/v3/coins/${mappedName}/image`;
};

export const getTokenLogoFallbackUrl = (tokenName: string): string => {
  const normalizedName = tokenName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Try GitHub cryptocurrency icons first
  return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${normalizedName}.png`;
};

export const getTokenLogoWithFallbacks = (tokenName: string): {
  primaryUrl: string;
  fallbackUrl: string;
} => {
  return {
    primaryUrl: getTokenLogoUrl(tokenName),
    fallbackUrl: getTokenLogoFallbackUrl(tokenName)
  };
}; 