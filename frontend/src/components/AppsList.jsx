import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Search, Star, Download, Pin, ExternalLink, Users, Clock, Heart } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useLanguage } from '../contexts/LanguageContext';

const AppsList = ({ 
  apps, 
  selectedApp, 
  onSelectApp, 
  onAppInstalled,
  isLoading,
  currentUser 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [pinnedApps, setPinnedApps] = useState([]);
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
  }, [searchQuery, apps]);

  const performLocalSearch = (query) => {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase();
    
    return apps.filter(app => {
      return app.name.toLowerCase().includes(searchTerm) ||
             app.description.toLowerCase().includes(searchTerm) ||
             app.category.toLowerCase().includes(searchTerm) ||
             app.developer.toLowerCase().includes(searchTerm);
    });
  };

  const handleTogglePin = async (appId, event) => {
    event.stopPropagation(); // Prevent app selection
    
    try {
      const app = apps.find(a => a.id === appId);
      const isPinned = pinnedApps.includes(appId);
      
      if (isPinned) {
        setPinnedApps(prev => prev.filter(id => id !== appId));
        toast({
          title: "App Unpinned",
          description: `${app.name} has been removed from pinned apps.`,
        });
      } else {
        setPinnedApps(prev => [...prev, appId]);
        toast({
          title: "App Pinned",
          description: `${app.name} has been pinned to the top.`,
        });
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast({
        title: "Error",
        description: "Failed to toggle pin. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddToWishlist = async (appId, event) => {
    event.stopPropagation();
    
    const app = apps.find(a => a.id === appId);
    toast({
      title: "Added to Wishlist",
      description: `${app.name} has been added to your wishlist.`,
    });
  };

  const sortApps = (apps) => {
    return [...apps].sort((a, b) => {
      // First, sort by pinned status (pinned apps first)
      const aPinned = pinnedApps.includes(a.id);
      const bPinned = pinnedApps.includes(b.id);
      
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      
      // Then sort by rating (highest first)
      if (a.rating !== b.rating) return b.rating - a.rating;
      
      // Finally sort by installation count
      return b.installCount - a.installCount;
    });
  };

  const formatInstallCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatLastUpdate = (date) => {
    const now = new Date();
    const diffInDays = Math.floor((now - new Date(date)) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  return (
    <div className="w-full lg:w-80 h-full bg-slate-800 border-r border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Apps</h2>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => {
              toast({
                title: "App Store",
                description: "Browse more apps in the store!",
              });
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Store
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Apps List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto mb-2"></div>
            <p>Loading apps...</p>
          </div>
        ) : (searchQuery ? searchResults : apps).length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <ExternalLink className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No apps found</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        ) : (
          (searchQuery ? searchResults : sortApps(apps)).map((app) => {
            const isSelected = selectedApp?.id === app.id;
            const isPinned = pinnedApps.includes(app.id);
            
            return (
              <div
                key={app.id}
                className={`p-4 border-b border-slate-700/50 cursor-pointer transition-all duration-200 hover:bg-slate-700/50 ${
                  isSelected ? 'bg-emerald-600/20 border-l-4 border-l-emerald-500' : ''
                }`}
                onClick={() => onSelectApp(app)}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12 rounded-xl">
                      <AvatarImage src={app.icon} />
                      <AvatarFallback className="bg-emerald-600 text-white rounded-xl">
                        {app.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {app.isNew && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">!</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-white truncate">
                          {app.name}
                        </h3>
                        <Badge 
                          variant="secondary" 
                          className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30"
                        >
                          {app.category}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1">
                        {/* Pin button */}
                        <button
                          onClick={(e) => handleTogglePin(app.id, e)}
                          className="p-1 rounded hover:bg-slate-600/50 transition-colors"
                          title={isPinned ? "Unpin app" : "Pin app"}
                        >
                          <Pin 
                            className={`w-3 h-3 transition-all duration-200 ${
                              isPinned 
                                ? 'text-blue-400 fill-blue-400 rotate-45' 
                                : 'text-gray-500 hover:text-gray-400'
                            }`} 
                          />
                        </button>
                        
                        {/* Wishlist button */}
                        <button
                          onClick={(e) => handleAddToWishlist(app.id, e)}
                          className="p-1 rounded hover:bg-slate-600/50 transition-colors"
                          title="Add to wishlist"
                        >
                          <Heart className="w-3 h-3 text-gray-500 hover:text-red-400 transition-colors" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed overflow-hidden text-ellipsis" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {app.description}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs text-gray-400">{app.rating}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Download className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">
                            {formatInstallCount(app.installCount)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-500">
                          {formatLastUpdate(app.lastUpdate)}
                        </span>
                      </div>
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

export default AppsList;