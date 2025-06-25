import React, { useState } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { 
  Star, 
  Download, 
  Share2, 
  Heart, 
  Play, 
  ExternalLink,
  Shield,
  Clock,
  User,
  MessageSquare,
  ArrowLeft,
  MoreHorizontal,
  Image as ImageIcon,
  ThumbsUp,
  Trash2,
  Calendar
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useLanguage } from '../contexts/LanguageContext';

const AppDetails = ({ app, onBack, onInstall }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  if (!app) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-800/50">
        <div className="text-center text-gray-400">
          <ExternalLink className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Select an app to view details</h3>
          <p className="text-sm">Choose from the apps list to see detailed information</p>
        </div>
      </div>
    );
  }

  const handleInstall = () => {
    if (app.isInstalled) {
      // Uninstall logic
      toast({
        title: "Uninstalling App",
        description: `${app.name} is being uninstalled...`,
      });
      
      setTimeout(() => {
        onInstall && onInstall(app, 'uninstall');
        toast({
          title: "App Uninstalled",
          description: `${app.name} has been successfully uninstalled!`,
        });
      }, 2000);
    } else {
      // Install logic
      toast({
        title: "Installing App",
        description: `${app.name} is being installed...`,
      });
      
      setTimeout(() => {
        onInstall && onInstall(app, 'install');
        toast({
          title: "App Installed",
          description: `${app.name} has been successfully installed!`,
        });
      }, 2000);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`Check out ${app.name} - ${app.description}`);
    toast({
      title: "Link Copied",
      description: "App link has been copied to clipboard!",
    });
  };

  const handleWishlist = () => {
    setIsInWishlist(!isInWishlist);
    toast({
      title: isInWishlist ? "Removed from Wishlist" : "Added to Wishlist",
      description: `${app.name} has been ${isInWishlist ? 'removed from' : 'added to'} your wishlist.`,
    });
  };

  const handleLaunchApp = () => {
    toast({
      title: "Launching App",
      description: `Opening ${app.name} in a new window...`,
    });
    
    // Simulate opening app in external window (like Telegram's WebApp)
    setTimeout(() => {
      window.open(app.webUrl, '_blank', 'width=800,height=600,resizable=yes,scrollbars=yes');
    }, 500);
  };

  const formatInstallCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M+`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K+`;
    }
    return `${count}`;
  };

  const formatLikes = (likes) => {
    if (likes >= 1000000) {
      return `${(likes / 1000000).toFixed(1)}M`;
    } else if (likes >= 1000) {
      return `${(likes / 1000).toFixed(1)}K`;
    }
    return likes.toString();
  };

  const ratingDistribution = [
    { stars: 5, percentage: 70 },
    { stars: 4, percentage: 20 },
    { stars: 3, percentage: 7 },
    { stars: 2, percentage: 2 },
    { stars: 1, percentage: 1 }
  ];

  return (
    <div className="flex-1 h-full bg-slate-800 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Avatar className="w-12 h-12 rounded-xl">
              <AvatarImage src={app.icon} />
              <AvatarFallback className="bg-emerald-600 text-white rounded-xl">
                {app.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold text-white">{app.name}</h1>
              <p className="text-sm text-gray-400">by {app.developer}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleWishlist}
              className={`${isInWishlist ? 'text-red-400' : 'text-gray-400'} hover:text-red-400`}
            >
              <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-red-400' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-gray-400 hover:text-white"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* App Info Card */}
        <Card className="bg-slate-700 border-slate-600">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    {app.category}
                  </Badge>
                  {app.isNew && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      New
                    </Badge>
                  )}
                  {app.isFeatured && (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                      Featured
                    </Badge>
                  )}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {app.longDescription || app.description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-lg font-bold text-white">{app.rating}</span>
                </div>
                <p className="text-xs text-gray-400">{app.reviewCount} отзывы</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span className="text-lg font-bold text-white">
                    {formatInstallCount(app.installCount)}
                  </span>
                </div>
                <p className="text-xs text-gray-400">Установлено</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <ThumbsUp className="w-4 h-4 text-pink-400" />
                  <span className="text-lg font-bold text-white">{formatLikes(app.likes)}</span>
                </div>
                <p className="text-xs text-gray-400">Нравится</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-lg font-bold text-white">
                    {Math.floor((new Date() - new Date(app.dateAdded)) / (1000 * 60 * 60 * 24))}д
                  </span>
                </div>
                <p className="text-xs text-gray-400">Дата добавления</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span className="text-lg font-bold text-white">
                    {Math.floor((new Date() - new Date(app.lastUpdate)) / (1000 * 60 * 60 * 24))}д
                  </span>
                </div>
                <p className="text-xs text-gray-400">Последнее обновление</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button 
                onClick={handleInstall}
                className={`flex-1 ${
                  app.isInstalled 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-emerald-600 hover:bg-emerald-700'
                } text-white`}
              >
                {app.isInstalled ? (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Удалить
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Установить
                  </>
                )}
              </Button>
              <Button 
                onClick={handleLaunchApp}
                variant="outline"
                className="flex-1 border-emerald-500 text-emerald-400 hover:bg-emerald-600 hover:text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Запустить
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Screenshots Gallery */}
        {app.screenshots && app.screenshots.length > 0 && (
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <ImageIcon className="w-5 h-5 mr-2" />
                Скриншоты
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden">
                  <img 
                    src={app.screenshots[currentImageIndex]} 
                    alt={`Screenshot ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {app.screenshots.map((screenshot, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        currentImageIndex === index 
                          ? 'border-emerald-500' 
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <img 
                        src={screenshot} 
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="reviews" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-700">
            <TabsTrigger value="reviews" className="data-[state=active]:bg-emerald-600">Отзывы</TabsTrigger>
            <TabsTrigger value="similar" className="data-[state=active]:bg-emerald-600">Похожие</TabsTrigger>
            <TabsTrigger value="info" className="data-[state=active]:bg-emerald-600">О приложении</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reviews" className="mt-4 space-y-4">
            {/* Rating Overview */}
            <Card className="bg-slate-700 border-slate-600">
              <CardContent className="p-6">
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white mb-1">{app.rating}</div>
                    <div className="flex items-center justify-center space-x-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-4 h-4 ${
                            star <= Math.floor(app.rating) 
                              ? 'text-yellow-400 fill-yellow-400' 
                              : 'text-gray-400'
                          }`} 
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-400">{app.reviewCount} отзывов</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {ratingDistribution.map((item) => (
                      <div key={item.stars} className="flex items-center space-x-3">
                        <span className="text-sm text-gray-400 w-8">{item.stars}★</span>
                        <Progress 
                          value={item.percentage} 
                          className="flex-1 h-2"
                        />
                        <span className="text-sm text-gray-400 w-8">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Reviews */}
            <div className="space-y-3">
              {app.reviews?.slice(0, 5).map((review, index) => (
                <Card key={index} className="bg-slate-700 border-slate-600">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={review.userAvatar} />
                        <AvatarFallback className="bg-emerald-600 text-white">
                          {review.userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-white">{review.userName}</h4>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`w-3 h-3 ${
                                  star <= review.rating 
                                    ? 'text-yellow-400 fill-yellow-400' 
                                    : 'text-gray-400'
                                }`} 
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-300">{review.comment}</p>
                        <p className="text-xs text-gray-500 mt-1">{review.date}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="similar" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {app.similarApps?.map((similarApp) => (
                <Card key={similarApp.id} className="bg-slate-700 border-slate-600 cursor-pointer hover:bg-slate-600 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12 rounded-xl">
                        <AvatarImage src={similarApp.icon} />
                        <AvatarFallback className="bg-emerald-600 text-white rounded-xl">
                          {similarApp.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">{similarApp.name}</h3>
                        <p className="text-sm text-gray-400 truncate">{similarApp.developer}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs text-gray-400">{similarApp.rating}</span>
                          </div>
                          <Badge className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                            {similarApp.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="info" className="mt-4">
            <Card className="bg-slate-700 border-slate-600">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Информация о приложении</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Версия:</span>
                      <span className="text-white ml-2">{app.version}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Нравится:</span>
                      <span className="text-white ml-2">{formatLikes(app.likes)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Категория:</span>
                      <span className="text-white ml-2">{app.category}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Разработчик:</span>
                      <span className="text-white ml-2">{app.developer}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Дата добавления:</span>
                      <span className="text-white ml-2">{new Date(app.dateAdded).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Последнее обновление:</span>
                      <span className="text-white ml-2">{new Date(app.lastUpdate).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Установлено:</span>
                      <span className="text-white ml-2">{formatInstallCount(app.installCount)}</span>
                    </div>
                  </div>
                </div>
                
                {app.permissions && (
                  <div>
                    <h3 className="font-semibold text-white mb-2">Разрешения</h3>
                    <div className="space-y-2">
                      {app.permissions.map((permission, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-gray-300">{permission}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {app.changelog && (
                  <div>
                    <h3 className="font-semibold text-white mb-2">Что нового</h3>
                    <div className="bg-slate-800 p-4 rounded-lg">
                      <p className="text-sm text-gray-300 whitespace-pre-line">{app.changelog}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AppDetails;