import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Settings, 
  Users, 
  Shield, 
  MessageSquare, 
  Camera, 
  X, 
  UserPlus, 
  UserMinus,
  Crown,
  Edit3,
  Save,
  Upload
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { chatAPI } from '../services/api';

const ChannelSettings = ({ channel, currentUser, isOpen, onClose, onUpdateChannel }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [editingMode, setEditingMode] = useState(false);
  const [channelName, setChannelName] = useState(channel?.name || '');
  const [channelDescription, setChannelDescription] = useState(channel?.description || '');
  const [allowAllMessages, setAllowAllMessages] = useState(channel?.allow_all_messages || false);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newSubscriberUsername, setNewSubscriberUsername] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  // Mock data for administrators and subscribers
  const [administrators, setAdministrators] = useState([
    {
      id: currentUser?.id,
      username: currentUser?.username,
      name: currentUser?.name,
      avatar: currentUser?.avatar,
      role: 'owner'
    }
  ]);

  const [subscribers, setSubscribers] = useState([
    {
      id: 'sub1',
      username: 'user1',
      name: 'Alexey Petrov',
      avatar: null,
      joined_date: '2024-01-15'
    },
    {
      id: 'sub2', 
      username: 'user2',
      name: 'Maria Smirnova',
      avatar: null,
      joined_date: '2024-01-12'
    },
    {
      id: 'sub3',
      username: 'user3', 
      name: 'Ivan Ivanov',
      avatar: null,
      joined_date: '2024-01-10'
    }
  ]);

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'admins', label: 'Administrators', icon: Shield },
    { id: 'subscribers', label: 'Subscribers', icon: Users },
    { id: 'permissions', label: 'Permissions', icon: MessageSquare }
  ];

  const isOwner = () => {
    return channel?.owner_id === currentUser?.id;
  };

  const isAdmin = () => {
    return administrators.some(admin => admin.id === currentUser?.id);
  };

  const handleSaveChanges = async () => {
    // Валидация названия канала
    if (!channelName || !channelName.trim()) {
      toast({
        title: "Validation Error",
        description: "Channel name cannot be empty.",
        variant: "destructive"
      });
      return;
    }

    try {
      const updateData = {
        name: channelName.trim(),
        description: channelDescription.trim(),
        allow_all_messages: allowAllMessages
      };

      // Вызываем API для обновления
      const updatedChannel = await chatAPI.updateChat(channel.id, updateData);

      // Уведомляем родительский компонент об обновлении
      if (onUpdateChannel) {
        await onUpdateChannel(updatedChannel);
      }

      toast({
        title: "Channel Updated",
        description: "Channel settings have been saved successfully.",
      });

      setEditingMode(false);
    } catch (error) {
      console.error('Error updating channel:', error);
      toast({
        title: "Update Failed",
        description: error.response?.data?.detail || "Failed to update channel settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAvatarUpload = async (file) => {
    if (!file) return;

    setIsUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result;
        
        const updatedChannel = {
          ...channel,
          avatar: base64
        };

        if (onUpdateChannel) {
          await onUpdateChannel(updatedChannel);
        }

        toast({
          title: "Avatar Updated",
          description: "Channel avatar has been updated successfully.",
        });
        
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive"
      });
      setIsUploading(false);
    }
  };

  const handleAddAdmin = () => {
    if (!newAdminUsername.trim()) return;

    const newAdmin = {
      id: `admin_${Date.now()}`,
      username: newAdminUsername,
      name: newAdminUsername,
      avatar: null,
      role: 'admin'
    };

    setAdministrators(prev => [...prev, newAdmin]);
    setNewAdminUsername('');
    
    toast({
      title: "Administrator Added",
      description: `${newAdminUsername} has been added as an administrator.`,
    });
  };

  const handleRemoveAdmin = (adminId) => {
    if (adminId === currentUser?.id) return; // Can't remove owner

    setAdministrators(prev => prev.filter(admin => admin.id !== adminId));
    
    toast({
      title: "Administrator Removed",
      description: "Administrator has been removed.",
    });
  };

  const handleAddSubscriber = () => {
    if (!newSubscriberUsername.trim()) return;

    const newSubscriber = {
      id: `sub_${Date.now()}`,
      username: newSubscriberUsername,
      name: newSubscriberUsername,
      avatar: null,
      joined_date: new Date().toISOString().split('T')[0]
    };

    setSubscribers(prev => [...prev, newSubscriber]);
    setNewSubscriberUsername('');
    
    toast({
      title: "Subscriber Added",
      description: `${newSubscriberUsername} has been added to the channel.`,
    });
  };

  const handleRemoveSubscriber = (subscriberId) => {
    setSubscribers(prev => prev.filter(sub => sub.id !== subscriberId));
    
    toast({
      title: "Subscriber Removed",
      description: "Subscriber has been removed from the channel.",
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isOpen || !channel) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 bg-slate-900 border-slate-700">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 bg-slate-800 border-r border-slate-700">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-6">Channel Settings</h2>
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                          : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">
                {tabs.find(tab => tab.id === activeTab)?.label}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  {/* Channel Avatar */}
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={channel.avatar} />
                        <AvatarFallback className="bg-emerald-600 text-white text-2xl">
                          {channel.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isOwner() && (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white hover:bg-emerald-700 transition-colors"
                        >
                          {isUploading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Camera className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleAvatarUpload(e.target.files[0])}
                        className="hidden"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{channel.name}</h3>
                      <p className="text-gray-400">
                        {subscribers.length} subscribers
                      </p>
                    </div>
                  </div>

                  {/* Channel Info */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-white">Channel Information</h4>
                      {isOwner() && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingMode(!editingMode)}
                          className="border-slate-600 text-gray-300 hover:text-white"
                        >
                          {editingMode ? (
                            <>
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </>
                          ) : (
                            <>
                              <Edit3 className="w-4 h-4 mr-2" />
                              Edit
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {editingMode ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Channel Name
                          </label>
                          <Input
                            value={channelName}
                            onChange={(e) => setChannelName(e.target.value)}
                            className="bg-slate-800 border-slate-600 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Description
                          </label>
                          <textarea
                            value={channelDescription}
                            onChange={(e) => setChannelDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 text-white rounded-md resize-none"
                            rows={4}
                          />
                        </div>
                        <Button
                          onClick={handleSaveChanges}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">
                            Channel Name
                          </label>
                          <p className="text-white">{channel.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">
                            Description
                          </label>
                          <p className="text-gray-300">{channel.description || 'No description'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">
                            Channel Type
                          </label>
                          <div className="flex items-center space-x-2">
                            <Badge variant={channel.is_public ? 'default' : 'secondary'}>
                              {channel.is_public ? 'Public' : 'Private'}
                            </Badge>
                          </div>
                        </div>
                        {channel.channel_username && (
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                              Username
                            </label>
                            <p className="text-gray-300">@{channel.channel_username}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Administrators Tab */}
              {activeTab === 'admins' && (
                <div className="space-y-6">
                  {isOwner() && (
                    <div className="flex space-x-2">
                      <Input
                        value={newAdminUsername}
                        onChange={(e) => setNewAdminUsername(e.target.value)}
                        placeholder="Enter username to add as admin"
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                      <Button
                        onClick={handleAddAdmin}
                        disabled={!newAdminUsername.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Admin
                      </Button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {administrators.map((admin) => (
                      <div key={admin.id} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={admin.avatar} />
                            <AvatarFallback className="bg-emerald-600 text-white">
                              {admin.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="text-white font-medium">{admin.name}</h4>
                            <p className="text-gray-400 text-sm">@{admin.username}</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            {admin.role === 'owner' ? (
                              <>
                                <Crown className="w-4 h-4 text-yellow-400" />
                                <Badge className="bg-yellow-500/20 text-yellow-400">Owner</Badge>
                              </>
                            ) : (
                              <>
                                <Shield className="w-4 h-4 text-blue-400" />
                                <Badge className="bg-blue-500/20 text-blue-400">Admin</Badge>
                              </>
                            )}
                          </div>
                        </div>
                        {isOwner() && admin.role !== 'owner' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveAdmin(admin.id)}
                            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subscribers Tab */}
              {activeTab === 'subscribers' && (
                <div className="space-y-6">
                  {isAdmin() && (
                    <div className="flex space-x-2">
                      <Input
                        value={newSubscriberUsername}
                        onChange={(e) => setNewSubscriberUsername(e.target.value)}
                        placeholder="Enter username to add as subscriber"
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                      <Button
                        onClick={handleAddSubscriber}
                        disabled={!newSubscriberUsername.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Subscriber
                      </Button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {subscribers.map((subscriber) => (
                      <div key={subscriber.id} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={subscriber.avatar} />
                            <AvatarFallback className="bg-gray-600 text-white">
                              {subscriber.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="text-white font-medium">{subscriber.name}</h4>
                            <p className="text-gray-400 text-sm">@{subscriber.username}</p>
                            <p className="text-gray-500 text-xs">Joined {formatDate(subscriber.joined_date)}</p>
                          </div>
                        </div>
                        {isAdmin() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveSubscriber(subscriber.id)}
                            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Permissions Tab */}
              {activeTab === 'permissions' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">Message Permissions</h4>
                    
                    <div className="p-4 bg-slate-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-white font-medium">Allow all subscribers to send messages</h5>
                          <p className="text-gray-400 text-sm">
                            When enabled, all subscribers can send messages. When disabled, only administrators can send messages.
                          </p>
                        </div>
                        {isOwner() && (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={allowAllMessages}
                              onChange={(e) => setAllowAllMessages(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                          </label>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-slate-800 rounded-lg">
                      <h5 className="text-white font-medium mb-2">Current Permissions</h5>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Send Messages</span>
                          <Badge variant={allowAllMessages ? 'default' : 'secondary'}>
                            {allowAllMessages ? 'All Subscribers' : 'Admins Only'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Manage Channel</span>
                          <Badge variant="secondary">Admins Only</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Add/Remove Members</span>
                          <Badge variant="secondary">Admins Only</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChannelSettings;