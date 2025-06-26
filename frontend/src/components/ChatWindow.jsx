import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Phone, 
  Video, 
  MoreVertical,
  Mic,
  MicOff,
  MessageCircle,
  Play,
  Pause,
  ArrowLeft,
  Search,
  Plus,
  Settings,
  Hash
} from 'lucide-react';
import StickerPicker from './StickerPicker';
import VoiceRecorder from './VoiceRecorder';
import FileUploader from './FileUploader';
import ChannelPost from './ChannelPost';
import PostCreator from './PostCreator';
import { chatAPI, userAPI } from '../services/api';
import { useToast } from '../hooks/use-toast';
import { useLanguage } from '../contexts/LanguageContext';

const ChatWindow = ({ chat, currentUser, onSendMessage, onBack }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [posts, setPosts] = useState([]);
  const [showStickers, setShowStickers] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showFileUploader, setShowFileUploader] = useState(false);
  const [showPostCreator, setShowPostCreator] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const isChannel = chat?.chat_type === 'channel';
  const isChannelOwner = isChannel && chat?.owner_id === currentUser?.id;
  const canPost = isChannel ? (isChannelOwner || chat?.allow_all_messages) : true;

  useEffect(() => {
    if (chat?.id) {
      if (isChannel) {
        loadChannelPosts();
      } else {
        loadMessages();
        loadOtherUser();
      }
    }
  }, [chat?.id, isChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, posts]);

  // Mock channel posts data
  const mockChannelPosts = [
    {
      id: 'post1',
      channel: {
        id: chat?.id,
        name: chat?.name,
        is_verified: true
      },
      author: {
        id: currentUser?.id,
        name: currentUser?.name,
        avatar: currentUser?.avatar
      },
      text: 'В Японии в городе Хаконэ на острове Хонсю нашли винные ванны со спа.',
      media: '/api/placeholder/400/300',
      media_type: 'image',
      timestamp: '2024-06-12T10:17:00Z',
      reactions: {
        like: ['user1', 'user2'],
        love: ['user3']
      },
      comments_count: 2,
      views: 3960
    },
    {
      id: 'post2',
      channel: {
        id: chat?.id,
        name: chat?.name,
        is_verified: true
      },
      author: {
        id: currentUser?.id,
        name: currentUser?.name,
        avatar: currentUser?.avatar
      },
      text: '🤔 Пентагон в честь Дня американского флага опубликовал поздравление с российским триколором.',
      media: '/api/placeholder/400/400',
      media_type: 'image',
      timestamp: '2024-06-15T08:30:00Z',
      reactions: {
        like: ['user1', 'user2', 'user3', 'user4', 'user5'],
        laugh: ['user6', 'user7', 'user8']
      },
      comments_count: 6,
      views: 3507
    }
  ];

  const loadChannelPosts = () => {
    // Mock loading channel posts
    setPosts(mockChannelPosts);
  };

  const loadOtherUser = async () => {
    if (!chat || chat.chat_type !== 'personal') return;
    
    // Find other participant
    const otherParticipantId = chat.participants.find(id => id !== currentUser.id);
    if (!otherParticipantId) return;

    // Сначала используем предзагруженные данные если есть
    if (chat.preloadedUserData) {
      setOtherUser(chat.preloadedUserData);
      return; // Не делаем API запрос если данные уже есть
    }

    setIsLoadingUser(true);
    try {
      const userData = await userAPI.getUserProfile(otherParticipantId);
      setOtherUser(userData);
    } catch (error) {
      console.error('Error loading other user:', error);
      // Keep otherUser as null, fallback to default display
    } finally {
      setIsLoadingUser(false);
    }
  };

  const loadMessages = async () => {
    if (!chat?.id) return;
    
    setIsLoading(true);
    try {
      const chatMessages = await chatAPI.getMessages(chat.id);
      setMessages(chatMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Failed to load messages",
        description: "Please try refreshing.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const messageText = message;
    setMessage('');
    
    try {
      await chatAPI.sendMessage(chat.id, {
        content: messageText,
        message_type: 'text'
      });
      
      // Reload messages from server instead of adding locally
      await loadMessages();
      
      if (onSendMessage) {
        onSendMessage(messageText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: t('failedToSend'),
        description: t('tryAgain'),
        variant: "destructive"
      });
      // Restore message on error
      setMessage(messageText);
    }
  };

  const handleStickerSelect = async (sticker) => {
    try {
      const messageData = {
        content: sticker.name,
        message_type: 'sticker',
        sticker_url: sticker.icon
      };
      
      await chatAPI.sendMessage(chat.id, messageData);
      await loadMessages(); // Reload messages
      
      toast({
        title: "Sticker sent!",
        description: `${sticker.name} sticker has been sent.`
      });
    } catch (error) {
      console.error('Error sending sticker:', error);
      toast({
        title: "Failed to send sticker",
        description: "Please try again.",
        variant: "destructive"
      });
    }
    setShowStickers(false);
  };

  const handleCreatePost = async (newPost) => {
    try {
      // Add the new post to the beginning of the posts array
      setPosts(prevPosts => [newPost, ...prevPosts]);
      
      toast({
        title: "Post Created",
        description: "Your post has been published successfully.",
      });
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  };

  const handleReactToPost = async (postId, reactionType, userId) => {
    try {
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const updatedReactions = { ...post.reactions };
            
            // Initialize reaction type if it doesn't exist
            if (!updatedReactions[reactionType]) {
              updatedReactions[reactionType] = [];
            }
            
            // Toggle user reaction
            if (updatedReactions[reactionType].includes(userId)) {
              updatedReactions[reactionType] = updatedReactions[reactionType].filter(id => id !== userId);
            } else {
              // Remove user from other reactions first
              Object.keys(updatedReactions).forEach(type => {
                updatedReactions[type] = updatedReactions[type].filter(id => id !== userId);
              });
              // Add to new reaction
              updatedReactions[reactionType].push(userId);
            }
            
            return { ...post, reactions: updatedReactions };
          }
          return post;
        })
      );
    } catch (error) {
      console.error('Error reacting to post:', error);
      toast({
        title: "Reaction Failed",
        description: "Failed to add reaction. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCommentOnPost = (postId) => {
    toast({
      title: "Comments",
      description: "Comments feature coming soon!",
    });
  };

  const handleSharePost = (postId) => {
    toast({
      title: "Share",
      description: "Share feature coming soon!",
    });
  };

  const handleVoiceMessage = async (voiceData) => {
    try {
      const messageData = {
        content: `Voice message (${voiceData.duration}s)`,
        message_type: 'voice',
        file_url: voiceData.data,
        file_name: `voice_${Date.now()}.webm`,
        file_size: voiceData.data.length
      };
      
      await chatAPI.sendMessage(chat.id, messageData);
      await loadMessages(); // Reload messages
      
      toast({
        title: "Voice message sent!",
        description: `Voice message (${voiceData.duration}s) has been sent.`
      });
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast({
        title: "Failed to send voice message",
        description: "Please try again.",
        variant: "destructive"
      });
    }
    setShowVoiceRecorder(false);
  };

  const handleFileUpload = async (fileData) => {
    try {
      const messageData = {
        content: fileData.name,
        message_type: 'file',
        file_url: fileData.data,
        file_name: fileData.name,
        file_size: fileData.size
      };
      
      await chatAPI.sendMessage(chat.id, messageData);
      await loadMessages(); // Reload messages
      
      toast({
        title: "File sent!",
        description: `${fileData.name} has been sent.`
      });
    } catch (error) {
      console.error('Error sending file:', error);
      toast({
        title: "Failed to send file",
        description: "Please try again.",
        variant: "destructive"
      });
    }
    setShowFileUploader(false);
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Simulate voice recording
      setTimeout(() => {
        setIsRecording(false);
      }, 3000);
    }
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getChatDisplayInfo = () => {
    if (chat.chat_type === 'personal') {
      if (otherUser) {
        // Use real user data
        return {
          name: otherUser.username ? `@${otherUser.username}` : '@Anonymous',
          avatar: otherUser.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${otherUser.id}`,
          isOnline: otherUser.is_online,
          lastSeen: otherUser.last_seen,
          trustScore: otherUser.trust_score
        };
      } else if (isLoadingUser) {
        // Show loading state instead of wrong fallback
        return {
          name: 'Loading...',
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=loading`,
          isOnline: false,
          lastSeen: null,
          trustScore: 0
        };
      } else {
        // Better fallback - try to use chat name first
        const otherParticipantId = chat.participants.find(id => id !== currentUser.id);
        // Если есть chat.name, используем его, иначе fallback
        const displayName = chat.name && chat.name !== `User ${otherParticipantId?.slice(-6)}` 
          ? chat.name 
          : 'Loading user...';
        
        return {
          name: displayName.startsWith('@') ? displayName : `@${displayName}`,
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${otherParticipantId || 'default'}`,
          isOnline: false,
          lastSeen: null,
          trustScore: 0
        };
      }
    }
    return {
      name: chat.name || 'Group Chat',
      avatar: chat.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${chat.id}`,
      isOnline: false,
      lastSeen: null,
      memberCount: chat.participants?.length || 0
    };
  };

  const displayInfo = getChatDisplayInfo();

  return (
    <div className="flex flex-col h-full bg-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-800/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Back button for mobile */}
            {onBack && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="lg:hidden text-gray-400 hover:text-white p-2"
                onClick={onBack}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            
            <Avatar className="w-10 h-10">
              <AvatarImage src={displayInfo.avatar} />
              <AvatarFallback className={`text-white ${isChannel ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                {isChannel ? <Hash className="w-6 h-6" /> : displayInfo.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-white">{displayInfo.name}</h3>
              </div>
              <p className="text-sm text-gray-400">
                {displayInfo.isOnline ? 'Online' : 'Last seen recently'}
                {displayInfo.memberCount && ` • ${displayInfo.memberCount} members`}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-1">
            {/* Create Post button for channels */}
            {isChannel && canPost && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-gray-400 hover:text-white p-2"
                onClick={() => setShowPostCreator(true)}
                title="Create Post"
              >
                <Plus className="w-5 h-5" />
              </Button>
            )}
            
            {/* Search messages button */}
            <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white p-2">
              <Search className="w-4 h-4" />
            </Button>
            
            {/* Phone call button */}
            <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white p-2">
              <Phone className="w-4 h-4" />
            </Button>
            
            {/* Video call button - hidden on small screens */}
            <Button size="sm" variant="ghost" className="hidden sm:flex text-gray-400 hover:text-white p-2">
              <Video className="w-4 h-4" />
            </Button>
            
            {/* More options */}
            <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white p-2">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages/Posts */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
          </div>
        ) : isChannel ? (
          /* Channel Posts */
          posts.length === 0 ? (
            <div className="flex justify-center items-center h-full text-gray-400">
              <div className="text-center">
                <Hash className="w-16 h-16 mx-auto mb-2 opacity-50" />
                <p>No posts yet</p>
                <p className="text-sm">
                  {canPost ? 'Create the first post!' : 'Admin will post content soon'}
                </p>
              </div>
            </div>
          ) : (
            posts.map((post) => (
              <ChannelPost
                key={post.id}
                post={post}
                currentUser={currentUser}
                onReact={handleReactToPost}
                onComment={handleCommentOnPost}
                onShare={handleSharePost}
                isChannel={true}
              />
            ))
          )
        ) : (
          /* Regular Messages */
          messages.length === 0 ? (
            <div className="flex justify-center items-center h-full text-gray-400">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-2 opacity-50" />
                <p>No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isSentByMe = msg.sender_id === currentUser.id;
              
              return (
                <div
                  key={msg.id}
                  className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    isSentByMe 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-700 text-white'
                  }`}>
                    {msg.message_type === 'sticker' && msg.sticker_url && (
                      <div className="text-center">
                        <span className="text-3xl">{msg.sticker_url}</span>
                      </div>
                    )}
                    
                    {msg.message_type === 'voice' && (
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="ghost" className="p-1 text-current">
                          <Play className="w-4 h-4" />
                        </Button>
                        <div className="flex-1 h-1 bg-white/20 rounded-full">
                          <div className="h-full w-1/3 bg-white rounded-full"></div>
                        </div>
                        <span className="text-xs">0:15</span>
                      </div>
                    )}
                    
                    {msg.message_type === 'file' && (
                      <div className="flex items-center space-x-2">
                        <Paperclip className="w-4 h-4" />
                        <span className="text-sm">{msg.content}</span>
                      </div>
                    )}
                    
                    {(!msg.message_type || msg.message_type === 'text') && (
                      <p className="text-sm">{msg.content}</p>
                    )}
                    
                    <p className="text-xs opacity-70 mt-1">
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })
          )
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Sticker Picker */}
      <StickerPicker 
        isOpen={showStickers}
        onStickerSelect={handleStickerSelect}
        onClose={() => setShowStickers(false)}
      />

      {/* Voice Recorder */}
      <VoiceRecorder 
        isOpen={showVoiceRecorder}
        onSend={handleVoiceMessage}
        onClose={() => setShowVoiceRecorder(false)}
      />

      {/* File Uploader */}
      <FileUploader 
        isOpen={showFileUploader}
        onFileSelect={handleFileUpload}
        onClose={() => setShowFileUploader(false)}
      />

      {/* Post Creator for Channels */}
      {isChannel && (
        <PostCreator
          currentUser={currentUser}
          channel={chat}
          isOpen={showPostCreator}
          onClose={() => setShowPostCreator(false)}
          onCreatePost={handleCreatePost}
          canPost={canPost}
        />
      )}

      {/* Post Creator for Channels */}
      {isChannel && (
        <PostCreator
          currentUser={currentUser}
          channel={chat}
          isOpen={showPostCreator}
          onClose={() => setShowPostCreator(false)}
          onCreatePost={handleCreatePost}
          canPost={canPost}
        />
      )}

      {/* Input - Hide for channels if user can't post */}
      {(!isChannel || canPost) && (
      <div className="p-4 border-t border-slate-700 bg-slate-800/80 backdrop-blur-sm relative">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-gray-400 hover:text-white"
            onClick={() => {
              setShowStickers(!showStickers);
              setShowVoiceRecorder(false);
              setShowFileUploader(false);
            }}
          >
            <Smile className="w-5 h-5" />
          </Button>
          
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-gray-400 hover:text-white"
            onClick={() => {
              setShowFileUploader(!showFileUploader);
              setShowStickers(false);
              setShowVoiceRecorder(false);
            }}
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('typeMessage')}
            className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:ring-emerald-500 focus:border-emerald-500"
          />
          
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-gray-400 hover:text-white"
            onClick={() => {
              setShowVoiceRecorder(!showVoiceRecorder);
              setShowStickers(false);
              setShowFileUploader(false);
            }}
          >
            <Mic className="w-5 h-5" />
          </Button>
          
          <Button
            type="submit"
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={!message.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;