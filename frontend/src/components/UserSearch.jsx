import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Search, Plus, Star, MessageCircle } from 'lucide-react';
import { userAPI, chatAPI } from '../services/api';
import { useToast } from '../hooks/use-toast';

const UserSearch = ({ onChatCreated }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Remove @ if user typed it manually
      const cleanQuery = searchQuery.replace(/^@/, '');
      const results = await userAPI.searchUsers(cleanQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: "Failed to search users. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateChat = async (user) => {
    setIsCreatingChat(true);
    try {
      const newChat = await chatAPI.createChat({
        chat_type: 'personal',
        participant_id: user.id
      });

      toast({
        title: "Chat Created",
        description: `Started conversation with @${user.username}`,
      });

      setIsOpen(false);
      setSearchQuery('');
      setSearchResults([]);
      
      if (onChatCreated) {
        onChatCreated(newChat);
      }
    } catch (error) {
      console.error('Chat creation error:', error);
      toast({
        title: "Chat Creation Failed",
        description: error.response?.data?.detail || "Failed to create chat. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingChat(false);
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Start New Chat</DialogTitle>
          <DialogDescription className="text-gray-400">
            Search for users by @username or wallet address
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by @username or wallet address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-gray-400"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {searchResults.length === 0 && searchQuery && !isSearching && (
              <div className="text-center py-8 text-gray-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No users found</p>
              </div>
            )}

            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center space-x-3 p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-emerald-600 text-white">
                    {user.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-white truncate">
                      @{user.username}
                    </p>
                    <div className="flex items-center space-x-1 bg-yellow-500/20 px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span className="text-xs font-medium text-yellow-400">
                        {user.trust_score}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-sm text-gray-400 truncate">
                      {formatAddress(user.wallet_address)}
                    </p>
                    <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-400">
                      {user.network}
                    </Badge>
                    {user.is_online && (
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    )}
                  </div>
                </div>
                
                <Button
                  size="sm"
                  onClick={() => handleCreateChat(user)}
                  disabled={isCreatingChat}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Instructions */}
          {searchResults.length === 0 && !searchQuery && (
            <div className="text-center py-8 text-gray-400">
              <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Enter a @username or wallet address to start searching</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserSearch;