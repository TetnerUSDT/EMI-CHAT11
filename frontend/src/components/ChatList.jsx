import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Search, Plus, Lock, Star, MessageCircle, Pin } from 'lucide-react';
import UserSearch from './UserSearch';
import { useToast } from '../hooks/use-toast';
import { chatAPI, userAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const ChatList = ({ 
  chats, 
  selectedChat, 
  onSelectChat, 
  onChatCreated,
  onChatUpdate,
  isLoading,
  currentUser 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [usersData, setUsersData] = useState({});
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    loadUsersData();
  }, [chats]);

  // Auto-search as user types
  useEffect(() => {
    if (searchQuery.trim()) {
      const localResults = performLocalSearch(searchQuery);
      setSearchResults(localResults);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, usersData, chats]);

  const loadUsersData = async () => {
    if (!chats || chats.length === 0) return;

    setIsLoadingUsers(true);

    // Get all unique participant IDs from personal chats
    const participantIds = new Set();
    chats.forEach(chat => {
      if (chat.chat_type === 'personal') {
        const otherParticipantId = chat.participants.find(id => id !== currentUser.id);
        if (otherParticipantId) {
          participantIds.add(otherParticipantId);
        }
      }
    });

    // Load user data for all participants in parallel (much faster!)
    const userPromises = Array.from(participantIds).map(async (userId) => {
      try {
        const userData = await userAPI.getUserProfile(userId);
        return { userId, userData };
      } catch (error) {
        console.error('Error loading user data for', userId, ':', error);
        return { userId, userData: null };
      }
    });

    try {
      const results = await Promise.allSettled(userPromises);
      const newUsersData = {};
      
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.userData) {
          newUsersData[result.value.userId] = result.value.userData;
        }
      });
      
      setUsersData(prev => ({ ...prev, ...newUsersData }));
    } catch (error) {
      console.error('Error loading users data:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    // First, try local search through loaded user data
    const localResults = performLocalSearch(searchQuery);
    
    setIsSearching(true);
    try {
      // Also search through chat API
      const apiResults = await chatAPI.searchChats(searchQuery, 'personal');
      
      // Combine and deduplicate results
      const allResults = [...localResults];
      apiResults.forEach(apiResult => {
        if (!allResults.find(local => local.id === apiResult.id)) {
          allResults.push(apiResult);
        }
      });
      
      setSearchResults(allResults);
    } catch (error) {
      console.error('Search error:', error);
      // If API fails, use local results
      setSearchResults(localResults);
    } finally {
      setIsSearching(false);
    }
  };

  const performLocalSearch = (query) => {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase().replace(/^@/, ''); // Remove @ if present
    
    return chats.filter(chat => {
      if (chat.chat_type === 'personal') {
        const otherParticipantId = chat.participants.find(id => id !== currentUser.id);
        const userData = usersData[otherParticipantId];
        
        if (userData && userData.username) {
          const username = userData.username.toLowerCase();
          // Search by username (with or without @)
          // Support partial matches: "mon" should find "monkey"
          return username.includes(searchTerm) || 
                 username.startsWith(searchTerm) ||
                 `@${username}`.includes(query.toLowerCase());
        }
        
        // Fallback: search by participant ID or chat name
        const fallbackName = chat.name?.toLowerCase() || otherParticipantId?.toLowerCase() || '';
        return fallbackName.includes(searchTerm);
      } else {
        // For group chats, search by chat name
        const chatName = chat.name?.toLowerCase() || '';
        return chatName.includes(searchTerm);
      }
    });
  };

  const handleTogglePin = async (chatId, event) => {
    event.stopPropagation(); // Prevent chat selection
    
    try {
      const result = await chatAPI.toggleChatPin(chatId);
      
      // Update chat in the list
      onChatUpdate && onChatUpdate(chatId, { is_pinned: result.is_pinned });
      
      toast({
        title: result.is_pinned ? "Chat Pinned" : "Chat Unpinned",
        description: result.message,
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast({
        title: "Error",
        description: "Failed to toggle pin. Please try again.",
        variant: "destructive"
      });
    }
  };

  const sortChats = (chats) => {
    return [...chats].sort((a, b) => {
      // First, sort by pinned status (pinned chats first)
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      
      // Then sort by last message time (newest first)
      const timeA = a.last_message_time ? new Date(a.last_message_time) : new Date(0);
      const timeB = b.last_message_time ? new Date(b.last_message_time) : new Date(0);
      return timeB - timeA;
    });
  };

  const formatTime = (date) => {
    if (!date) return '';
    
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      return `${Math.floor(diffInHours / 24)}d`;
    }
  };

  const getChatDisplayInfo = (chat) => {
    if (chat.chat_type === 'personal') {
      // For personal chats, we need to find the other participant
      const otherParticipantId = chat.participants.find(id => id !== currentUser.id);
      const userData = usersData[otherParticipantId];
      
      if (userData) {
        // Use real user data
        return {
          name: userData.username ? `@${userData.username}` : '@Anonymous',
          avatar: userData.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${userData.id}`,
          isOnline: userData.is_online,
          isSecret: false,
          trustScore: userData.trust_score
        };
      } else if (isLoadingUsers) {
        // Show loading state instead of wrong fallback
        return {
          name: 'Loading...',
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=loading`,
          isOnline: false,
          isSecret: false,
          trustScore: 0
        };
      } else {
        // Better fallback - use chat name if available and reasonable
        const fallbackName = chat.name && chat.name !== `User ${otherParticipantId?.slice(-6)}` 
          ? chat.name 
          : 'Unknown User';
          
        return {
          name: fallbackName.startsWith('@') ? fallbackName : `@${fallbackName}`,
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${otherParticipantId || 'unknown'}`,
          isOnline: false,
          isSecret: false,
          trustScore: 0
        };
      }
    } else {
      return {
        name: chat.name || 'Group Chat',
        avatar: chat.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${chat.id}`,
        isOnline: false,
        isSecret: chat.is_secret || false,
        memberCount: chat.participants?.length || 0
      };
    }
  };

  return (
    <div className="w-full lg:w-80 h-full bg-slate-800 border-r border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Chats</h2>
          <UserSearch onChatCreated={onChatCreated} />
        </div>
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={t('searchChats')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading || isLoadingUsers ? (
          <div className="p-8 text-center text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto mb-2"></div>
            <p>{isLoading ? 'Loading chats...' : 'Loading user data...'}</p>
          </div>
        ) : (searchQuery ? searchResults : chats).length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No chats yet</p>
            <p className="text-xs mt-1">Start a new conversation!</p>
          </div>
        ) : (
          (searchQuery ? searchResults : sortChats(chats)).map((chat) => {
            const displayInfo = getChatDisplayInfo(chat);
            const isSelected = selectedChat?.id === chat.id;
            
            return (
              <div
                key={chat.id}
                className={`p-4 border-b border-slate-700/50 cursor-pointer transition-all duration-200 hover:bg-slate-700/50 ${
                  isSelected ? 'bg-emerald-600/20 border-l-4 border-l-emerald-500' : ''
                }`}
                onClick={() => {
                  // Передаем чат с предзагруженными данными пользователя
                  const otherParticipantId = chat.chat_type === 'personal' 
                    ? chat.participants.find(id => id !== currentUser.id)
                    : null;
                  const userData = otherParticipantId ? usersData[otherParticipantId] : null;
                  
                  onSelectChat({
                    ...chat,
                    preloadedUserData: userData
                  });
                }}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={displayInfo.avatar} />
                      <AvatarFallback className="bg-emerald-600 text-white">
                        {displayInfo.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {displayInfo.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-slate-800 rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-white truncate">
                          {displayInfo.name}
                        </h3>
                        {displayInfo.isSecret && (
                          <Lock className="w-3 h-3 text-yellow-400" />
                        )}
                        {displayInfo.trustScore !== undefined && (
                          <div className="flex items-center space-x-1 bg-yellow-500/20 px-1.5 py-0.5 rounded-full">
                            <Star className="w-2.5 h-2.5 text-yellow-400" />
                            <span className="text-xs font-medium text-yellow-400">
                              {displayInfo.trustScore}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Pin icon */}
                        <button
                          onClick={(e) => handleTogglePin(chat.id, e)}
                          className="p-1 rounded hover:bg-slate-600/50 transition-colors"
                          title={chat.is_pinned ? "Unpin chat" : "Pin chat"}
                        >
                          <Pin 
                            className={`w-3 h-3 transition-all duration-200 ${
                              chat.is_pinned 
                                ? 'text-blue-400 fill-blue-400 rotate-45' 
                                : 'text-gray-500 hover:text-gray-400'
                            }`} 
                          />
                        </button>
                        <span className="text-xs text-gray-400">
                          {chat.last_message_time ? formatTime(chat.last_message_time) : ''}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-400 truncate">
                        {chat.last_message_id ? 'New message' : 'No messages yet'}
                      </p>
                      {displayInfo.memberCount && (
                        <span className="text-xs text-gray-500">
                          {displayInfo.memberCount} members
                        </span>
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

export default ChatList;