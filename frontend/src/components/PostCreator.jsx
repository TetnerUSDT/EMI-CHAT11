import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  Send, 
  Image, 
  Video, 
  X, 
  Upload,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const MediaPreview = ({ media, type, onRemove }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (type === 'video') {
    return (
      <div className="relative max-w-md">
        <video 
          ref={videoRef}
          src={media}
          className="w-full rounded-lg max-h-64 object-cover"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        
        {/* Video Controls Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePlayPause}
              className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center text-white"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            <button
              onClick={handleMuteToggle}
              className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Remove Button */}
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative max-w-md">
      <img 
        src={media} 
        alt="Preview"
        className="w-full rounded-lg max-h-64 object-cover"
      />
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const PostCreator = ({ 
  currentUser, 
  channel, 
  isOpen, 
  onClose, 
  onCreatePost,
  canPost = false 
}) => {
  const [text, setText] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const { toast } = useToast();

  const handleMediaUpload = (file, type) => {
    if (!file) return;

    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setMedia(e.target.result);
      setMediaType(type);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveMedia = () => {
    setMedia(null);
    setMediaType(null);
  };

  const handleCreatePost = async () => {
    if (!text.trim() && !media) {
      toast({
        title: "Empty Post",
        description: "Please add some content to your post.",
        variant: "destructive"
      });
      return;
    }

    setIsPosting(true);
    try {
      const newPost = {
        id: `post_${Date.now()}`,
        channel: {
          id: channel.id,
          name: channel.name,
          is_verified: channel.is_verified || false
        },
        author: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar
        },
        text: text.trim(),
        media: media,
        media_type: mediaType,
        timestamp: new Date().toISOString(),
        reactions: {},
        comments_count: 0,
        views: Math.floor(Math.random() * 1000) + 50 // Mock view count
      };

      if (onCreatePost) {
        await onCreatePost(newPost);
      }

      toast({
        title: "Post Created",
        description: "Your post has been published successfully.",
      });

      // Reset form
      setText('');
      setMedia(null);
      setMediaType(null);
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Post Failed",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsPosting(false);
    }
  };

  if (!canPost) {
    return (
      <div className="p-4 text-center text-gray-400">
        <p>Only administrators can post in this channel.</p>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Create Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Author Info */}
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={currentUser?.avatar} />
              <AvatarFallback className="bg-emerald-600 text-white">
                {currentUser?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold text-white">{channel?.name}</h4>
              <p className="text-sm text-gray-400">Posting as {currentUser?.name}</p>
            </div>
          </div>

          {/* Text Content */}
          <div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What would you like to share with your subscribers?"
              className="w-full px-3 py-3 bg-slate-800 border border-slate-600 text-white placeholder-gray-400 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={4}
            />
          </div>

          {/* Media Preview */}
          {media && (
            <MediaPreview 
              media={media}
              type={mediaType}
              onRemove={handleRemoveMedia}
            />
          )}

          {/* Upload Loading */}
          {isUploading && (
            <div className="flex items-center justify-center p-8 bg-slate-800 rounded-lg border-2 border-dashed border-slate-600">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-400">Uploading media...</p>
              </div>
            </div>
          )}

          {/* Media Upload Buttons */}
          {!media && !isUploading && (
            <div className="flex space-x-3">
              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center space-x-2 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors text-gray-300"
              >
                <Image className="w-5 h-5" />
                <span>Add Photo</span>
              </button>
              <button
                onClick={() => videoInputRef.current?.click()}
                className="flex items-center space-x-2 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors text-gray-300"
              >
                <Video className="w-5 h-5" />
                <span>Add Video</span>
              </button>
            </div>
          )}

          {/* Hidden File Inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleMediaUpload(e.target.files[0], 'image')}
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => handleMediaUpload(e.target.files[0], 'video')}
            className="hidden"
          />

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-700">
            <div className="text-sm text-gray-400">
              {text.length}/4000 characters
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-slate-600 text-gray-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePost}
                disabled={isPosting || (!text.trim() && !media) || text.length > 4000}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isPosting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Publish Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostCreator;