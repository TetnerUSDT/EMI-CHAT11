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
      if (users.includes(currentUser.id)) {
        userReactions.push(type);
      }
    });
    return userReactions;
  };

  const canAddReaction = (reactionType) => {
    const userReactions = getUserReactions();
    const hasThisReaction = userReactions.includes(reactionType);
    return hasThisReaction || userReactions.length < 3;
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
      onMouseEnter={handleMouseEnterPost}
      onMouseLeave={handleMouseLeavePost}
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
      <div className="bg-white rounded-lg shadow-lg overflow-hidden relative" style={{ minWidth: '250px', maxWidth: '350px' }}>
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
            <div className="text-gray-800 text-sm leading-relaxed text-left mb-2">
              {post.text}
            </div>
          )}
          
          {/* Time stamp - Small gray text like Telegram - positioned bottom right */}
          <div className="flex justify-end">
            <span className="text-xs text-gray-500">
              {formatTime(post.created_at)}
            </span>
          </div>
        </div>

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

        {/* Vertical Reaction Picker with scroll and adaptive positioning */}
        <div 
          className={`absolute bottom-10 bg-white rounded-lg shadow-xl border border-gray-200 p-1.5 z-30 transition-all duration-300 ease-in-out ${
            showReactionPicker ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
          }`}
          style={{ 
            right: '8px',
            maxHeight: '200px',
            width: '44px'
          }}
          onMouseEnter={handleMouseEnterPicker}
          onMouseLeave={handleMouseLeavePicker}
        >
          <div className="flex flex-col space-y-0.5 overflow-y-auto scrollbar-hide max-h-48">
            {reactionTypes.map(({ type, emoji, label }) => {
              const userReactions = getUserReactions();
              const hasReacted = userReactions.includes(type);
              const canReact = canAddReaction(type);
              
              return (
                <button
                  key={type}
                  onClick={() => handleReact(type)}
                  disabled={!canReact}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    hasReacted 
                      ? 'bg-blue-100 hover:bg-blue-200 scale-110' 
                      : canReact 
                        ? 'hover:bg-gray-100 hover:scale-110' 
                        : 'opacity-50 cursor-not-allowed'
                  }`}
                  title={`${label} ${hasReacted ? '(Remove)' : userReactions.length >= 3 ? '(Max 3 reactions)' : '(Add)'}`}
                >
                  <span className="text-lg">{emoji}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Existing reactions display (if any) - clickable for removal */}
        {post.reactions && Object.keys(post.reactions).length > 0 && (
          <div className="absolute bottom-2 left-4 bg-white/90 rounded-full px-2 py-1 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-1">
              {Object.entries(post.reactions).slice(0, 5).map(([type, users]) => {
                const userHasThisReaction = users.includes(currentUser?.id);
                return (
                  users.length > 0 && (
                    <button
                      key={type}
                      onClick={() => handleReact(type)}
                      className={`flex items-center space-x-1 px-1 py-0.5 rounded transition-colors ${
                        userHasThisReaction 
                          ? 'bg-blue-100 hover:bg-blue-200' 
                          : 'hover:bg-gray-100'
                      }`}
                      title={userHasThisReaction ? 'Remove your reaction' : 'Add your reaction'}
                    >
                      <span className="text-sm">
                        {reactionTypes.find(r => r.type === type)?.emoji}
                      </span>
                      <span className="text-xs text-gray-600 ml-1">{users.length}</span>
                    </button>
                  )
                );
              })}
              {Object.keys(post.reactions).length > 5 && (
                <span className="text-xs text-gray-500">+{Object.keys(post.reactions).length - 5}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelPost;