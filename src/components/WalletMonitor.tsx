import React, { useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { 
  Bell, 
  Plus, 
  Trash2, 
  Edit, 
  Play, 
  Pause, 
  Settings,
  AlertCircle,
  CheckCircle,
  Wifi,
  WifiOff,
  Send,
  DollarSign,
  TrendingUp,
  Package
} from 'lucide-react';
import { 
  getWalletDetectionService, 
  WalletMonitorConfig, 
  AlertType 
} from '../services/walletDetection';
import { telegramBot } from '../services/telegramBot';

interface WalletMonitorProps {
  className?: string;
}

export const WalletMonitor: React.FC<WalletMonitorProps> = ({ className = '' }) => {
  const { connection } = useConnection();
  const [wallets, setWallets] = useState<WalletMonitorConfig[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState<WalletMonitorConfig | null>(null);
  const [telegramConfigured, setTelegramConfigured] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  
  // Form states
  const [walletAddress, setWalletAddress] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedAlertTypes, setSelectedAlertTypes] = useState<Set<AlertType>>(
    new Set(['all_transactions'])
  );
  const [minTransactionAmount, setMinTransactionAmount] = useState('0.1');
  const [largeTransactionThreshold, setLargeTransactionThreshold] = useState('1000');
  
  // Telegram config
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [showTelegramConfig, setShowTelegramConfig] = useState(false);

  const detectionService = getWalletDetectionService(connection);

  useEffect(() => {
    // Load monitored wallets
    const loadedWallets = detectionService.getMonitoredWallets();
    setWallets(loadedWallets);
    
    // Check Telegram configuration
    setTelegramConfigured(telegramBot.isReady());
    
    // Check if monitoring is active
    const monitoringStatus = localStorage.getItem('wallet_monitoring_active');
    if (monitoringStatus === 'true') {
      detectionService.startMonitoring();
      setIsMonitoring(true);
    }
  }, []);

  const alertTypeOptions: { value: AlertType; label: string; icon: React.ReactNode }[] = [
    { value: 'all_transactions', label: 'All Transactions', icon: <Package className="w-4 h-4" /> },
    { value: 'large_transactions', label: 'Large Transactions', icon: <DollarSign className="w-4 h-4" /> },
    { value: 'token_swaps', label: 'Token Swaps', icon: <TrendingUp className="w-4 h-4" /> },
    { value: 'nft_transfers', label: 'NFT Transfers', icon: <Package className="w-4 h-4" /> },
    { value: 'incoming_only', label: 'Incoming Only', icon: <Send className="w-4 h-4 rotate-180" /> },
    { value: 'outgoing_only', label: 'Outgoing Only', icon: <Send className="w-4 h-4" /> },
    { value: 'new_tokens', label: 'New Tokens', icon: <Plus className="w-4 h-4" /> },
  ];

  const handleAddWallet = () => {
    if (!walletAddress) {
      alert('Please enter a wallet address');
      return;
    }

    try {
      new PublicKey(walletAddress);
    } catch {
      alert('Invalid wallet address');
      return;
    }

    const config: WalletMonitorConfig = {
      walletAddress,
      nickname: nickname || undefined,
      alertTypes: selectedAlertTypes,
      thresholds: {
        minTransactionAmount: parseFloat(minTransactionAmount) || 0,
        largeTransactionThreshold: parseFloat(largeTransactionThreshold) || 1000,
      },
      enabled: true,
    };

    if (editingWallet) {
      detectionService.updateWallet(walletAddress, config);
    } else {
      detectionService.addWallet(config);
    }

    // Refresh wallet list
    setWallets(detectionService.getMonitoredWallets());
    
    // Reset form
    setWalletAddress('');
    setNickname('');
    setSelectedAlertTypes(new Set(['all_transactions']));
    setMinTransactionAmount('0.1');
    setLargeTransactionThreshold('1000');
    setShowAddModal(false);
    setEditingWallet(null);
  };

  const handleRemoveWallet = (address: string) => {
    if (confirm('Are you sure you want to remove this wallet from monitoring?')) {
      detectionService.removeWallet(address);
      setWallets(detectionService.getMonitoredWallets());
    }
  };

  const handleToggleWallet = (address: string, enabled: boolean) => {
    detectionService.updateWallet(address, { enabled });
    setWallets(detectionService.getMonitoredWallets());
  };

  const handleStartMonitoring = () => {
    if (!telegramConfigured) {
      setShowTelegramConfig(true);
      return;
    }

    detectionService.startMonitoring();
    setIsMonitoring(true);
    localStorage.setItem('wallet_monitoring_active', 'true');
  };

  const handleStopMonitoring = () => {
    detectionService.stopMonitoring();
    setIsMonitoring(false);
    localStorage.setItem('wallet_monitoring_active', 'false');
  };

  const handleSaveTelegramConfig = async () => {
    if (!botToken || !chatId) {
      alert('Please enter both bot token and chat ID');
      return;
    }

    telegramBot.updateConfig({ botToken, chatId });
    
    // Test connection
    setTestingConnection(true);
    const connected = await telegramBot.testConnection();
    setTestingConnection(false);
    
    if (connected) {
      setTelegramConfigured(true);
      setShowTelegramConfig(false);
      
      // Save to localStorage for persistence
      localStorage.setItem('telegram_bot_token', botToken);
      localStorage.setItem('telegram_chat_id', chatId);
      
      alert('Telegram bot configured successfully!');
    } else {
      alert('Failed to connect to Telegram bot. Please check your credentials.');
    }
  };

  const handleTestAlert = async () => {
    if (!telegramConfigured) {
      alert('Please configure Telegram bot first');
      return;
    }

    const sent = await telegramBot.sendAlert({
      type: 'wallet_activity',
      title: 'Test Alert',
      message: 'This is a test alert from Solana Wallet Monitor',
      timestamp: new Date().toISOString(),
      priority: 'medium',
    });

    if (sent) {
      alert('Test alert sent successfully! Check your Telegram.');
    } else {
      alert('Failed to send test alert. Please check your configuration.');
    }
  };

  return (
    <div className={`bg-gray-900 rounded-lg p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Wallet Monitor</h2>
          {telegramConfigured ? (
            <Wifi className="w-5 h-5 text-green-400" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-400" />
          )}
        </div>
        
        <div className="flex gap-2">
          {!telegramConfigured && (
            <button
              onClick={() => setShowTelegramConfig(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Configure Telegram
            </button>
          )}
          
          {telegramConfigured && (
            <button
              onClick={handleTestAlert}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2"
            >
              <Bell className="w-4 h-4" />
              Test Alert
            </button>
          )}
          
          {isMonitoring ? (
            <button
              onClick={handleStopMonitoring}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
            >
              <Pause className="w-4 h-4" />
              Stop Monitoring
            </button>
          ) : (
            <button
              onClick={handleStartMonitoring}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Start Monitoring
            </button>
          )}
          
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Wallet
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Status:</span>
              {isMonitoring ? (
                <span className="text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Active
                </span>
              ) : (
                <span className="text-gray-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Inactive
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Wallets:</span>
              <span className="text-white">{wallets.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Active:</span>
              <span className="text-white">
                {wallets.filter(w => w.enabled).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet List */}
      <div className="space-y-4">
        {wallets.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No wallets being monitored</p>
            <p className="text-sm mt-2">Add a wallet to start monitoring</p>
          </div>
        ) : (
          wallets.map((wallet) => (
            <div
              key={wallet.walletAddress}
              className={`p-4 bg-gray-800 rounded-lg border ${
                wallet.enabled ? 'border-green-500/30' : 'border-gray-700'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-white font-semibold">
                      {wallet.nickname || 'Unnamed Wallet'}
                    </h3>
                    {wallet.enabled ? (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded">
                        Paused
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-400 text-sm font-mono mb-2">
                    {wallet.walletAddress.slice(0, 20)}...{wallet.walletAddress.slice(-20)}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {Array.from(wallet.alertTypes).map((type) => (
                      <span
                        key={type}
                        className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded"
                      >
                        {alertTypeOptions.find(opt => opt.value === type)?.label || type}
                      </span>
                    ))}
                  </div>
                  
                  {wallet.thresholds && (
                    <div className="mt-3 text-xs text-gray-500">
                      Min: {wallet.thresholds.minTransactionAmount} SOL • 
                      Large: ${wallet.thresholds.largeTransactionThreshold}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleWallet(wallet.walletAddress, !wallet.enabled)}
                    className={`p-2 rounded-lg ${
                      wallet.enabled
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-400'
                    }`}
                  >
                    {wallet.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={() => {
                      setEditingWallet(wallet);
                      setWalletAddress(wallet.walletAddress);
                      setNickname(wallet.nickname || '');
                      setSelectedAlertTypes(wallet.alertTypes);
                      setMinTransactionAmount(wallet.thresholds.minTransactionAmount?.toString() || '0.1');
                      setLargeTransactionThreshold(wallet.thresholds.largeTransactionThreshold?.toString() || '1000');
                      setShowAddModal(true);
                    }}
                    className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-400 rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleRemoveWallet(wallet.walletAddress)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Wallet Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingWallet ? 'Edit Wallet' : 'Add Wallet to Monitor'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Wallet Address
                </label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="Enter Solana wallet address"
                  className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={!!editingWallet}
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Nickname (Optional)
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g., Main Wallet, Trading Bot"
                  className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Alert Types
                </label>
                <div className="space-y-2">
                  {alertTypeOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAlertTypes.has(option.value)}
                        onChange={(e) => {
                          const newTypes = new Set(selectedAlertTypes);
                          if (e.target.checked) {
                            newTypes.add(option.value);
                          } else {
                            newTypes.delete(option.value);
                          }
                          setSelectedAlertTypes(newTypes);
                        }}
                        className="w-4 h-4 text-purple-600"
                      />
                      <span className="text-white flex items-center gap-2">
                        {option.icon}
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Minimum Transaction Amount (SOL)
                </label>
                <input
                  type="number"
                  value={minTransactionAmount}
                  onChange={(e) => setMinTransactionAmount(e.target.value)}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Large Transaction Threshold (USD)
                </label>
                <input
                  type="number"
                  value={largeTransactionThreshold}
                  onChange={(e) => setLargeTransactionThreshold(e.target.value)}
                  step="100"
                  min="0"
                  className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddWallet}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
              >
                {editingWallet ? 'Save Changes' : 'Add Wallet'}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingWallet(null);
                  setWalletAddress('');
                  setNickname('');
                  setSelectedAlertTypes(new Set(['all_transactions']));
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Telegram Configuration Modal */}
      {showTelegramConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">
              Configure Telegram Bot
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Bot Token
                </label>
                <input
                  type="text"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="Enter your Telegram bot token"
                  className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get this from @BotFather on Telegram
                </p>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Chat ID
                </label>
                <input
                  type="text"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="Enter your Telegram chat ID"
                  className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Message your bot and check getUpdates API
                </p>
              </div>
              
              <div className="bg-gray-800 p-3 rounded-lg">
                <h4 className="text-white font-semibold mb-2">How to get these:</h4>
                <ol className="text-sm text-gray-400 space-y-1">
                  <li>1. Message @BotFather on Telegram</li>
                  <li>2. Create a new bot with /newbot</li>
                  <li>3. Copy the bot token</li>
                  <li>4. Message your bot</li>
                  <li>5. Visit: https://api.telegram.org/bot[TOKEN]/getUpdates</li>
                  <li>6. Find your chat ID in the response</li>
                </ol>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveTelegramConfig}
                disabled={testingConnection}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
              >
                {testingConnection ? 'Testing...' : 'Save & Test'}
              </button>
              <button
                onClick={() => setShowTelegramConfig(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
