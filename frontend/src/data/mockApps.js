// Mock data for Apps section

export const mockApps = [
  {
    id: 'app1',
    name: 'CryptoTrader Pro',
    developer: 'FinTech Studios',
    description: 'Advanced cryptocurrency trading platform with real-time charts and analytics.',
    longDescription: 'CryptoTrader Pro is a comprehensive trading platform designed for serious cryptocurrency traders. Features include real-time price charts, advanced technical analysis tools, portfolio management, and automated trading strategies. Connect with multiple exchanges and trade directly from the app.',
    icon: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop',
    category: 'Finance',
    rating: 4.8,
    reviewCount: 1250,
    installCount: 45000,
    likes: 3200, // likes instead of size
    version: '2.1.4',
    lastUpdate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    dateAdded: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    isNew: false,
    isFeatured: true,
    isInstalled: true, // Mark as installed
    webUrl: 'https://cryptotrader-pro.example.com',
    screenshots: [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&h=600&fit=crop'
    ],
    permissions: [
      'Access to camera for QR code scanning',
      'Internet access for real-time data',
      'Device storage for app data'
    ],
    changelog: 'Version 2.1.4:\n• Fixed chart loading issues\n• Added new trading pairs\n• Improved security features\n• Bug fixes and performance improvements',
    reviews: [
      {
        userName: 'Alex Crypto',
        userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&fit=crop&crop=face',
        rating: 5,
        comment: 'Amazing app! The charts are incredibly detailed and the interface is intuitive.',
        date: '2 days ago'
      },
      {
        userName: 'Sarah DeFi',
        userAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b5e8e4b0?w=50&h=50&fit=crop&crop=face',
        rating: 4,
        comment: 'Great trading tools, but could use more customization options.',
        date: '1 week ago'
      },
      {
        userName: 'Mike Trader',
        userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
        rating: 5,
        comment: 'Best crypto trading app I\'ve used. Highly recommended!',
        date: '2 weeks ago'
      }
    ],
    similarApps: [
      {
        id: 'app7',
        name: 'CoinTracker',
        developer: 'CoinTracker Inc',
        icon: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=100&h=100&fit=crop',
        category: 'Finance',
        rating: 4.6
      },
      {
        id: 'app8',
        name: 'Portfolio Manager',
        developer: 'Invest Apps',
        icon: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=100&h=100&fit=crop',
        category: 'Finance',
        rating: 4.3
      }
    ]
  },
  {
    id: 'app2',
    name: 'NFT Gallery',
    developer: 'ArtBlock Studios',
    description: 'Discover, collect, and showcase your favorite NFTs in a beautiful gallery.',
    longDescription: 'NFT Gallery is the ultimate app for NFT enthusiasts. Browse collections from top marketplaces, track your portfolio value, and create stunning displays of your digital art. Connect with artists and collectors in a vibrant community.',
    icon: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=100&h=100&fit=crop',
    category: 'Art',
    rating: 4.6,
    reviewCount: 892,
    installCount: 32000,
    likes: 2850, // likes instead of size
    version: '1.8.2',
    lastUpdate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    dateAdded: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    isNew: true,
    isFeatured: false,
    isInstalled: true, // Mark as installed
    webUrl: 'https://nft-gallery.example.com',
    screenshots: [
      'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop'
    ],
    permissions: [
      'Internet access for NFT data',
      'Camera access for AR features',
      'Storage for cached images'
    ],
    changelog: 'Version 1.8.2:\n• Added AR viewing mode\n• New collection filters\n• Enhanced image quality\n• Social sharing features',
    reviews: [
      {
        userName: 'ArtLover99',
        userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop&crop=face',
        rating: 5,
        comment: 'Beautiful interface for viewing my NFT collection!',
        date: '1 day ago'
      },
      {
        userName: 'DigitalCollector',
        userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face',
        rating: 4,
        comment: 'Good app but needs more marketplace integrations.',
        date: '5 days ago'
      }
    ],
    similarApps: [
      {
        id: 'app9',
        name: 'OpenSea Mobile',
        developer: 'OpenSea',
        icon: 'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=100&h=100&fit=crop',
        category: 'Art',
        rating: 4.4
      }
    ]
  }
];

export const mockAppCategories = [
  'All',
  'Finance',
  'Gaming',
  'DeFi',
  'Art',
  'Social',
  'Security',
  'Trading',
  'NFT'
];

export const mockFeaturedApps = mockApps.filter(app => app.isFeatured);
export const mockNewApps = mockApps.filter(app => app.isNew);

// Mock functions for app-related operations
export const mockAppFunctions = {
  installApp: (appId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `App ${appId} installed successfully`
        });
      }, 2000);
    });
  },

  launchApp: (appId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const app = mockApps.find(a => a.id === appId);
        resolve({
          success: true,
          url: app?.webUrl || 'https://example.com',
          message: `Launching ${app?.name || 'app'}`
        });
      }, 500);
    });
  },

  shareApp: (appId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const app = mockApps.find(a => a.id === appId);
        resolve({
          success: true,
          shareUrl: `https://emi-app-store.com/app/${appId}`,
          message: `Share link for ${app?.name || 'app'} copied to clipboard`
        });
      }, 300);
    });
  },

  addToWishlist: (appId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const app = mockApps.find(a => a.id === appId);
        resolve({
          success: true,
          message: `${app?.name || 'App'} added to wishlist`
        });
      }, 300);
    });
  },

  searchApps: (query) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const results = mockApps.filter(app => 
          app.name.toLowerCase().includes(query.toLowerCase()) ||
          app.description.toLowerCase().includes(query.toLowerCase()) ||
          app.category.toLowerCase().includes(query.toLowerCase())
        );
        resolve(results);
      }, 500);
    });
  }
};