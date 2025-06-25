// Mock data for Wallet networks and wallets

export const mockNetworks = [
  {
    id: 'emi-chain',
    name: 'EMI CHAIN',
    symbol: 'EMI',
    icon: 'https://images.unsplash.com/photo-1635372722656-389f87a941b7?w=100&h=100&fit=crop',
    color: 'from-purple-500 to-pink-600',
    isDefault: true,
    chainId: 'emi-1',
    rpcUrl: 'https://rpc.emi-chain.com',
    explorerUrl: 'https://explorer.emi-chain.com'
  },
  {
    id: 'tron',
    name: 'TRON',
    symbol: 'TRX',
    icon: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=100&h=100&fit=crop',
    color: 'from-red-500 to-orange-600',
    isDefault: false,
    chainId: 'tron-mainnet',
    rpcUrl: 'https://api.trongrid.io',
    explorerUrl: 'https://tronscan.org'
  },
  {
    id: 'bsc',
    name: 'BSC',
    symbol: 'BNB',
    icon: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=100&h=100&fit=crop',
    color: 'from-yellow-500 to-amber-600',
    isDefault: false,
    chainId: '56',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com'
  },
  {
    id: 'ton',
    name: 'TON',
    symbol: 'TON',
    icon: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=100&h=100&fit=crop',
    color: 'from-blue-500 to-cyan-600',
    isDefault: false,
    chainId: 'ton-mainnet',
    rpcUrl: 'https://toncenter.com/api/v2',
    explorerUrl: 'https://tonscan.org'
  },
  {
    id: 'ethereum',
    name: 'ETH',
    symbol: 'ETH',
    icon: 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=100&h=100&fit=crop',
    color: 'from-slate-500 to-blue-600',
    isDefault: false,
    chainId: '1',
    rpcUrl: 'https://mainnet.infura.io/v3',
    explorerUrl: 'https://etherscan.io'
  }
];

export const mockWalletsData = {
  'emi-chain': [
    {
      id: 'emi-wallet-1',
      name: 'Main Wallet',
      address: '0x742d35Cc6634C0532925a3b8D39c6e8f137b7c85',
      balance: '12,450.75',
      usdValue: '24,901.50',
      isDefault: true,
      privateKey: null, // Never store real private keys
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
      transactions: 156
    },
    {
      id: 'emi-wallet-2',
      name: 'Trading Wallet',
      address: '0x892F3b8D39c6e8f137b7c85742d35Cc6634C0532',
      balance: '8,750.25',
      usdValue: '17,500.50',
      isDefault: false,
      privateKey: null,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      transactions: 89
    }
  ],
  'tron': [
    {
      id: 'tron-wallet-1',
      name: 'TRON Main',
      address: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
      balance: '50,000.00',
      usdValue: '5,250.00',
      isDefault: true,
      privateKey: null,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      lastUsed: new Date(Date.now() - 3 * 60 * 60 * 1000),
      transactions: 234
    }
  ],
  'bsc': [],
  'ton': [],
  'ethereum': []
};

export const mockTransactionsData = {
  'emi-wallet-1': [
    {
      id: 'tx-emi-1',
      type: 'received',
      amount: '500.00',
      currency: 'EMI',
      from: '0x3F8D39c6e8f137b7c85742d35Cc6634C0532892',
      to: '0x742d35Cc6634C0532925a3b8D39c6e8f137b7c85',
      hash: '0xa1b2c3d4e5f6789012345678901234567890abcdef',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'confirmed',
      fee: '0.001',
      gasUsed: '21000'
    },
    {
      id: 'tx-emi-2',
      type: 'sent',
      amount: '100.50',
      currency: 'EMI',
      from: '0x742d35Cc6634C0532925a3b8D39c6e8f137b7c85',
      to: '0x892F3b8D39c6e8f137b7c85742d35Cc6634C0532',
      hash: '0xb2c3d4e5f6789012345678901234567890abcdef1',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'confirmed',
      fee: '0.002',
      gasUsed: '21000'
    }
  ],
  'emi-wallet-2': [
    {
      id: 'tx-emi-3',
      type: 'received',
      amount: '100.50',
      currency: 'EMI',
      from: '0x742d35Cc6634C0532925a3b8D39c6e8f137b7c85',
      to: '0x892F3b8D39c6e8f137b7c85742d35Cc6634C0532',
      hash: '0xb2c3d4e5f6789012345678901234567890abcdef1',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'confirmed',
      fee: '0.002',
      gasUsed: '21000'
    }
  ],
  'tron-wallet-1': [
    {
      id: 'tx-tron-1',
      type: 'sent',
      amount: '1000.00',
      currency: 'TRX',
      from: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
      to: 'TXn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSF',
      hash: 'c1d2e3f4g5h6789012345678901234567890abcdef',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      status: 'confirmed',
      fee: '1.0',
      gasUsed: 'N/A'
    }
  ]
};

// Mock functions for wallet operations
export const mockWalletFunctions = {
  createWallet: (networkId, walletName) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const network = mockNetworks.find(n => n.id === networkId);
        const newWallet = {
          id: `${networkId}-wallet-${Date.now()}`,
          name: walletName || `${network.name} Wallet`,
          address: generateMockAddress(networkId),
          balance: '0.00',
          usdValue: '0.00',
          isDefault: false,
          privateKey: null,
          createdAt: new Date(),
          lastUsed: new Date(),
          transactions: 0
        };
        resolve(newWallet);
      }, 2000);
    });
  },

  sendTransaction: (fromWallet, toAddress, amount, currency) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const txHash = generateMockTxHash();
        resolve({
          txHash,
          status: 'pending',
          amount,
          currency,
          from: fromWallet.address,
          to: toAddress
        });
      }, 3000);
    });
  },

  getWalletBalance: (walletId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock balance update
        resolve({
          balance: (Math.random() * 10000).toFixed(2),
          usdValue: (Math.random() * 20000).toFixed(2)
        });
      }, 1000);
    });
  }
};

// Helper functions
function generateMockAddress(networkId) {
  const prefixes = {
    'emi-chain': '0x',
    'ethereum': '0x',
    'bsc': '0x',
    'tron': 'T',
    'ton': 'EQ'
  };
  
  const prefix = prefixes[networkId] || '0x';
  const suffix = Math.random().toString(16).substring(2, 42);
  
  if (networkId === 'tron') {
    return `${prefix}${suffix.substring(0, 33).toUpperCase()}`;
  } else if (networkId === 'ton') {
    return `${prefix}${suffix.substring(0, 46)}`;
  } else {
    return `${prefix}${suffix.substring(0, 40)}`;
  }
}

function generateMockTxHash() {
  return '0x' + Math.random().toString(16).substring(2, 66);
}

export const getWalletsForNetwork = (networkId) => {
  return mockWalletsData[networkId] || [];
};

export const getTransactionsForWallet = (walletId) => {
  return mockTransactionsData[walletId] || [];
};