import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ChatList from './ChatList';
import ChannelList from './ChannelList';
import GroupList from './GroupList';
import AppsList from './AppsList';
import ChatWindow from './ChatWindow';
import AppDetails from './AppDetails';
import WalletInterface from './WalletInterface';
import AIAssistant from './AIAssistant';
import Settings from './Settings';
import { MessageCircle, Grid3X3 } from 'lucide-react';
import { chatAPI } from '../services/api';
import { useToast } from '../hooks/use-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { mockApps } from '../data/mockApps';

const MainApp = ({ user, onLogout, onUserUpdate }) => {
  const [activeView, setActiveView] = useState('chats');
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [chats, setChats] = useState([]);
  const [channels, setChannels] = useState([]);
  const [groups, setGroups] = useState([]);
  const [apps, setApps] = useState(mockApps);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(user);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    loadData();
  }, [activeView]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      let data = [];
      if (activeView === 'chats') {
        data = await chatAPI.getChats('personal');
        setChats(data);
      } else if (activeView === 'channels') {
        data = await chatAPI.getChats('channel');
        setChannels(data);
      } else if (activeView === 'groups') {
        const groupData = await chatAPI.getChats('group');
        const secretData = await chatAPI.getChats('secret');
        setGroups([...groupData, ...secretData]);
      } else if (activeView === 'apps') {
        // Apps are loaded from mock data immediately
        setApps(mockApps);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      if (activeView !== 'apps') { // Don't show error for apps since they're mocked
        toast({
          title: "Failed to load data",
          description: "Please try refreshing the page.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setSelectedApp(null); // Clear selected app when selecting chat
  };

  const handleSelectApp = (app) => {
    setSelectedApp(app);
    setSelectedChat(null); // Clear selected chat when selecting app
  };

  const handleSendMessage = async (message) => {
    // This function is now only for handling UI updates
    // Actual sending is done in ChatWindow
    console.log('Message sent from ChatWindow:', message);
  };

  const handleChatCreated = (newItem) => {
    if (activeView === 'chats') {
      setChats(prevChats => [newItem, ...prevChats]);
    } else if (activeView === 'channels') {
      setChannels(prevChannels => [newItem, ...prevChannels]);
    } else if (activeView === 'groups') {
      setGroups(prevGroups => [newItem, ...prevGroups]);
    }
    setSelectedChat(newItem);
    setSelectedApp(null); // Clear selected app
  };

  const handleAppInstalled = (app) => {
    toast({
      title: "App Installed",
      description: `${app.name} has been installed successfully!`,
    });
  };

  const handleChatUpdate = (chatId, updates) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, ...updates } : chat
    ));
  };

  const handleUserUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
    // Also update parent component
    if (onUserUpdate) {
      onUserUpdate(updatedUser);
    }
  };

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    if (chat.chat_type === 'personal') {
      // For personal chats, we would need to get the other participant's info
      // For now, just search by any available name
      return chat.name?.toLowerCase().includes(query);
    }
    return chat.name?.toLowerCase().includes(query);
  });

  return (
    <div className="h-screen bg-slate-900 flex overflow-hidden">
      {/* Sidebar - скрыт на мобильном если открыт чат, приложение или кошелек */}
      <div className={`${(selectedChat || selectedApp || activeView === 'wallet') ? 'hidden lg:block' : 'block'} h-full`}>
        <Sidebar 
          activeView={activeView}
          onViewChange={setActiveView}
          user={user}
          onLogout={onLogout}
        />
      </div>
      
      <div className="flex-1 flex">
        {activeView === 'chats' && (
          <>
            {/* ChatList - скрыт на мобильном если открыт чат */}
            <div className={`${selectedChat ? 'hidden lg:block' : 'block'} w-full lg:w-80 h-full`}>
              <ChatList 
                chats={chats}
                selectedChat={selectedChat}
                onSelectChat={handleSelectChat}
                onChatCreated={handleChatCreated}
                onChatUpdate={handleChatUpdate}
                isLoading={isLoading}
                currentUser={currentUser}
              />
            </div>
            
            {/* ChatWindow - на мобильном открывается на весь экран */}
            <div className={`${selectedChat ? 'block' : 'hidden lg:block'} flex-1`}>
              {selectedChat ? (
                <ChatWindow 
                  chat={selectedChat}
                  currentUser={currentUser}
                  onSendMessage={handleSendMessage}
                  onBack={() => setSelectedChat(null)} // Добавляем onBack для мобильной версии
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-slate-800/50">
                  <div className="text-center text-gray-400">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">Select a chat to start messaging</h3>
                    <p className="text-sm">Choose from your existing conversations or create a new one</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeView === 'channels' && (
          <>
            {/* ChannelList - скрыт на мобильном если открыт канал */}
            <div className={`${selectedChat ? 'hidden lg:block' : 'block'} w-full lg:w-80 h-full`}>
              <ChannelList 
                channels={channels}
                selectedChannel={selectedChat}
                onSelectChannel={handleSelectChat}
                onChannelCreated={handleChatCreated}
                isLoading={isLoading}
                currentUser={currentUser}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
            
            {/* ChatWindow для каналов - на мобильном открывается на весь экран */}
            <div className={`${selectedChat ? 'block' : 'hidden lg:block'} flex-1`}>
              {selectedChat ? (
                <ChatWindow 
                  chat={selectedChat}
                  currentUser={currentUser}
                  onSendMessage={handleSendMessage}
                  onBack={() => setSelectedChat(null)} // Добавляем onBack для мобильной версии
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-slate-800/50">
                  <div className="text-center text-gray-400">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">Select a channel to start viewing</h3>
                    <p className="text-sm">Choose from your subscribed channels or discover new ones</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeView === 'groups' && (
          <>
            {/* GroupList - скрыт на мобильном если открыта группа */}
            <div className={`${selectedChat ? 'hidden lg:block' : 'block'} w-full lg:w-80 h-full`}>
              <GroupList 
                groups={groups}
                selectedGroup={selectedChat}
                onSelectGroup={handleSelectChat}
                onGroupCreated={handleChatCreated}
                isLoading={isLoading}
                currentUser={currentUser}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
            
            {/* ChatWindow для групп - на мобильном открывается на весь экран */}
            <div className={`${selectedChat ? 'block' : 'hidden lg:block'} flex-1`}>
              {selectedChat ? (
                <ChatWindow 
                  chat={selectedChat}
                  currentUser={currentUser}
                  onSendMessage={handleSendMessage}
                  onBack={() => setSelectedChat(null)} // Добавляем onBack для мобильной версии
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-slate-800/50">
                  <div className="text-center text-gray-400">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">Select a group to start chatting</h3>
                    <p className="text-sm">Join your groups or create a new one</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeView === 'apps' && (
          <>
            {/* AppsList - скрыт на мобильном если открыто приложение */}
            <div className={`${selectedApp ? 'hidden lg:block' : 'block'} w-full lg:w-80 h-full`}>
              <AppsList 
                apps={apps}
                selectedApp={selectedApp}
                onSelectApp={handleSelectApp}
                onAppInstalled={handleAppInstalled}
                isLoading={isLoading}
                currentUser={currentUser}
              />
            </div>
            
            {/* AppDetails - на мобильном открывается на весь экран */}
            <div className={`${selectedApp ? 'block' : 'hidden lg:block'} flex-1`}>
              {selectedApp ? (
                <AppDetails 
                  app={selectedApp}
                  onBack={() => setSelectedApp(null)} // Добавляем onBack для мобильной версии
                  onInstall={handleAppInstalled}
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-slate-800/50">
                  <div className="text-center text-gray-400">
                    <Grid3X3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">Select an app to view details</h3>
                    <p className="text-sm">Browse apps and discover new tools for your crypto journey</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        
        {activeView === 'wallet' && (
          <div className="w-full">
            <WalletInterface user={currentUser} onBackToMenu={() => setActiveView('chats')} />
          </div>
        )}
        
        {activeView === 'ai' && (
          <AIAssistant user={currentUser} />
        )}
        
        {activeView === 'settings' && (
          <Settings 
            user={currentUser} 
            onUserUpdate={handleUserUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default MainApp;