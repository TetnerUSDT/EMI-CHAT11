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
  Download,
  Hash,
  Image as ImageIcon
} from 'lucide-react';

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
  channel,
  currentUser, 
  onReact, 
  onComment, 
  onShare,
  isChannel = true 
}) => {
  const [showReactionTooltip, setShowReactionTooltip] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [viewCount, setViewCount] = useState(post.views || 0);
  const [hideTimeout, setHideTimeout] = useState(null);

  const reactionTypes = [
    { type: 'like', emoji: '👍', label: 'Like' },
    { type: 'love', emoji: '❤️', label: 'Love' },
    { type: 'laugh', emoji: '😂', label: 'Laugh' },
    { type: 'wow', emoji: '😮', label: 'Wow' },
    { type: 'sad', emoji: '😢', label: 'Sad' },
    { type: 'angry', emoji: '😡', label: 'Angry' },
    { type: 'fire', emoji: '🔥', label: 'Fire' },
    { type: 'party', emoji: '🎉', label: 'Party' },
    { type: 'thinking', emoji: '🤔', label: 'Thinking' },
    { type: 'clap', emoji: '👏', label: 'Clap' },
    { type: 'heart_eyes', emoji: '😍', label: 'Heart Eyes' },
    { type: 'thumbs_down', emoji: '👎', label: 'Thumbs Down' },
    { type: 'shocked', emoji: '😱', label: 'Shocked' },
    { type: 'confused', emoji: '😕', label: 'Confused' },
    { type: 'rocket', emoji: '🚀', label: 'Rocket' }
  ];

  const getUserReactions = () => {
    if (!post.reactions || !currentUser?.id) return [];
    const userReactions = [];
    Object.entries(post.reactions).forEach(([type, users]) => {
      if (users && users.includes(currentUser.id)) {
        userReactions.push(type);
      }
    });
    return userReactions;
  };

  const getAvailableReactions = () => {
    const currentReactionTypes = Object.keys(post.reactions || {});
    const userReactions = getUserReactions();
    
    // If there are already 6 different reaction types from all users,
    // only show those 6 types + user's own reactions
    if (currentReactionTypes.length >= 6) {
      return reactionTypes.filter(({ type }) => 
        currentReactionTypes.includes(type) || userReactions.includes(type)
      );
    }
    
    // Otherwise show all available reactions
    return reactionTypes;
  };

  const canAddReaction = (reactionType) => {
    const userReactions = getUserReactions();
    const hasThisReaction = userReactions.includes(reactionType);
    const currentReactionTypes = Object.keys(post.reactions || {});
    
    // User can add if: has this reaction (for removal) OR has < 3 reactions AND (reaction type exists OR < 6 total types)
    return hasThisReaction || (
      userReactions.length < 3 && 
      (currentReactionTypes.includes(reactionType) || currentReactionTypes.length < 6)
    );
  };

  const handleReact = (reactionType) => {
    if (!canAddReaction(reactionType)) {
      return;
    }

    if (onReact) {
      onReact(post.id, reactionType, currentUser.id);
    }
    
    // Delay hiding to allow multiple reactions
    const timeout = setTimeout(() => {
      setShowReactionPicker(false);
      setShowReactionTooltip(false);
    }, 500);
    setHideTimeout(timeout);
  };

  const handleMouseEnterPost = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
    setShowReactionTooltip(true);
  };

  const handleMouseLeavePost = () => {
    if (!showReactionPicker) {
      setShowReactionTooltip(false);
    }
  };

  const handleMouseEnterPicker = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
    setShowReactionPicker(true);
  };

  const handleMouseLeavePicker = () => {
    const timeout = setTimeout(() => {
      setShowReactionPicker(false);
      setShowReactionTooltip(false);
    }, 3000); // 3 second delay
    setHideTimeout(timeout);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      // Parse the timestamp - handle different formats
      let date;
      if (typeof timestamp === 'string') {
        // Handle ISO format with or without Z
        date = new Date(timestamp.replace('Z', ''));
      } else {
        date = new Date(timestamp);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'invalid date';
      }
      
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      
      if (diffInMinutes < 1) return 'сейчас';
      if (diffInMinutes < 60) return `${diffInMinutes}м назад`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}ч назад`;
      
      // For older posts, show date
      const options = { month: 'short', day: 'numeric' };
      if (date.getFullYear() !== now.getFullYear()) {
        options.year = 'numeric';
      }
      return date.toLocaleDateString('ru-RU', options);
    } catch (error) {
      console.error('Error formatting time:', error, timestamp);
      return 'error';
    }
  };

  const formatViewCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div 
      className="mb-6 flex items-start justify-start relative"
      onMouseEnter={handleMouseEnterPost}
      onMouseLeave={handleMouseLeavePost}
    >
      {/* Channel Avatar - Left side with 10px margin */}
      <div className="flex-shrink-0 mr-2.5">
        <Avatar className="w-12 h-12 border-4 border-white shadow-lg">
          <AvatarImage src={channel?.avatar} />
          <AvatarFallback className="bg-yellow-500 text-white font-bold">
            <Hash className="w-6 h-6" />
          </AvatarFallback>
        </Avatar>
      </div>
      
      {/* News Content - Positioned left, aligned to left */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden relative" style={{ minWidth: '250px', maxWidth: '350px' }}>
        {/* Media Content - Top - No padding/margins */}
        {post.media_url && (
          <div className="relative" style={{ margin: 0, padding: 0 }}>
            <MediaContent 
              media={post.media_url} 
              isVideo={post.media_type === 'video'} 
            />
            {/* Media Type Badge - Top Right - Only visible on hover */}
            {isChannel && showReactionTooltip && (
              <div className="absolute top-3 right-3 bg-black/70 rounded-full w-8 h-8 flex items-center justify-center transition-opacity duration-300">
                {post.media_type === 'video' ? (
                  <Play className="w-4 h-4 text-white" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-white" />
                )}
              </div>
            )}
          </div>
        )}

        {/* Text Content Area - White Background - only show if there's text */}
        {post.text && (
          <div className="bg-white px-4 py-2">
            {/* Main Text Content - Aligned left */}
            <div className="text-gray-800 text-sm leading-relaxed text-left">
              {post.text}
              {/* Time stamp - Inline after text when no reactions visible */}
              {(!post.reactions || Object.keys(post.reactions).length === 0) && (
                <span className="text-xs text-gray-500 ml-2">
                  {formatTime(post.created_at)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Existing reactions display (if any) - inside the white block but at bottom */}
        {post.reactions && Object.keys(post.reactions).length > 0 && (
          <div className={`bg-white px-4 pb-2 ${!post.text ? 'pt-2' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                {Object.entries(post.reactions).map(([type, users]) => {
                  const userHasThisReaction = users.includes(currentUser?.id);
                  return (
                    users.length > 0 && (
                      <button
                        key={type}
                        onClick={() => handleReact(type)}
                        className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors ${
                          userHasThisReaction 
                            ? 'bg-blue-100 hover:bg-blue-200' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                        title={userHasThisReaction ? 'Remove your reaction' : 'Add your reaction'}
                      >
                        <span className="text-sm">
                          {reactionTypes.find(r => r.type === type)?.emoji}
                        </span>
                        <span className="text-gray-600">{users.length}</span>
                      </button>
                    )
                  );
                })}
              </div>
              
              {/* Time stamp - Positioned with reactions */}
              <span className="text-xs text-gray-500">
                {formatTime(post.created_at)}
              </span>
            </div>
          </div>
        )}

        {/* Time stamp for media-only posts without text and reactions */}
        {!post.text && (!post.reactions || Object.keys(post.reactions).length === 0) && (
          <div className="absolute bottom-2 right-2 bg-black/60 rounded px-2 py-1">
            <span className="text-xs text-white">
              {formatTime(post.created_at)}
            </span>
          </div>
        )}
      </div>

      {/* Reaction Tooltip and Picker - OUTSIDE the white block, positioned absolutely */}
      <div className="absolute bottom-0 right-0">
        {/* Reaction Icon - Bottom right corner on hover with smooth animation */}
        <div 
          className={`absolute bottom-2 right-2 bg-white rounded-full shadow-lg border border-gray-200 p-1.5 z-20 transition-all duration-300 ease-in-out ${
            showReactionTooltip ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
          }`}
          onMouseEnter={handleMouseEnterPicker}
          onMouseLeave={handleMouseLeavePicker}
        >
          <Heart className="w-3.5 h-3.5 text-gray-600 hover:text-red-500 transition-colors cursor-pointer" />
        </div>

        {/* Vertical Reaction Picker - OUTSIDE and ABOVE the white block */}
        <div 
          className={`absolute bg-white rounded-lg shadow-xl border border-gray-200 p-1.5 z-30 transition-all duration-300 ease-in-out ${
            showReactionPicker ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
          }`}
          style={{ 
            bottom: '36px',
            right: '3px',
            maxHeight: '200px',
            width: '44px'
          }}
          onMouseEnter={handleMouseEnterPicker}
          onMouseLeave={handleMouseLeavePicker}
        >
          <div className="flex flex-col space-y-0.5 overflow-y-auto scrollbar-hide max-h-48">
            {getAvailableReactions().map(({ type, emoji, label }) => {
              const userReactions = getUserReactions();
              const hasReacted = userReactions.includes(type);
              const canReact = canAddReaction(type);
              
              return (
                <div
                  key={type}
                  onClick={() => canReact && handleReact(type)}
                  className={`w-8 h-8 flex items-center justify-center cursor-pointer ${
                    hasReacted 
                      ? 'opacity-100' 
                      : canReact 
                        ? 'opacity-70 hover:opacity-100' 
                        : 'opacity-30 cursor-not-allowed'
                  } transition-opacity`}
                  title={label}
                >
                  <span className="text-lg">{emoji}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelPost;