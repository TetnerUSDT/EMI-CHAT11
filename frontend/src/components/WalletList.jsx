import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Wallet, 
  Plus, 
  Copy, 
  Star, 
  ArrowLeft,
  TrendingUp,
  Eye,
  EyeOff,
  MoreHorizontal,
  Clock
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useLanguage } from '../contexts/LanguageContext';

const WalletList = ({ 
  network, 
  wallets, 
  selectedWallet, 
  onSelectWallet, 
  onCreateWallet,
  onBack,
  isLoading 
}) => {
  const [showBalances, setShowBalances] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();

  if (!network) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-800/50">
        <div className="text-center text-gray-400">
          <Wallet className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Select a network</h3>
          <p className="text-sm">Choose a blockchain network to view your wallets</p>
        </div>
      </div>
    );
  }

  const handleCreateWallet = () => {
    const walletName = `${network.name} Wallet ${wallets.length + 1}`;
    onCreateWallet(network.id, walletName);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} has been copied to clipboard.`,
    });
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance) => {
    if (!showBalances) return '••••••';
    return balance;
  };

  const formatUsdValue = (usdValue) => {
    if (!showBalances) return '••••••';
    return `$${usdValue}`;
  };

  const formatDate = (date) => {
    const now = new Date();
    const diffInHours = (now - new Date(date)) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`;
    }
  };

  return (
    <div className="flex-1 h-full bg-slate-800 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${network.color} flex items-center justify-center`}>
              <span className="text-white font-bold text-sm">
                {network.symbol}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{network.name} Wallets</h1>
              <p className="text-sm text-gray-400">{wallets.length}/20 wallets created</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBalances(!showBalances)}
              className="text-gray-400 hover:text-white"
            >
              {showBalances ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Create Wallet Section */}
        {wallets.length < 20 && (
          <Card className="bg-slate-700 border-slate-600 mb-6">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Create New Wallet</h3>
                <p className="text-gray-400 mb-4">
                  Create a new {network.name} wallet to store and manage your {network.symbol} tokens
                </p>
                <Button 
                  onClick={handleCreateWallet}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={isLoading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isLoading ? 'Creating...' : 'Create Wallet'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Wallets List */}
        {wallets.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No wallets yet</h3>
            <p className="text-gray-400 mb-6">
              Create your first {network.name} wallet to get started
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Your Wallets</h2>
              <Badge variant="secondary" className="bg-emerald-600/20 text-emerald-400 border-emerald-500/30">
                {wallets.length} wallets
              </Badge>
            </div>
            
            {wallets.map((wallet) => {
              const isSelected = selectedWallet?.id === wallet.id;
              
              return (
                <Card 
                  key={wallet.id}
                  className={`bg-slate-700 border-slate-600 cursor-pointer transition-all duration-200 hover:bg-slate-600 ${
                    isSelected ? 'ring-2 ring-emerald-500 bg-emerald-600/10' : ''
                  }`}
                  onClick={() => onSelectWallet(wallet)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className={`bg-gradient-to-r ${network.color} text-white`}>
                            {wallet.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {wallet.isDefault && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 border-2 border-slate-700 rounded-full flex items-center justify-center">
                            <Star className="w-2 h-2 text-slate-700 fill-slate-700" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-white truncate">
                              {wallet.name}
                            </h3>
                            {wallet.isDefault && (
                              <Badge className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                Default
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-3 h-3 text-gray-400" />
                          </div>
                        </div>
                        
                        {/* Balance */}
                        <div className="mb-3">
                          <div className="text-2xl font-bold text-white">
                            {formatBalance(wallet.balance)} {network.symbol}
                          </div>
                          <div className="text-sm text-gray-400">
                            ≈ {formatUsdValue(wallet.usdValue)}
                          </div>
                        </div>
                        
                        {/* Address */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <span>{formatAddress(wallet.address)}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0 text-gray-400 hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(wallet.address, 'Wallet address');
                              }}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Stats */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-4">
                            <span>{wallet.transactions} transactions</span>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>Last used {formatDate(wallet.lastUsed)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        {/* Wallet Limit Warning */}
        {wallets.length >= 18 && wallets.length < 20 && (
          <Card className="bg-yellow-500/10 border-yellow-500/30 mt-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <span className="text-yellow-400 text-sm font-bold">!</span>
                </div>
                <div>
                  <p className="text-yellow-400 font-medium text-sm">
                    Approaching wallet limit
                  </p>
                  <p className="text-yellow-400/80 text-xs">
                    You can create {20 - wallets.length} more wallet(s) in this network
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {wallets.length >= 20 && (
          <Card className="bg-red-500/10 border-red-500/30 mt-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                  <span className="text-red-400 text-sm font-bold">!</span>
                </div>
                <div>
                  <p className="text-red-400 font-medium text-sm">
                    Wallet limit reached
                  </p>
                  <p className="text-red-400/80 text-xs">
                    You have reached the maximum of 20 wallets for this network
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WalletList;