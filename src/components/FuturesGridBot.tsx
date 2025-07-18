import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, X, Trash2, Info, ArrowLeftRight, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HyperliquidGridBotService, GridBotConfig } from '../services/hyperliquidGridBotApi';

interface MarketData {
  symbol: string;
  currentPrice: number;
  minPrice: number;
  maxPrice: number;
  tickSize: number;
  minOrderSize: number;
  maxLeverage: number;
}

export default function FuturesGridBot() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<GridBotConfig>({
    symbol: 'BTC',
    priceRange: { lower: 116795.3, upper: 130848 },
    gridCount: 30,
    gridType: 'arithmetic',
    investment: 959.70,
    leverage: 5,
    marginMode: 'cross',
    advanced: {
      trailingUp: false,
      trailingDown: false,
      gridTrigger: false,
      takeProfitStopLoss: false,
      closeAllOnStop: true,
    }
  });

  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [profitPerGrid, setProfitPerGrid] = useState({ min: 0.31, max: 0.36 });

  // Available symbols for grid trading
  const availableSymbols = [
    'BTC', 'ETH', 'SOL', 'MATIC', 'AVAX', 'LINK', 'UNI', 'AAVE', 
    'CRV', 'SUSHI', 'COMP', 'YFI', 'SNX', 'BAL', 'REN'
  ];

  const service = new HyperliquidGridBotService();

  // Fetch market data for selected symbol
  useEffect(() => {
    fetchMarketData(selectedSymbol);
    setConfig(prev => ({ ...prev, symbol: selectedSymbol }));
  }, [selectedSymbol]);

  // Calculate profit per grid when config changes
  useEffect(() => {
    const profit = service.calculateProfitPerGrid(config);
    setProfitPerGrid(profit);
  }, [config.priceRange, config.gridCount, config.gridType]);

  const fetchMarketData = async (symbol: string) => {
    try {
      setLoading(true);
      // Simulate API call to Hyperliquid for market data
      const response = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'meta' })
      });

      if (response.ok) {
        const data = await response.json();
        // Extract market data for the selected symbol
        const symbolData = data.meta?.universe?.find((m: any) => m.name === symbol);
        
        if (symbolData) {
          setMarketData({
            symbol,
            currentPrice: parseFloat(symbolData.markPrice || 50000),
            minPrice: parseFloat(symbolData.markPrice || 50000) * 0.8,
            maxPrice: parseFloat(symbolData.markPrice || 50000) * 1.2,
            tickSize: 0.1,
            minOrderSize: 0.001,
            maxLeverage: 50
          });
        } else {
          // Fallback data
          setMarketData({
            symbol,
            currentPrice: 50000,
            minPrice: 40000,
            maxPrice: 60000,
            tickSize: 0.1,
            minOrderSize: 0.001,
            maxLeverage: 50
          });
        }
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
      // Fallback data
      setMarketData({
        symbol,
        currentPrice: 50000,
        minPrice: 40000,
        maxPrice: 60000,
        tickSize: 0.1,
        minOrderSize: 0.001,
        maxLeverage: 50
      });
    } finally {
      setLoading(false);
    }
  };



  const calculateLiquidationPrice = (side: 'long' | 'short') => {
    const { lower, upper } = config.priceRange;
    const avgPrice = (lower + upper) / 2;
    
    if (side === 'long') {
      return avgPrice * (1 - 1 / config.leverage);
    } else {
      return avgPrice * (1 + 1 / config.leverage);
    }
  };

  const handleCreateBot = async () => {
    try {
      setLoading(true);
      
      // Validate configuration
      const requiredInvestment = service.calculateRequiredMargin(config);
      if (config.investment < requiredInvestment) {
        alert(`Minimum investment required: ${requiredInvestment.toFixed(2)} USDT`);
        return;
      }

      console.log('Creating grid bot with config:', config);

      // Create grid bot using the service
      const result = await service.createGridBot(config);

      if (result.success) {
        alert(result.message);
        navigate('/perpetuals'); // Navigate back to perpetuals page
      } else {
        alert(result.message);
      }
      
    } catch (error) {
      console.error('Error creating grid bot:', error);
      alert('Failed to create grid bot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearPriceRange = () => {
    setConfig(prev => ({
      ...prev,
      priceRange: { lower: 0, upper: 0 }
    }));
  };

  const setCurrentPriceRange = () => {
    if (marketData) {
      const currentPrice = marketData.currentPrice;
      const range = currentPrice * 0.1; // 10% range
      setConfig(prev => ({
        ...prev,
        priceRange: {
          lower: currentPrice - range,
          upper: currentPrice + range
        }
      }));
    }
  };

  return (
    <div className="min-h-screen bg-x-bg text-white">
      {/* Header */}
      <div className="bg-x-bg-secondary border-b border-x-border p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/perpetuals')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeftRight className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-semibold">Futures Grid</h1>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex items-center space-x-2">
            <button className="text-gray-400 hover:text-white">
              <Settings className="w-4 h-4" />
            </button>
            <button className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Symbol Selection */}
        <div className="bg-x-bg-secondary rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Trading Pair
          </label>
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="w-full bg-x-bg border border-x-border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {availableSymbols.map(symbol => (
              <option key={symbol} value={symbol}>{symbol}/USDT</option>
            ))}
          </select>
          {marketData && (
            <p className="text-xs text-gray-400 mt-1">
              Current Price: ${marketData.currentPrice.toLocaleString()}
            </p>
          )}
        </div>

        {/* Price Range */}
        <div className="bg-x-bg-secondary rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-300">Price Range</label>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearPriceRange}
                className="text-red-400 hover:text-red-300 text-xs flex items-center space-x-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mb-3">
            <input
              type="number"
              value={config.priceRange.lower}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                priceRange: { ...prev.priceRange, lower: parseFloat(e.target.value) || 0 }
              }))}
              className="flex-1 bg-x-bg border border-x-border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Lower Price"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              value={config.priceRange.upper}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                priceRange: { ...prev.priceRange, upper: parseFloat(e.target.value) || 0 }
              }))}
              className="flex-1 bg-x-bg border border-x-border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Upper Price"
            />
          </div>
          
          <button
            onClick={setCurrentPriceRange}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Set Current Price Range
          </button>
        </div>

        {/* Number of Grids */}
        <div className="bg-x-bg-secondary rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Number of Grids
          </label>
          <div className="flex items-center space-x-3 mb-3">
            <input
              type="number"
              value={config.gridCount}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                gridCount: parseInt(e.target.value) || 1
              }))}
              min="2"
              max="100"
              className="flex-1 bg-x-bg border border-x-border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <select
              value={config.gridType}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                gridType: e.target.value as 'arithmetic' | 'geometric'
              }))}
              className="bg-x-bg border border-x-border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="arithmetic">Arithmetic</option>
              <option value="geometric">Geometric</option>
            </select>
          </div>
          
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <p className="text-sm text-gray-300 mb-1">Profit/Grid (fees deducted)</p>
            <p className="text-lg font-bold text-green-400">
              {profitPerGrid.min.toFixed(2)}% - {profitPerGrid.max.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Investment (Margin) */}
        <div className="bg-x-bg-secondary rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Investment (Margin)
          </label>
          
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">Minimum Required</p>
              <p className="text-sm font-medium text-white">
                ≥ {service.calculateRequiredMargin(config).toFixed(2)} USDT
              </p>
            </div>
            <select
              value={config.leverage}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                leverage: parseInt(e.target.value)
              }))}
              className="bg-x-bg border border-x-border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {[1, 2, 3, 5, 10, 20, 50].map(lev => (
                <option key={lev} value={lev}>{lev}x</option>
              ))}
            </select>
          </div>

          {/* Investment Slider */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Investment Amount</span>
              <span className="text-xs text-gray-400">{config.investment.toFixed(2)} USDT</span>
            </div>
            <input
              type="range"
              min={service.calculateRequiredMargin(config)}
              max={service.calculateRequiredMargin(config) * 10}
              value={config.investment}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                investment: parseFloat(e.target.value)
              }))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Min</span>
              <span>Max</span>
            </div>
          </div>

          {/* Investment Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Avbl</span>
              <div className="flex items-center space-x-1">
                <span className="text-white">{availableBalance.toFixed(2)} USDT</span>
                <ArrowLeftRight className="w-3 h-3 text-gray-400" />
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Qty/Order</span>
              <span className="text-white">-- {selectedSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Investment</span>
              <span className="text-white">-- USDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Est. Liq. Price (Long)</span>
              <span className="text-white">--</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Est. Liq. Price (Short)</span>
              <span className="text-white">--</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Margin Mode</span>
              <select
                value={config.marginMode}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  marginMode: e.target.value as 'cross' | 'isolated'
                }))}
                className="bg-transparent text-white border-none focus:outline-none"
              >
                <option value="cross">Cross</option>
                <option value="isolated">Isolated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="bg-x-bg-secondary rounded-lg p-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-300">Advanced (Optional)</span>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showAdvanced && (
            <div className="mt-4 space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.advanced.trailingUp}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    advanced: { ...prev.advanced, trailingUp: e.target.checked }
                  }))}
                  className="rounded border-gray-600 bg-x-bg text-purple-500 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">Trailing Up</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.advanced.trailingDown}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    advanced: { ...prev.advanced, trailingDown: e.target.checked }
                  }))}
                  className="rounded border-gray-600 bg-x-bg text-purple-500 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">Trailing Down</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.advanced.gridTrigger}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    advanced: { ...prev.advanced, gridTrigger: e.target.checked }
                  }))}
                  className="rounded border-gray-600 bg-x-bg text-purple-500 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">Grid Trigger</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.advanced.takeProfitStopLoss}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    advanced: { ...prev.advanced, takeProfitStopLoss: e.target.checked }
                  }))}
                  className="rounded border-gray-600 bg-x-bg text-purple-500 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">TP/SL</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.advanced.closeAllOnStop}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    advanced: { ...prev.advanced, closeAllOnStop: e.target.checked }
                  }))}
                  className="rounded border-gray-600 bg-x-bg text-purple-500 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">Close all positions on stop</span>
              </label>
            </div>
          )}
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreateBot}
          disabled={loading}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-700 text-black font-semibold py-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
          ) : null}
          <span>Create (Neutral)</span>
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-x-bg-secondary border-t border-x-border p-4">
        <div className="flex justify-around">
          <button className="flex flex-col items-center space-y-1 text-purple-400">
            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-xs">🤖</span>
            </div>
            <span className="text-xs">Trading Bots</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-gray-400">
            <div className="w-6 h-6 rounded-full flex items-center justify-center">
              <span className="text-xs">∞</span>
            </div>
            <span className="text-xs">Trade</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-gray-400">
            <div className="w-6 h-6 rounded-full flex items-center justify-center">
              <span className="text-xs">📋</span>
            </div>
            <span className="text-xs">All Orders</span>
          </button>
        </div>
      </div>
    </div>
  );
} 