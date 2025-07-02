import React, { useState } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { 
  Heart, 
  ThumbsUp, 
  Smile, 
  MessageCircle, 
  Share, 
  MoreHorizontal,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Eye,
  Download
} from 'lucide-react';

const MessageReactions = ({ reactions, onReact, currentUserId, onToggleReactionPicker }) => {
  const reactionEmojis = {
    like: '👍',
    love: '❤️',
    laugh: '😂',
    wow: '😮',
    sad: '😢',
    angry: '😡'
  };

  const [showAllReactions, setShowAllReactions] = useState(false);

  const getTotalReactions = () => {
    return Object.values(reactions || {}).reduce((total, users) => total + users.length, 0);
  };

  const hasUserReacted = (reactionType) => {
    return reactions?.[reactionType]?.includes(currentUserId);
  };

  const getTopReactions = () => {
    const sortedReactions = Object.entries(reactions || {})
      .filter(([type, users]) => users.length > 0)
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 3);
    
    return sortedReactions;
  };

  return (
    <div className="flex items-center justify-between mt-2">
      <div className="flex items-center space-x-2">
        {getTotalReactions() > 0 && (
          <div className="flex items-center space-x-1">
            {getTopReactions().map(([type, users]) => (
              <div key={type} className="flex items-center space-x-1">
                <span className="text-sm">{reactionEmojis[type]}</span>
                <span className="text-xs text-gray-400">{users.length}</span>
              </div>
            ))}
            <span className="text-xs text-gray-500 ml-2">
              {getTotalReactions()} {getTotalReactions() === 1 ? 'reaction' : 'reactions'}
            </span>
          </div>
        )}
      </div>
      
      {/* Add Reaction Button */}
      <button 
        onClick={onToggleReactionPicker}
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
        title="Add reaction"
      >
        <span className="text-lg">❤️</span>
      </button>
    </div>
  );
};

const MediaContent = ({ media, isVideo = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  if (isVideo) {
    return (
      <div className="relative block">
        <video 
          src={media}
          className="w-full h-auto block rounded-t-lg"
          controls
          poster="/api/placeholder/400/300"
          style={{ margin: 0, padding: 0 }}
        />
        <div className="absolute top-2 right-2 bg-black/60 rounded-lg px-2 py-1">
          <span className="text-white text-xs">00:17</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative block">
      <img 
        src={media} 
        alt="Posted content"
        className="w-full h-auto block rounded-t-lg"
        style={{ margin: 0, padding: 0 }}
      />
    </div>
  );
};

const ChannelPost = ({ 
  post, 
  currentUser, 
  onReact, 
  onComment, 
  onShare,
  isChannel = true 
}) => {
  const [showReactionTooltip, setShowReactionTooltip] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [viewCount, setViewCount] = useState(post.views || 0);

  const reactionTypes = [
    { type: 'like', emoji: '👍', label: 'Like' },
    { type: 'love', emoji: '❤️', label: 'Love' },
    { type: 'laugh', emoji: '😂', label: 'Laugh' },
    { type: 'wow', emoji: '😮', label: 'Wow' },
    { type: 'sad', emoji: '😢', label: 'Sad' },
    { type: 'angry', emoji: '😡', label: 'Angry' }
  ];

  const handleReact = (reactionType) => {
    if (onReact) {
      onReact(post.id, reactionType, currentUser.id);
    }
    setShowReactionPicker(false);
    setShowReactionTooltip(false);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const formatViewCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div 
      className="mb-6 flex items-start justify-start relative"
      onMouseEnter={() => setShowReactionTooltip(true)}
      onMouseLeave={() => {
        if (!showReactionPicker) {
          setShowReactionTooltip(false);
        }
      }}
    >
      {/* Channel Avatar - Left side with 10px margin */}
      <div className="flex-shrink-0 mr-2.5">
        <Avatar className="w-12 h-12 border-4 border-white shadow-lg">
          <AvatarImage src={post.author_avatar} />
          <AvatarFallback className="bg-yellow-500 text-white font-bold">
            24
          </AvatarFallback>
        </Avatar>
      </div>
      
      {/* News Content - Positioned left, aligned to left */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ minWidth: '250px', maxWidth: '350px' }}>
        {/* Media Content - Top - No padding/margins */}
        {post.media_url && (
          <div className="relative" style={{ margin: 0, padding: 0 }}>
            <MediaContent 
              media={post.media_url} 
              isVideo={post.media_type === 'video'} 
            />
            {/* Channel Badge - Top Right */}
            {isChannel && (
              <div className="absolute top-3 right-3 bg-black/70 rounded-full w-8 h-8 flex items-center justify-center">
                <span className="text-white text-xs font-bold">24</span>
              </div>
            )}
          </div>
        )}

        {/* Text Content Area - White Background */}
        <div className="bg-white p-4">
          {/* Main Text Content - Aligned left */}
          {post.text && (
            <div className="text-gray-800 text-sm leading-relaxed text-left">
              {post.text}
            </div>
          )}
          
          {/* Time stamp - Small gray text like Telegram */}
          <div className="text-xs text-gray-500 mt-2 text-left">
            {formatTime(post.created_at)}
          </div>
        </div>
      </div>

      {/* Reaction Tooltip - appears on hover */}
      {showReactionTooltip && (
        <div 
          className="absolute top-2 right-2 bg-white rounded-full shadow-lg border border-gray-200 p-2 z-20"
          onMouseEnter={() => setShowReactionPicker(true)}
          onMouseLeave={() => {
            setShowReactionPicker(false);
            setShowReactionTooltip(false);
          }}
        >
          <Heart className="w-5 h-5 text-gray-600 hover:text-red-500 transition-colors cursor-pointer" />
        </div>
      )}

      {/* Telegram-style Reaction Picker with horizontal scroll */}
      {showReactionPicker && (
        <div 
          className="absolute top-12 right-2 bg-white rounded-full shadow-xl border border-gray-200 p-2 z-30"
          style={{ minWidth: '200px' }}
          onMouseEnter={() => setShowReactionPicker(true)}
          onMouseLeave={() => {
            setShowReactionPicker(false);
            setShowReactionTooltip(false);
          }}
        >
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            {reactionTypes.map(({ type, emoji, label }) => (
              <button
                key={type}
                onClick={() => handleReact(type)}
                className="flex-shrink-0 w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all duration-200 hover:scale-110"
                title={label}
              >
                <span className="text-xl">{emoji}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Existing reactions display (if any) */}
      {post.reactions && Object.keys(post.reactions).length > 0 && (
        <div className="absolute bottom-2 left-16 bg-white/90 rounded-full px-2 py-1 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-1">
            {Object.entries(post.reactions).slice(0, 3).map(([type, users]) => (
              users.length > 0 && (
                <div key={type} className="flex items-center">
                  <span className="text-sm">
                    {reactionTypes.find(r => r.type === type)?.emoji}
                  </span>
                  <span className="text-xs text-gray-600 ml-1">{users.length}</span>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelPost;