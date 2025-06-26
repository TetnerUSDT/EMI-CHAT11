import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  X, 
  Search, 
  Star, 
  Download, 
  Heart,
  Shield,
  Clock,
  Users,
  Smartphone,
  Gamepad2,
  Briefcase,
  Music,
  Camera,
  BookOpen,
  ShoppingCart,
  Palette,
  TrendingUp,
  Filter,
  Grid3X3,
  List
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useLanguage } from '../contexts/LanguageContext';

const StoreModal = ({ isOpen, onClose, onInstallApp }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('featured'); // 'featured', 'rating', 'downloads', 'newest'
  const [apps, setApps] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const categories = [
    { id: 'all', name: 'All Apps', icon: Grid3X3, color: 'from-purple-500 to-pink-500' },
    { id: 'games', name: 'Games', icon: Gamepad2, color: 'from-blue-500 to-indigo-500' },
    { id: 'social', name: 'Social', icon: Users, color: 'from-green-500 to-emerald-500' },
    { id: 'productivity', name: 'Productivity', icon: Briefcase, color: 'from-orange-500 to-red-500' },
    { id: 'entertainment', name: 'Entertainment', icon: Music, color: 'from-red-500 to-pink-500' },
    { id: 'photo', name: 'Photo & Video', icon: Camera, color: 'from-teal-500 to-cyan-500' },
    { id: 'education', name: 'Education', icon: BookOpen, color: 'from-indigo-500 to-purple-500' },
    { id: 'shopping', name: 'Shopping', icon: ShoppingCart, color: 'from-yellow-500 to-orange-500' },
    { id: 'lifestyle', name: 'Lifestyle', icon: Palette, color: 'from-pink-500 to-rose-500' },
    { id: 'utilities', name: 'Utilities', icon: Smartphone, color: 'from-gray-500 to-slate-500' }
  ];

  // Mock store apps data
  const mockStoreApps = [
    {
      id: 'store-1',
      name: 'PhotoEditor Pro',
      developer: 'Creative Studios',
      category: 'photo',
      description: 'Professional photo editing with AI-powered filters and advanced tools for stunning results.',
      icon: '/api/placeholder/64/64',
      screenshots: ['/api/placeholder/300/500', '/api/placeholder/300/500'],
      rating: 4.8,
      downloads: 2500000,
      size: '45.2 MB',
      version: '3.2.1',
      lastUpdate: '2024-01-15',
      price: 'Free',
      hasInAppPurchases: true,
      permissions: ['Camera', 'Storage', 'Network'],
      ageRating: '4+',
      isFeatured: true,
      isNew: false,
      tags: ['AI', 'Professional', 'Filters']
    },
    {
      id: 'store-2',
      name: 'CryptoTracker',
      developer: 'BlockTech Inc',
      category: 'productivity',
      description: 'Track your cryptocurrency portfolio with real-time prices and advanced analytics.',
      icon: '/api/placeholder/64/64',
      screenshots: ['/api/placeholder/300/500', '/api/placeholder/300/500'],
      rating: 4.6,
      downloads: 1200000,
      size: '28.5 MB',
      version: '2.1.0',
      lastUpdate: '2024-01-10',
      price: 'Free',
      hasInAppPurchases: false,
      permissions: ['Network', 'Storage'],
      ageRating: '12+',
      isFeatured: true,
      isNew: true,
      tags: ['Crypto', 'Finance', 'Portfolio']
    },
    {
      id: 'store-3',
      name: 'Puzzle Master',
      developer: 'Game Studios',
      category: 'games',
      description: 'Challenging puzzle game with hundreds of levels and multiplayer competitions.',
      icon: '/api/placeholder/64/64',
      screenshots: ['/api/placeholder/300/500', '/api/placeholder/300/500'],
      rating: 4.7,
      downloads: 5000000,
      size: '125.8 MB',
      version: '1.8.3',
      lastUpdate: '2024-01-12',
      price: 'Free',
      hasInAppPurchases: true,
      permissions: ['Network', 'Storage'],
      ageRating: '9+',
      isFeatured: false,
      isNew: false,
      tags: ['Puzzle', 'Multiplayer', 'Strategy']
    },
    {
      id: 'store-4',
      name: 'FitnessCoach AI',
      developer: 'Health Tech',
      category: 'lifestyle',
      description: 'AI-powered personal fitness coach with customized workout plans and nutrition tracking.',
      icon: '/api/placeholder/64/64',
      screenshots: ['/api/placeholder/300/500', '/api/placeholder/300/500'],
      rating: 4.9,
      downloads: 800000,
      size: '67.3 MB',
      version: '4.0.2',
      lastUpdate: '2024-01-08',
      price: '$9.99',
      hasInAppPurchases: true,
      permissions: ['Health', 'Camera', 'Location'],
      ageRating: '17+',
      isFeatured: true,
      isNew: true,
      tags: ['AI', 'Fitness', 'Health']
    },
    {
      id: 'store-5',
      name: 'MusicMaker Studio',
      developer: 'Audio Pro',
      category: 'entertainment',
      description: 'Create, mix, and produce music with professional-grade tools and sound library.',
      icon: '/api/placeholder/64/64',
      screenshots: ['/api/placeholder/300/500', '/api/placeholder/300/500'],
      rating: 4.5,
      downloads: 1800000,
      size: '234.6 MB',
      version: '7.2.1',
      lastUpdate: '2024-01-14',
      price: 'Free',
      hasInAppPurchases: true,
      permissions: ['Microphone', 'Storage', 'Network'],
      ageRating: '4+',
      isFeatured: false,
      isNew: false,
      tags: ['Music', 'Audio', 'Creative']
    },
    {
      id: 'store-6',
      name: 'StudyHelper',
      developer: 'EduTech Solutions',
      category: 'education',
      description: 'Smart study planner with flashcards, notes, and progress tracking for students.',
      icon: '/api/placeholder/64/64',
      screenshots: ['/api/placeholder/300/500', '/api/placeholder/300/500'],
      rating: 4.4,
      downloads: 650000,
      size: '41.2 MB',
      version: '2.3.0',
      lastUpdate: '2024-01-11',
      price: 'Free',
      hasInAppPurchases: true,
      permissions: ['Storage', 'Calendar'],
      ageRating: '4+',
      isFeatured: false,
      isNew: true,
      tags: ['Study', 'Education', 'Productivity']
    }
  ];

  useEffect(() => {
    if (isOpen) {
      setApps(mockStoreApps);
    }
  }, [isOpen]);

  const getFilteredApps = () => {
    let filtered = apps;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(app => app.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        app.name.toLowerCase().includes(query) ||
        app.developer.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query) ||
        app.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'downloads':
        filtered.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));
        break;
      case 'featured':
      default:
        filtered.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return b.downloads - a.downloads;
        });
        break;
    }

    return filtered;
  };

  const formatDownloads = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M+`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K+`;
    }
    return count.toString();
  };

  const handleInstallApp = (app) => {
    const newApp = {
      id: app.id,
      name: app.name,
      developer: app.developer,
      category: app.category,
      description: app.description,
      icon: app.icon,
      rating: app.rating,
      installCount: app.downloads,
      lastUpdate: app.lastUpdate,
      version: app.version,
      size: app.size,
      isNew: false,
      isInstalled: true,
      installDate: new Date().toISOString()
    };

    onInstallApp(newApp);
    
    toast({
      title: "App Installed!",
      description: `${app.name} has been successfully installed.`,
    });
  };

  const featuredApps = apps.filter(app => app.isFeatured);
  const filteredApps = getFilteredApps();

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full h-full p-0 bg-slate-900 border-none">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">App Store</h1>
                <p className="text-gray-400">Discover and install amazing apps</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar - Categories */}
            <div className="w-64 bg-slate-800 border-r border-slate-700 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Categories
                </h3>
                <div className="space-y-1">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    const isSelected = selectedCategory === category.id;
                    
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                          isSelected
                            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                            : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium">{category.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search and Filters */}
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Search apps, developers, categories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 bg-slate-800 border-slate-600 text-white placeholder-gray-400 focus:ring-emerald-500 focus:border-emerald-500 h-12"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="featured">Featured</option>
                      <option value="rating">Top Rated</option>
                      <option value="downloads">Most Downloaded</option>
                      <option value="newest">Newest</option>
                    </select>
                    <div className="flex bg-slate-800 border border-slate-600 rounded-lg p-1">
                      <Button
                        size="sm"
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        onClick={() => setViewMode('grid')}
                        className="h-8 w-8 p-0"
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        onClick={() => setViewMode('list')}
                        className="h-8 w-8 p-0"
                      >
                        <List className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Featured Apps Section */}
              {selectedCategory === 'all' && !searchQuery && (
                <div className="p-6 border-b border-slate-700">
                  <div className="flex items-center space-x-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-xl font-bold text-white">Featured Apps</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {featuredApps.slice(0, 3).map((app) => (
                      <div key={app.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                        <div className="flex items-start space-x-4">
                          <Avatar className="w-16 h-16 rounded-xl">
                            <AvatarImage src={app.icon} />
                            <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-lg">
                              {app.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-white">{app.name}</h3>
                              {app.isNew && (
                                <Badge className="bg-red-500 text-white text-xs">NEW</Badge>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm mb-2">{app.developer}</p>
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="text-sm text-gray-300">{app.rating}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Download className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-400">{formatDownloads(app.downloads)}</span>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleInstallApp(app)}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              {app.price === 'Free' ? 'Install' : app.price}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Apps Grid/List */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">
                    {selectedCategory === 'all' ? 'All Apps' : categories.find(c => c.id === selectedCategory)?.name}
                    <span className="text-gray-400 ml-2">({filteredApps.length})</span>
                  </h2>
                </div>

                {filteredApps.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold text-white mb-2">No apps found</h3>
                    <p className="text-gray-400">Try adjusting your search or category filter</p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredApps.map((app) => (
                      <div key={app.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-colors">
                        <div className="text-center mb-4">
                          <Avatar className="w-20 h-20 rounded-xl mx-auto mb-3">
                            <AvatarImage src={app.icon} />
                            <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-xl">
                              {app.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-center justify-center space-x-2 mb-1">
                            <h3 className="font-semibold text-white truncate">{app.name}</h3>
                            {app.isNew && (
                              <Badge className="bg-red-500 text-white text-xs">NEW</Badge>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm truncate">{app.developer}</p>
                        </div>
                        
                        <div className="flex items-center justify-center space-x-4 mb-4">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm text-gray-300">{app.rating}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Download className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-400">{formatDownloads(app.downloads)}</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{app.description}</p>
                        
                        <Button
                          onClick={() => handleInstallApp(app)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {app.price === 'Free' ? 'Install' : app.price}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredApps.map((app) => (
                      <div key={app.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-colors">
                        <div className="flex items-start space-x-4">
                          <Avatar className="w-16 h-16 rounded-xl">
                            <AvatarImage src={app.icon} />
                            <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-lg">
                              {app.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-white">{app.name}</h3>
                                {app.isNew && (
                                  <Badge className="bg-red-500 text-white text-xs">NEW</Badge>
                                )}
                              </div>
                              <Button
                                onClick={() => handleInstallApp(app)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                {app.price === 'Free' ? 'Install' : app.price}
                              </Button>
                            </div>
                            <p className="text-gray-400 text-sm mb-2">{app.developer}</p>
                            <p className="text-gray-300 text-sm mb-3">{app.description}</p>
                            <div className="flex items-center space-x-6">
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="text-sm text-gray-300">{app.rating}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Download className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-400">{formatDownloads(app.downloads)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-400">{app.size}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoreModal;