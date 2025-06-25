import { ethers } from 'ethers';

// Web3 utility functions
export class Web3Utils {
  static async connectMetaMask() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        // Get network info
        const network = await provider.getNetwork();
        let networkName = 'ETHEREUM';
        
        // Determine network
        if (network.chainId === 56n) {
          networkName = 'BSC';
        } else if (network.chainId === 1n) {
          networkName = 'ETHEREUM';
        }
        
        return {
          address,
          network: networkName,
          provider,
          signer
        };
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
        throw new Error('Failed to connect to MetaMask');
      }
    } else {
      throw new Error('MetaMask is not installed');
    }
  }

  static async connectTronLink() {
    // Check if TronLink is installed
    if (typeof window.tronWeb === 'undefined') {
      throw new Error('TronLink is not installed');
    }

    try {
      // Wait for TronLink to be ready
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!window.tronWeb.ready && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      if (!window.tronWeb.ready) {
        throw new Error('TronLink is not ready. Please unlock TronLink and try again.');
      }

      const address = window.tronWeb.defaultAddress?.base58;
      
      if (!address) {
        throw new Error('TronLink is not logged in. Please log in to TronLink first.');
      }
      
      return {
        address,
        network: 'TRON',
        tronWeb: window.tronWeb
      };
    } catch (error) {
      console.error('Error connecting to TronLink:', error);
      throw error;
    }
  }

  static async connectTONKeeper() {
    // For TON Keeper, we'll simulate for now since integration is more complex
    // In production, you'd use @tonconnect/ui-react
    try {
      // This is a simulation - in production implement proper TON Connect
      const mockAddress = 'EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG';
      
      return {
        address: mockAddress,
        network: 'TON'
      };
    } catch (error) {
      console.error('Error connecting to TON Keeper:', error);
      throw new Error('Failed to connect to TON Keeper');
    }
  }

  static async signMessage(message, wallet) {
    try {
      if (wallet.network === 'BSC' || wallet.network === 'ETHEREUM') {
        if (wallet.signer) {
          return await wallet.signer.signMessage(message);
        } else {
          // Fallback to provider
          const signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [message, wallet.address],
          });
          return signature;
        }
      } else if (wallet.network === 'TRON') {
        // For TronLink, we need to use the correct signing method
        if (!window.tronWeb || !window.tronWeb.ready) {
          throw new Error('TronLink is not ready');
        }
        
        try {
          // Try different signing methods for TronLink
          if (window.tronWeb.trx && window.tronWeb.trx.sign) {
            const signature = await window.tronWeb.trx.sign(message);
            return signature;
          } else if (window.tronWeb.trx && window.tronWeb.trx.signMessage) {
            const signature = await window.tronWeb.trx.signMessage(message);
            return signature;
          } else {
            // Fallback: create a simple signature for demo purposes
            // In production, implement proper TronLink message signing
            return 'tron_demo_signature_' + Date.now() + '_' + wallet.address;
          }
        } catch (tronError) {
          console.error('TronLink signing error:', tronError);
          // For demo purposes, return a mock signature
          // In production, handle this properly
          return 'tron_demo_signature_' + Date.now() + '_' + wallet.address;
        }
      } else if (wallet.network === 'TON') {
        // For TON, we'll simulate signature for now
        // In production, implement proper TON signature
        return 'ton_signature_' + Date.now() + '_' + wallet.address;
      }
      
      throw new Error('Unsupported network for signing');
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  }

  static isWalletInstalled(walletType) {
    switch (walletType) {
      case 'metamask':
        return typeof window.ethereum !== 'undefined';
      case 'tronlink':
        return typeof window.tronWeb !== 'undefined';
      case 'tonkeeper':
        // For TON Keeper, check would be more complex
        // In production, check for TON Connect or specific TON wallet
        return true; // Simplified for demo
      default:
        return false;
    }
  }

  static async switchNetwork(chainId) {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainId.toString(16)}` }],
        });
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          await this.addNetwork(chainId);
        } else {
          throw switchError;
        }
      }
    }
  }

  static async addNetwork(chainId) {
    const networks = {
      56: {
        chainId: '0x38',
        chainName: 'Binance Smart Chain',
        nativeCurrency: {
          name: 'BNB',
          symbol: 'BNB',
          decimals: 18,
        },
        rpcUrls: ['https://bsc-dataseed.binance.org/'],
        blockExplorerUrls: ['https://bscscan.com'],
      },
    };

    const network = networks[chainId];
    if (network && typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [network],
        });
      } catch (addError) {
        console.error('Error adding network:', addError);
        throw addError;
      }
    }
  }
}

export default Web3Utils;