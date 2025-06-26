import React, { useState } from 'react';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Search, Plus, Hash, Users, Eye, Lock, Settings } from 'lucide-react';
import { chatAPI } from '../services/api';
import { useToast } from '../hooks/use-toast';
import { useLanguage } from '../contexts/LanguageContext';
import ChannelSettings from './ChannelSettings';

const ChannelCreator = ({ onChannelCreated }) => {
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [channelUsername, setChannelUsername] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!channelName.trim()) return;

    setIsCreating(true);
    try {
      const newChannel = await chatAPI.createChat({
        name: channelName,
        chat_type: 'channel',
        description: channelDescription,
        is_public: isPublic,
        channel_username: isPublic ? channelUsername : null
      });

      toast({
        title: "Channel Created",
        description: `Successfully created channel "${channelName}"`,
      });

      setIsOpen(false);
      setChannelName('');
      setChannelDescription('');
      setChannelUsername('');
      
      if (onChannelCreated) {
        onChannelCreated(newChannel);
      }
    } catch (error) {
      console.error('Channel creation error:', error);
      toast({
        title: "Channel Creation Failed",
        description: error.response?.data?.detail || "Failed to create channel. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
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
          <DialogTitle>Create New Channel</DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a channel to broadcast messages to multiple subscribers
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleCreateChannel} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Channel Name *
            </label>
            <Input
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder={t('enterChannelName')}
              className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={channelDescription}
              onChange={(e) => setChannelDescription(e.target.value)}
              placeholder={t('enterChannelDescription')}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white placeholder-gray-400 rounded-md resize-none"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 text-emerald-600 bg-slate-700 border-slate-600 rounded focus:ring-emerald-500"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-300">
              Public channel (can be found in search)
            </label>
          </div>

          {isPublic && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Channel Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">@</span>
                <Input
                  value={channelUsername}
                  onChange={(e) => setChannelUsername(e.target.value)}
                  placeholder="channel_username"
                  className="pl-8 bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                />
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !channelName.trim()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isCreating ? 'Creating...' : 'Create Channel'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ChannelList = ({ 
  channels, 
  selectedChannel, 
  onSelectChannel, 
  searchQuery, 
  onSearchChange, 
  onChannelCreated,
  onUpdateChannel,
  isLoading,
  currentUser 
}) => {
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showChannelSettings, setShowChannelSettings] = useState(false);
  const [settingsChannel, setSettingsChannel] = useState(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await chatAPI.searchChats(searchQuery, 'channel');
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: "Failed to search channels. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubscribe = async (channel) => {
    try {
      await chatAPI.subscribeToChannel(channel.id);
      toast({
        title: "Subscribed",
        description: `Successfully subscribed to ${channel.name}`,
      });
      
      if (onChannelCreated) {
        onChannelCreated(channel);
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      toast({
        title: "Subscribe Failed",
        description: error.response?.data?.detail || "Failed to subscribe to channel.",
        variant: "destructive"
      });
    }
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

  const displayChannels = searchQuery ? searchResults : channels;
  const isSubscribed = (channel) => channel.participants?.includes(currentUser?.id);

  return (
    <div className="w-full lg:w-80 h-full bg-slate-800 border-r border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Channels</h2>
          <ChannelCreator onChannelCreated={onChannelCreated} />
        </div>
        
        {/* Search */}
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isSearching}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isSearching ? '...' : 'Search'}
          </Button>
        </div>
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto mb-2"></div>
            <p>Loading channels...</p>
          </div>
        ) : displayChannels.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Hash className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{searchQuery ? 'No channels found' : 'No channels yet'}</p>
            <p className="text-xs mt-1">{searchQuery ? 'Try a different search' : 'Create your first channel!'}</p>
          </div>
        ) : (
          displayChannels.map((channel) => {
            const isSelected = selectedChannel?.id === channel.id;
            const subscribed = isSubscribed(channel);
            
            return (
              <div
                key={channel.id}
                className={`p-4 border-b border-slate-700/50 cursor-pointer transition-all duration-200 hover:bg-slate-700/50 ${
                  isSelected ? 'bg-emerald-600/20 border-l-4 border-l-emerald-500' : ''
                }`}
                onClick={() => subscribed && onSelectChannel(channel)}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={channel.avatar} />
                      <AvatarFallback className="bg-emerald-600 text-white">
                        <Hash className="w-6 h-6" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-white truncate">
                          {channel.name}
                        </h3>
                        {channel.is_public ? (
                          <Eye className="w-3 h-3 text-green-400" />
                        ) : (
                          <Lock className="w-3 h-3 text-yellow-400" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {channel.last_message_time && (
                          <span className="text-xs text-gray-400">
                            {formatTime(channel.last_message_time)}
                          </span>
                        )}
                        {!subscribed && searchQuery && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubscribe(channel);
                            }}
                            className="text-xs bg-emerald-600 hover:bg-emerald-700"
                          >
                            Join
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-400 truncate">
                        {channel.description || (channel.last_message_id ? 'New message' : 'No messages yet')}
                      </p>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Users className="w-3 h-3" />
                        <span>{channel.subscriber_count || 0}</span>
                      </div>
                    </div>
                    
                    {channel.channel_username && (
                      <p className="text-xs text-gray-500 mt-1">@{channel.channel_username}</p>
                    )}
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

export default ChannelList;