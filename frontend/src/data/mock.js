// Mock data for Telegram-like app

export const mockUsers = [
  {
    id: '1',
    address: '0x742d35Cc6634C0532925a3b8D39c6e8f137b7c85',
    username: 'crypto_enthusiast',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
    trustScore: 0,
    isOnline: true,
    lastSeen: new Date()
  },
  {
    id: '2', 
    address: '0x892F3b8D39c6e8f137b7c85742d35Cc6634C0532',
    username: 'defi_trader',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b5e8e4b0?w=100&h=100&fit=crop&crop=face',
    trustScore: 0,
    isOnline: false,
    lastSeen: new Date(Date.now() - 3600000) // 1 hour ago
  },
  {
    id: '3',
    address: '0x3F8D39c6e8f137b7c85742d35Cc6634C0532892',
    username: 'nft_collector',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    trustScore: 0,
    isOnline: true,
    lastSeen: new Date()
  }
];

export const mockGroups = [
  {
    id: 'g1',
    name: 'DeFi Discussion',
    avatar: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=100&h=100&fit=crop',
    members: 156,
    isSecret: false,
    lastMessage: 'Check out this new DEX protocol!',
    lastMessageTime: new Date(Date.now() - 1800000) // 30 min ago
  },
  {
    id: 'g2',
    name: 'NFT Marketplace',
    avatar: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=100&h=100&fit=crop',
    members: 89,
    isSecret: false,
    lastMessage: 'New drop coming tomorrow 🚀',
    lastMessageTime: new Date(Date.now() - 7200000) // 2 hours ago
  },
  {
    id: 'g3',
    name: 'Secret Traders',
    avatar: 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=100&h=100&fit=crop',
    members: 12,
    isSecret: true,
    lastMessage: 'Message will be deleted in 5 minutes',
    lastMessageTime: new Date(Date.now() - 300000) // 5 min ago
  }
];

export const mockChats = [
  {
    id: '1',
    type: 'personal',
    participant: mockUsers[0],
    messages: [
      {
        id: 'm1',
        senderId: '1',
        text: 'Hey! Have you checked the new DeFi protocol on BSC?',
        timestamp: new Date(Date.now() - 3600000),
        type: 'text'
      },
      {
        id: 'm2',
        senderId: 'current',
        text: 'Not yet, what\'s so special about it?',
        timestamp: new Date(Date.now() - 3500000),
        type: 'text'
      },
      {
        id: 'm3',
        senderId: '1',
        text: 'They offer 20% APY on USDT staking!',
        timestamp: new Date(Date.now() - 3400000),
        type: 'text'
      },
      {
        id: 'm4',
        senderId: '1',
        text: '🎉✨',
        timestamp: new Date(Date.now() - 3300000),
        type: 'sticker',
        stickerUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f389.svg'
      }
    ],
    lastMessage: '🎉✨',
    lastMessageTime: new Date(Date.now() - 3300000),
    unreadCount: 2
  },
  {
    id: '2',
    type: 'personal', 
    participant: mockUsers[1],
    messages: [
      {
        id: 'm5',
        senderId: '2',
        text: 'Can you help me with a transaction?',
        timestamp: new Date(Date.now() - 1800000),
        type: 'text'
      },
      {
        id: 'm6',
        senderId: 'current',
        text: 'Sure! What do you need?',
        timestamp: new Date(Date.now() - 1700000),
        type: 'text'
      }
    ],
    lastMessage: 'Sure! What do you need?',
    lastMessageTime: new Date(Date.now() - 1700000),
    unreadCount: 0
  }
];

export const mockWallets = [
  {
    network: 'BSC',
    address: '0x742d35Cc6634C0532925a3b8D39c6e8f137b7c85',
    balance: '1,250.45',
    currency: 'BNB',
    usdValue: '312,612.50'
  },
  {
    network: 'TRON',
    address: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
    balance: '50,000.00',
    currency: 'TRX',
    usdValue: '5,250.00'
  },
  {
    network: 'TON',
    address: 'EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG',
    balance: '800.25',
    currency: 'TON',
    usdValue: '4,801.50'
  }
];

export const mockTransactions = [
  {
    id: 't1',
    type: 'sent',
    amount: '50.0',
    currency: 'BNB',
    to: '0x892F3b8D39c6e8f137b7c85742d35Cc6634C0532',
    timestamp: new Date(Date.now() - 7200000),
    status: 'confirmed',
    fee: '0.002'
  },
  {
    id: 't2',
    type: 'received',
    amount: '1000.0',
    currency: 'TRX',
    from: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
    timestamp: new Date(Date.now() - 14400000),
    status: 'confirmed',
    fee: '1.0'
  }
];

export const mockInvoices = [
  {
    id: 'inv1',
    amount: '100.0',
    currency: 'BNB',
    description: 'NFT Purchase',
    from: mockUsers[0].username,
    status: 'pending',
    createdAt: new Date(Date.now() - 1800000),
    expiresAt: new Date(Date.now() + 86400000) // 24 hours from now
  }
];

export const mockStickers = [
  {
    id: 's1',
    name: 'Party',
    url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f389.svg',
    animated: false
  },
  {
    id: 's2', 
    name: 'Fire',
    url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f525.svg',
    animated: false
  },
  {
    id: 's3',
    name: 'Money',
    url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f4b0.svg',
    animated: false
  },
  {
    id: 's4',
    name: 'Rocket',
    url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f680.svg',
    animated: false
  }
];

export const mockAIResponses = {
  '/remind': 'Reminder set! I\'ll notify you about this task.',
  '/transfer': 'Transaction prepared. Please confirm the details.',
  '/translate': 'Translation: Hello, how are you today?',
  '/help': 'Available commands: /remind, /transfer, /translate, /balance, /price',
  '/balance': 'Your current balance: 1,250.45 BNB ($312,612.50)',
  '/price': 'Current BNB price: $250.09 (+2.5% 24h)'
};

// Mock functions to simulate real functionality
export const mockFunctions = {
  connectWallet: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          address: '0x742d35Cc6634C0532925a3b8D39c6e8f137b7c85',
          network: 'BSC'
        });
      }, 2000);
    });
  },

  sendMessage: (chatId, message) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newMessage = {
          id: 'm' + Date.now(),
          senderId: 'current',
          text: message,
          timestamp: new Date(),
          type: 'text'
        };
        resolve(newMessage);
      }, 500);
    });
  },

  sendTransaction: (to, amount, currency) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          txHash: '0x' + Math.random().toString(16).substr(2, 64),
          status: 'pending'
        });
      }, 3000);
    });
  },

  getAIResponse: (message) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const command = message.split(' ')[0];
        const response = mockAIResponses[command] || 'I\'m sorry, I didn\'t understand that command. Type /help for available commands.';
        resolve(response);
      }, 1500);
    });
  }
};