import React from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import EMILogo from './ui/logo';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  MessageCircle, 
  Wallet, 
  Bot, 
  Settings, 
  LogOut,
  Hash,
  Users,
  Star,
  Grid3X3
} from 'lucide-react';

const Sidebar = ({ activeView, onViewChange, user, onLogout }) => {
  const { t } = useLanguage();
  
  const menuItems = [
    { id: 'chats', icon: MessageCircle, label: t('chats'), badge: 0 },
    { id: 'channels', icon: Hash, label: t('channels') },
    { id: 'groups', icon: Users, label: t('groups'), badge: 0 },
    { id: 'apps', icon: Grid3X3, label: t('apps') },
    { id: 'wallet', icon: Wallet, label: t('wallet') },
    { id: 'ai', icon: Bot, label: t('aiAssistant') },
  ];

  return (
    <div className="w-16 lg:w-64 h-full bg-slate-900 border-r border-slate-700 flex flex-col">
      {/* User Profile */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-emerald-600 text-white">
                {user?.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* Online indicator moved to bottom right of avatar */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-800"></div>
          </div>
          <div className="hidden lg:block flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <p className="text-sm font-medium text-white truncate">
                {user?.username ? `@${user.username}` : '@Anonymous'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                {user?.network || 'BSC'}
              </Badge>
              <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                <Star className="w-3 h-3 mr-1" />
                {user?.trust_score || 0}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "secondary" : "ghost"}
              className={`w-full justify-start ${
                isActive 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-slate-700'
              }`}
              onClick={() => onViewChange(item.id)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <Icon className="w-5 h-5" />
                  <span className="hidden lg:block ml-3">{item.label}</span>
                </div>
                {item.count > 0 && (
                  <Badge variant="destructive" className="hidden lg:block text-xs bg-red-500 hover:bg-red-600">
                    {item.count}
                  </Badge>
                )}
              </div>
            </Button>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="p-2 space-y-1 border-t border-slate-700">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-slate-700"
          onClick={() => onViewChange('settings')}
        >
          <Settings className="w-5 h-5" />
          <span className="hidden lg:block ml-3">{t('settings')}</span>
        </Button>
        
        <Button
          variant="ghost"
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
          onClick={onLogout}
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden lg:block ml-3">{t('logout')}</span>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;