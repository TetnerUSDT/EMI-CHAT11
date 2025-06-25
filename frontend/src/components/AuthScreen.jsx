import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import { Web3Utils } from '../utils/web3';
import { authAPI } from '../services/api';
import EMILogo from './ui/logo';

const AuthScreen = ({ onAuthSuccess }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const { toast } = useToast();

  const walletOptions = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: 'Connect using MetaMask wallet',
      networks: ['BSC', 'Ethereum'],
      installed: Web3Utils.isWalletInstalled('metamask')
    },
    {
      id: 'tronlink',
      name: 'TronLink',
      icon: '⚡',
      description: 'Connect using TronLink wallet',
      networks: ['TRON'],
      installed: Web3Utils.isWalletInstalled('tronlink')
    },
    {
      id: 'tonkeeper',
      name: 'TON Keeper',
      icon: '💎',
      description: 'Connect using TON Keeper wallet',
      networks: ['TON'],
      installed: Web3Utils.isWalletInstalled('tonkeeper')
    }
  ];

  const handleConnect = async (wallet) => {
    if (!wallet.installed) {
      toast({
        title: "Wallet not installed",
        description: `Please install ${wallet.name} extension first.`,
        variant: "destructive"
      });
      return;
    }

    setSelectedWallet(wallet.id);
    setIsConnecting(true);
    
    try {
      let walletConnection;
      
      // Connect to wallet
      if (wallet.id === 'metamask') {
        walletConnection = await Web3Utils.connectMetaMask();
      } else if (wallet.id === 'tronlink') {
        walletConnection = await Web3Utils.connectTronLink();
      } else if (wallet.id === 'tonkeeper') {
        walletConnection = await Web3Utils.connectTONKeeper();
      }

      if (!walletConnection) {
        throw new Error('Failed to connect to wallet');
      }

      toast({
        title: "Wallet Connected",
        description: `Connected to ${wallet.name} successfully!`,
      });

      // Generate authentication message
      const authData = await authAPI.generateMessage(
        walletConnection.address, 
        walletConnection.network
      );

      toast({
        title: "Sign Message",
        description: "Please sign the authentication message in your wallet.",
      });

      // Sign the message
      const signature = await Web3Utils.signMessage(authData.message, walletConnection);

      // Authenticate with backend
      const loginResult = await authAPI.login(
        walletConnection.address,
        walletConnection.network,
        signature,
        authData.message
      );

      // Store auth data
      localStorage.setItem('auth_token', loginResult.access_token);
      localStorage.setItem('user_data', JSON.stringify(loginResult.user));

      toast({
        title: "Authentication Successful",
        description: "Welcome to EMI!",
      });

      // Call success callback
      onAuthSuccess(loginResult.user);

    } catch (error) {
      console.error('Connection failed:', error);
      
      let errorMessage = 'Failed to connect wallet';
      
      // Safely check error message
      const errorMsg = error?.message || error?.toString() || '';
      
      if (errorMsg.includes('User rejected') || errorMsg.includes('cancelled')) {
        errorMessage = 'Connection cancelled by user';
      } else if (errorMsg.includes('not installed')) {
        errorMessage = `${wallet.name} is not installed`;
      } else if (errorMsg.includes('not logged in') || errorMsg.includes('not ready')) {
        errorMessage = `Please log in to ${wallet.name} first`;
      } else if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (errorMsg) {
        errorMessage = errorMsg;
      }

      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
      setSelectedWallet(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%22%20height=%2260%22%20viewBox=%220%200%2060%2060%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22none%22%20fill-rule=%22evenodd%22%3E%3Cg%20fill=%22%239C92AC%22%20fill-opacity=%220.1%22%3E%3Ccircle%20cx=%2230%22%20cy=%2230%22%20r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
      
      <Card className="w-full max-w-md bg-black/40 backdrop-blur-lg border-purple-500/30 shadow-2xl relative z-10">
        <CardHeader className="text-center space-y-6">
          <div className="flex justify-center">
            <EMILogo size={100} className="drop-shadow-lg hover:drop-shadow-2xl transition-all duration-300" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-white mb-2">
              Welcome to EMI
            </CardTitle>
            <CardDescription className="text-gray-300 mt-2">
              Your AI-powered crypto messenger
            </CardDescription>
            <CardDescription className="text-purple-300 mt-1 text-sm">
              Connect your crypto wallet to get started
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {walletOptions.map((wallet) => (
            <Button
              key={wallet.id}
              variant="outline"
              className={`w-full h-16 bg-white/5 hover:bg-white/10 border-white/20 hover:border-emerald-400/50 transition-all duration-300 group relative ${
                !wallet.installed ? 'opacity-60' : ''
              }`}
              onClick={() => handleConnect(wallet)}
              disabled={isConnecting}
            >
              <div className="flex items-center space-x-4 w-full">
                <div className="text-2xl">{wallet.icon}</div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                    {wallet.name}
                    {!wallet.installed && (
                      <Badge variant="secondary" className="text-xs bg-red-500/20 text-red-300">
                        Not Installed
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    {wallet.description}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {wallet.networks.map((network) => (
                    <Badge 
                      key={network} 
                      variant="secondary" 
                      className="text-xs bg-emerald-500/20 text-emerald-300"
                    >
                      {network}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {isConnecting && selectedWallet === wallet.id && (
                <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400"></div>
                </div>
              )}
            </Button>
          ))}
          
          <div className="pt-4 text-center">
            <p className="text-xs text-gray-400">
              By connecting, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthScreen;