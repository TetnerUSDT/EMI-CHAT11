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
      <div className="relative w-full">
        <video 
          src={media}
          className="w-full h-auto"
          controls
          poster="/api/placeholder/400/300"
        />
        <div className="absolute top-2 right-2 bg-black/60 rounded-lg px-2 py-1">
          <span className="text-white text-xs">00:17</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <img 
        src={media} 
        alt="Posted content"
        className="w-full h-auto"
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
    <div className="mb-6 flex items-end space-x-3">
      {/* Channel Avatar - Left side */}
      <div className="flex-shrink-0">
        <Avatar className="w-12 h-12 border-4 border-white shadow-lg">
          <AvatarImage src={post.author_avatar} />
          <AvatarFallback className="bg-yellow-500 text-white font-bold">
            24
          </AvatarFallback>
        </Avatar>
      </div>
      
      {/* News Content - Right of avatar, width adapts to image */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden w-full max-w-sm lg:max-w-sm" style={{ minWidth: '250px', maxWidth: '350px' }}>
        {/* Media Content - Top */}
        {post.media_url && (
          <div className="relative">
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
            <div className="text-gray-800 text-sm leading-relaxed mb-3 text-left">
              {post.text}
            </div>
          )}
        </div>

        {/* Reactions (if any) */}
        <div className="px-4 pb-4">
          <MessageReactions 
            reactions={post.reactions}
            onReact={handleReact}
            currentUserId={currentUser?.id}
            onToggleReactionPicker={() => setShowReactionPicker(!showReactionPicker)}
          />
        </div>

        {/* Reaction Picker */}
        {showReactionPicker && (
          <div className="absolute bottom-16 left-4 bg-white rounded-lg p-2 flex space-x-1 z-10 shadow-xl border border-gray-200">
            {reactionTypes.map(({ type, emoji, label }) => (
              <button
                key={type}
                onClick={() => handleReact(type)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                title={label}
              >
                <span className="text-lg">{emoji}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelPost;