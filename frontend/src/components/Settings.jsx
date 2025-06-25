import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import AvatarUploader from './AvatarUploader';
import { 
  User, 
  Globe, 
  Edit, 
  Save, 
  X,
  Star,
  Check,
  Camera
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { userAPI } from '../services/api';
import { useToast } from '../hooks/use-toast';

const Settings = ({ user, onUserUpdate }) => {
  const { language, changeLanguage, t } = useLanguage();
  const { toast } = useToast();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAvatarUploader, setShowAvatarUploader] = useState(false);

  const handleLanguageChange = (newLang) => {
    changeLanguage(newLang);
    toast({
      title: t('language'),
      description: `${t('changeLanguage')}: ${newLang === 'en' ? 'English' : 'Русский'}`
    });
  };

  const validateUsername = (username) => {
    if (!username) {
      return t('usernameRequired');
    }
    if (username.length < 6) {
      return t('usernameMinLength');
    }
    if (!/^[a-zA-Z0-9а-яА-Я]+$/.test(username)) {
      return t('usernamePattern');
    }
    return null;
  };

  const handleUsernameSubmit = async () => {
    const error = validateUsername(newUsername);
    if (error) {
      toast({
        title: t('error'),
        description: error,
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    try {
      const updatedUser = await userAPI.updateProfile({
        username: newUsername
      });
      
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }
      
      setIsEditingUsername(false);
      toast({
        title: t('username'),
        description: t('usernameUpdated')
      });
    } catch (error) {
      console.error('Error updating username:', error);
      toast({
        title: t('error'),
        description: t('tryAgain'),
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarUpdate = async (newAvatarBase64) => {
    try {
      const updatedUser = await userAPI.updateProfile({
        avatar: newAvatarBase64
      });
      
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }
      
      toast({
        title: t('success'),
        description: 'Avatar updated successfully!'
      });
    } catch (error) {
      console.error('Error updating avatar:', error);
      throw error; // Re-throw to be handled by AvatarUploader
    }
  };

  const handleUsernameCancel = () => {
    setNewUsername(user?.username || '');
    setIsEditingUsername(false);
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{t('settings')}</h1>
        <p className="text-slate-400">{t('profileSettings')}</p>
      </div>

      {/* Profile Section */}
      <Card className="bg-slate-800 border-slate-600">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <User className="w-5 h-5 mr-2" />
            {t('profile')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Avatar and Basic Info */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar 
                className="w-16 h-16 cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-emerald-500 hover:scale-105"
                onClick={() => setShowAvatarUploader(true)}
              >
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-emerald-600 text-white text-lg">
                  {user.username?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-emerald-600 rounded-full p-1">
                <Camera className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium">@{user.username}</h3>
              <p className="text-slate-400 text-sm">{user.wallet_address?.slice(0, 6)}...{user.wallet_address?.slice(-4)}</p>
              <div className="flex items-center mt-2">
                <Badge variant="secondary" className="bg-yellow-600 text-white">
                  <Star className="w-3 h-3 mr-1" />
                  {t('trustScore')}: {user.trust_score || 0}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAvatarUploader(true)}
                className="mt-2 text-emerald-400 hover:text-emerald-300 p-0 h-auto"
              >
                <Camera className="w-4 h-4 mr-1" />
                {t('changeAvatar') || 'Change Avatar'}
              </Button>
            </div>
          </div>

          <Separator className="bg-slate-600" />

          {/* Username Editor */}
          <div className="space-y-4">
            <Label htmlFor="username" className="text-white font-medium">
              {t('username')}
            </Label>
            
            {!isEditingUsername ? (
              <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                <span className="text-white">@{user.username}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingUsername(true)}
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  {t('edit')}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  id="username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder={t('username')}
                  className="bg-slate-700 border-slate-600 text-white"
                  disabled={isUpdating}
                />
                <p className="text-xs text-slate-400">{t('usernameHelp')}</p>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleUsernameSubmit}
                    disabled={isUpdating}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isUpdating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-1" />
                        {t('save')}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleUsernameCancel}
                    disabled={isUpdating}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <X className="w-4 h-4 mr-1" />
                    {t('cancel')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Language Section */}
      <Card className="bg-slate-800 border-slate-600">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Globe className="w-5 h-5 mr-2" />
            {t('language')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label className="text-white font-medium">{t('changeLanguage')}</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={language === 'en' ? 'default' : 'outline'}
                onClick={() => handleLanguageChange('en')}
                className={`flex items-center justify-center ${
                  language === 'en' 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                    : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {language === 'en' && <Check className="w-4 h-4 mr-2" />}
                English
              </Button>
              <Button
                variant={language === 'ru' ? 'default' : 'outline'}
                onClick={() => handleLanguageChange('ru')}
                className={`flex items-center justify-center ${
                  language === 'ru' 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                    : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {language === 'ru' && <Check className="w-4 h-4 mr-2" />}
                Русский
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avatar Uploader Dialog */}
      <AvatarUploader
        currentAvatar={user.avatar}
        username={user.username}
        onAvatarUpdate={handleAvatarUpdate}
        isOpen={showAvatarUploader}
        onClose={() => setShowAvatarUploader(false)}
      />
    </div>
  );
};

export default Settings;