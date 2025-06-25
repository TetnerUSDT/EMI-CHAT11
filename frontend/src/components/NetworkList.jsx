import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Search, Plus, Wallet, Star, TrendingUp, ArrowLeft } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useLanguage } from '../contexts/LanguageContext';

const NetworkList = ({ 
  networks, 
  selectedNetwork, 
  onSelectNetwork, 
  onNetworkAdded,
  isLoading,
  walletsCount = {},
  showBackButton = false,
  onBackToMenu
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const { toast } = useToast();
  const { t } = useLanguage();

  // Auto-search as user types
  useEffect(() => {
    if (searchQuery.trim()) {
      const localResults = performLocalSearch(searchQuery);
      setSearchResults(localResults);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, networks]);

  const performLocalSearch = (query) => {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase();
    
    return networks.filter(network => {
      return network.name.toLowerCase().includes(searchTerm) ||
             network.symbol.toLowerCase().includes(searchTerm);
    });
  };

  const handleAddNetwork = () => {
    toast({
      title: "Add Network",
      description: "Network management coming soon!",
    });
  };

  const formatWalletCount = (count) => {
    if (count === 0) return 'No wallets';
    if (count === 1) return '1 wallet';
    return `${count} wallets`;
  };

  const sortNetworks = (networks) => {
    return [...networks].sort((a, b) => {
      // Default network first
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      
      // Then sort by wallet count (descending)
      const aCount = walletsCount[a.id] || 0;
      const bCount = walletsCount[b.id] || 0;
      if (aCount !== bCount) return bCount - aCount;
      
      // Finally sort alphabetically
      return a.name.localeCompare(b.name);
    });
  };

  return (
    <div className="w-full lg:w-80 h-full bg-slate-800 border-r border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {showBackButton && onBackToMenu && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToMenu}
                className="text-gray-400 hover:text-white lg:hidden"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <h2 className="text-xl font-bold text-white">Networks</h2>
          </div>
          <Button
            size="sm"
            onClick={handleAddNetwork}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search networks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Networks List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto mb-2"></div>
            <p>Loading networks...</p>
          </div>
        ) : (searchQuery ? searchResults : networks).length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No networks found</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        ) : (
          (searchQuery ? searchResults : sortNetworks(networks)).map((network) => {
            const isSelected = selectedNetwork?.id === network.id;
            const walletCount = walletsCount[network.id] || 0;
            
            return (
              <div
                key={network.id}
                className={`p-4 border-b border-slate-700/50 cursor-pointer transition-all duration-200 hover:bg-slate-700/50 ${
                  isSelected ? 'bg-emerald-600/20 border-l-4 border-l-emerald-500' : ''
                }`}
                onClick={() => onSelectNetwork(network)}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${network.color} flex items-center justify-center`}>
                      <span className="text-white font-bold text-sm">
                        {network.symbol}
                      </span>
                    </div>
                    {network.isDefault && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 border-2 border-slate-800 rounded-full flex items-center justify-center">
                        <Star className="w-2 h-2 text-slate-800 fill-slate-800" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-white truncate">
                          {network.name}
                        </h3>
                        {network.isDefault && (
                          <Badge className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            Default
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-400">
                        {formatWalletCount(walletCount)}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {network.symbol}
                        </span>
                      </div>
                    </div>
                    
                    {/* Network info */}
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span>Chain: {network.chainId}</span>
                      {walletCount > 0 && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span>Active</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NetworkList;