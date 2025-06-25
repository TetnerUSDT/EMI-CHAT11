import React, { useState } from 'react';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Search, Plus, Users, Lock, Star, UserPlus } from 'lucide-react';
import { chatAPI, userAPI } from '../services/api';
import { useToast } from '../hooks/use-toast';

const GroupCreator = ({ onGroupCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [secretTimer, setSecretTimer] = useState(300); // 5 minutes default
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleSearchUsers = async () => {
    if (!userSearchQuery.trim()) {
      setUserSearchResults([]);
      return;
    }

    try {
      const results = await userAPI.searchUsers(userSearchQuery);
      setUserSearchResults(results);
    } catch (error) {
      console.error('User search error:', error);
    }
  };

  const handleAddUser = (user) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setUserSearchQuery('');
    setUserSearchResults([]);
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setIsCreating(true);
    try {
      const newGroup = await chatAPI.createChat({
        name: groupName,
        chat_type: isSecret ? 'secret' : 'group',
        description: groupDescription,
        participants: selectedUsers.map(u => u.id),
        is_secret: isSecret,
        secret_timer: isSecret ? secretTimer : null
      });

      toast({
        title: "Group Created",
        description: `Successfully created group "${groupName}"`,
      });

      setIsOpen(false);
      setGroupName('');
      setGroupDescription('');
      setSelectedUsers([]);
      setIsSecret(false);
      
      if (onGroupCreated) {
        onGroupCreated(newGroup);
      }
    } catch (error) {
      console.error('Group creation error:', error);
      toast({
        title: "Group Creation Failed",
        description: error.response?.data?.detail || "Failed to create group. Please try again.",
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
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a group to chat with multiple people
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Group Name *
            </label>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="Enter group description..."
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white placeholder-gray-400 rounded-md resize-none"
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isSecret"
              checked={isSecret}
              onChange={(e) => setIsSecret(e.target.checked)}
              className="w-4 h-4 text-emerald-600 bg-slate-700 border-slate-600 rounded focus:ring-emerald-500"
            />
            <label htmlFor="isSecret" className="text-sm text-gray-300">
              Secret group (messages auto-delete)
            </label>
          </div>

          {isSecret && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Auto-delete timer (seconds)
              </label>
              <Input
                type="number"
                value={secretTimer}
                onChange={(e) => setSecretTimer(parseInt(e.target.value))}
                min="30"
                max="86400"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Add Members
            </label>
            <div className="flex space-x-2 mb-2">
              <Input
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                onKeyPress={(e) => e.key === 'Enter' && handleSearchUsers()}
              />
              <Button
                type="button"
                onClick={handleSearchUsers}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {userSearchResults.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-1 mb-2">
                {userSearchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 bg-slate-700 rounded cursor-pointer hover:bg-slate-600"
                    onClick={() => handleAddUser(user)}
                  >
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-emerald-600 text-white text-xs">
                          {user.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">@{user.username}</span>
                    </div>
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                  </div>
                ))}
              </div>
            )}

            {selectedUsers.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Selected members:</p>
                {selectedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 bg-slate-600 rounded">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-emerald-600 text-white text-xs">
                          {user.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">@{user.username}</span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveUser(user.id)}
                      className="text-red-400 hover:text-red-300 h-6 w-6 p-0"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

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
              disabled={isCreating || !groupName.trim()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isCreating ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const GroupList = ({ 
  groups, 
  selectedGroup, 
  onSelectGroup, 
  searchQuery, 
  onSearchChange, 
  onGroupCreated,
  isLoading,
  currentUser 
}) => {
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

  const filteredGroups = groups.filter(group => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return group.name?.toLowerCase().includes(query) || 
           group.description?.toLowerCase().includes(query);
  });

  return (
    <div className="w-full lg:w-80 h-full bg-slate-800 border-r border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Groups</h2>
          <GroupCreator onGroupCreated={onGroupCreated} />
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Group List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto mb-2"></div>
            <p>Loading groups...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{searchQuery ? 'No groups found' : 'No groups yet'}</p>
            <p className="text-xs mt-1">{searchQuery ? 'Try a different search' : 'Create your first group!'}</p>
          </div>
        ) : (
          filteredGroups.map((group) => {
            const isSelected = selectedGroup?.id === group.id;
            
            return (
              <div
                key={group.id}
                className={`p-4 border-b border-slate-700/50 cursor-pointer transition-all duration-200 hover:bg-slate-700/50 ${
                  isSelected ? 'bg-emerald-600/20 border-l-4 border-l-emerald-500' : ''
                }`}
                onClick={() => onSelectGroup(group)}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={group.avatar} />
                      <AvatarFallback className="bg-emerald-600 text-white">
                        <Users className="w-6 h-6" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-white truncate">
                          {group.name}
                        </h3>
                        {group.is_secret && (
                          <Lock className="w-3 h-3 text-yellow-400" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {group.last_message_time && (
                          <span className="text-xs text-gray-400">
                            {formatTime(group.last_message_time)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-400 truncate">
                        {group.description || (group.last_message_id ? 'New message' : 'No messages yet')}
                      </p>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Users className="w-3 h-3" />
                        <span>{group.participants?.length || 0}</span>
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

export default GroupList;