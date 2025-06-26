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

const MessageReactions = ({ reactions, onReact, currentUserId }) => {
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

  if (getTotalReactions() === 0) return null;

  return (
    <div className="flex items-center space-x-2 mt-2">
      <div className="flex items-center space-x-1">
        {getTopReactions().map(([type, users]) => (
          <div key={type} className="flex items-center space-x-1">
            <span className="text-sm">{reactionEmojis[type]}</span>
            <span className="text-xs text-gray-400">{users.length}</span>
          </div>
        ))}
      </div>
      <span className="text-xs text-gray-500">
        {getTotalReactions()} {getTotalReactions() === 1 ? 'reaction' : 'reactions'}
      </span>
    </div>
  );
};

const MediaContent = ({ media, isVideo = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  if (isVideo) {
    return (
      <div className="relative max-w-md">
        <video 
          src={media}
          className="w-full rounded-lg"
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
    <div className="relative max-w-md">
      <img 
        src={media} 
        alt="Posted content"
        className="w-full rounded-lg object-cover max-h-96"
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
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.author_avatar} />
            <AvatarFallback className="bg-emerald-600 text-white">
              {post.author_name?.charAt(0) || post.channel_name?.charAt(0) || 'C'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-white">
                {post.channel_name || post.author_name}
              </h4>
              {isChannel && (
                <Badge className="bg-blue-500/20 text-blue-400 text-xs">✓</Badge>
              )}
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span>{formatTime(post.created_at)}</span>
              {isChannel && (
                <>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-3 h-3" />
                    <span>{formatViewCount(viewCount)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Text Content */}
        {post.text && (
          <div className="text-gray-200 leading-relaxed">
            {post.text}
          </div>
        )}

        {/* Media Content */}
        {post.media_url && (
          <MediaContent 
            media={post.media_url} 
            isVideo={post.media_type === 'video'} 
          />
        )}

        {/* Reactions */}
        <MessageReactions 
          reactions={post.reactions}
          onReact={handleReact}
          currentUserId={currentUser?.id}
        />

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700">
          <div className="flex items-center space-x-4">
            {/* Reaction Button */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReactionPicker(!showReactionPicker)}
                className="text-gray-400 hover:text-white hover:bg-slate-700"
              >
                <Heart className="w-4 h-4 mr-1" />
                <span className="text-sm">React</span>
              </Button>
              
              {/* Reaction Picker */}
              {showReactionPicker && (
                <div className="absolute bottom-full left-0 mb-2 bg-slate-700 rounded-lg p-2 flex space-x-1 z-10 shadow-xl border border-slate-600">
                  {reactionTypes.map(({ type, emoji, label }) => (
                    <button
                      key={type}
                      onClick={() => handleReact(type)}
                      className="w-8 h-8 rounded-lg hover:bg-slate-600 flex items-center justify-center transition-colors"
                      title={label}
                    >
                      <span className="text-lg">{emoji}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Comment Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onComment && onComment(post.id)}
              className="text-gray-400 hover:text-white hover:bg-slate-700"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              <span className="text-sm">
                {post.comments_count || 0} Comments
              </span>
            </Button>

            {/* Share Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShare && onShare(post.id)}
              className="text-gray-400 hover:text-white hover:bg-slate-700"
            >
              <Share className="w-4 h-4 mr-1" />
              <span className="text-sm">Share</span>
            </Button>
          </div>

          {/* Download Button for Media */}
          {post.media && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-slate-700"
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelPost;