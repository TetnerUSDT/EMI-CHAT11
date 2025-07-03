import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { 
  ArrowLeft, 
  Search, 
  MoreVertical, 
  Plus,
  Hash,
  Users,
  MessageCircle,
  Paperclip,
  Smile,
  Send,
  Eye,
  Settings,
  Crown,
  Shield,
  Star,
  UserPlus,
  X,
  Mic
} from 'lucide-react';
import StickerPicker from './StickerPicker';
import VoiceRecorder from './VoiceRecorder';
import FileUploader from './FileUploader';
import ChannelPost from './ChannelPost';
import PostCreator from './PostCreator';
import ImagePostModal from './ImagePostModal';
import { chatAPI, userAPI, postAPI } from '../services/api';
import { useToast } from '../hooks/use-toast';
import { useLanguage } from '../contexts/LanguageContext';

const ChatWindow = ({ chat, currentUser, onSendMessage, onBack }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [posts, setPosts] = useState([]);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const scrollContainerRef = useRef(null);
  const [showStickers, setShowStickers] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showFileUploader, setShowFileUploader] = useState(false);
  const [showPostCreator, setShowPostCreator] = useState(false);
  const [showImagePostModal, setShowImagePostModal] = useState(false);
  const [draggedImageFile, setDraggedImageFile] = useState(null);
  const [draggedImagePreview, setDraggedImagePreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
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
    // Only scroll to bottom when explicitly requested (new posts added, not pagination)
    if (shouldScrollToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setShouldScrollToBottom(false);
    }
  }, [posts, shouldScrollToBottom]);

  const loadChannelPosts = async (beforeSequence = null, isLoadMore = false) => {
    if (!chat?.id) return;
    
    if (!isLoadMore) {
      setIsLoading(true);
    } else {
      setIsLoadingMorePosts(true);
    }
    
    try {
      if (!isLoadMore) {
        // Первоначальная загрузка - получаем последние 10 постов
        const channelPosts = await postAPI.getChannelPosts(chat.id, 10, null);
        setPosts(channelPosts);
        setHasMorePosts(channelPosts.length === 10);
        setShouldScrollToBottom(true); // Scroll to bottom on initial load
      } else {
        // Пагинация - загружаем более старые посты
        const channelPosts = await postAPI.getChannelPosts(chat.id, 10, beforeSequence);
        
        if (channelPosts.length > 0) {
          // Фильтруем дублирующие посты для дополнительной защиты
          const existingPostIds = new Set(posts.map(post => post.id));
          const newPosts = channelPosts.filter(post => !existingPostIds.has(post.id));
          
          if (newPosts.length > 0) {
            // Добавляем только новые посты в начало массива
            setPosts(prevPosts => [...newPosts, ...prevPosts]);
          }
          
          setHasMorePosts(channelPosts.length === 10);
        } else {
          setHasMorePosts(false);
        }
      }
      
    } catch (error) {
      console.error('Error loading channel posts:', error);
      toast({
        title: "Failed to load posts",
        description: "Please try refreshing.",
        variant: "destructive"
      });
    } finally {
      if (!isLoadMore) {
        setIsLoading(false);
      } else {
        setIsLoadingMorePosts(false);
      }
    }
  };

  const loadMorePosts = async () => {
    if (!hasMorePosts || isLoadingMorePosts || posts.length === 0) return;
    
    // Получаем минимальный sequence_number из текущих постов
    const oldestPost = posts[0]; // Первый пост - самый старый
    const beforeSequence = oldestPost.sequence_number;
    
    await loadChannelPosts(beforeSequence, true);
  };

  const checkIfNeedMorePosts = () => {
    if (!scrollContainerRef.current || !hasMorePosts || isLoadingMorePosts) return;
    
    const container = scrollContainerRef.current;
    const { scrollHeight, clientHeight } = container;
    
    // If content height is less than or equal to container height,
    // load more posts automatically
    if (scrollHeight <= clientHeight && hasMorePosts) {
      console.log('Auto-loading more posts because content fits in container');
      loadMorePosts();
    }
  };

  // Check if we need to load more posts when posts change
  useEffect(() => {
    if (isChannel && posts.length > 0) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(checkIfNeedMorePosts, 100);
    }
  }, [posts, isChannel]);

  const handleScroll = (e) => {
    const { scrollTop } = e.target;
    
    // Загружаем больше постов когда прокручиваем к началу (вверх)
    if (scrollTop < 100 && hasMorePosts && !isLoadingMorePosts && isChannel) {
      loadMorePosts();
    }
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
      if (isChannel) {
        // В канале отправляем как пост
        const postData = {
          text: messageText,
          media_url: null,
          media_type: null
        };

        const newPost = await postAPI.createPost(chat.id, postData);
        
        // Добавляем пост сразу в UI для мгновенного отображения
        setPosts(prevPosts => [...prevPosts, newPost]);
        setShouldScrollToBottom(true); // Trigger scroll for new posts
        
        toast({
          title: "Сообщение отправлено",
          description: "Ваше сообщение опубликовано в канале."
        });
      } else {
        // В обычном чате отправляем как сообщение
        await chatAPI.sendMessage(chat.id, {
          content: messageText,
          message_type: 'text'
        });
        
        // Reload messages from server instead of adding locally
        await loadMessages();
      }
      
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
      const postData = {
        text: newPost.text,
        media_url: newPost.media,
        media_type: newPost.media_type
      };

      const createdPost = await postAPI.createPost(chat.id, postData);
      
      // Add the new post to the end of the posts array (like in chat)
      setPosts(prevPosts => [...prevPosts, createdPost]);
      setShouldScrollToBottom(true); // Trigger scroll for new posts
      
      toast({
        title: "Post Created",
        description: "Your post has been published successfully.",
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Post Failed",
        description: error.response?.data?.detail || "Failed to create post. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleReactToPost = async (postId, reactionType, userId) => {
    try {
      // Send to server first to get the actual result
      const response = await postAPI.addReaction(postId, reactionType);
      
      // Update UI with server response
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return { ...post, reactions: response.reactions };
          }
          return post;
        })
      );
    } catch (error) {
      console.error('Error reacting to post:', error);
      toast({
        title: "Reaction Failed",
        description: error.response?.data?.detail || "Failed to add reaction. Please try again.",
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

  // Drag & Drop functions for image posts
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isChannel && canPost) {
      setIsDragOver(true);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isChannel && canPost) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only hide overlay if leaving the container element itself, not its children
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (!isChannel || !canPost) return;
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      // Convert to base64 for preview and storage
      const reader = new FileReader();
      reader.onload = (event) => {
        setDraggedImageFile(imageFile);
        setDraggedImagePreview(event.target.result);
        setShowImagePostModal(true);
      };
      reader.readAsDataURL(imageFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please drop an image file.",
        variant: "destructive"
      });
    }
  };

  const handleImagePostSubmit = async ({ file, caption, compress }) => {
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target.result;
        
        const postData = {
          text: caption,
          media_url: base64Data,
          media_type: 'image'
        };
        
        const newPost = await postAPI.createPost(chat.id, postData);
        setPosts(prevPosts => [...prevPosts, newPost]);
        setShouldScrollToBottom(true); // Trigger scroll for new posts
        
        toast({
          title: "Post Created",
          description: "Your image post has been published successfully!"
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error creating image post:', error);
      toast({
        title: "Failed to create post",
        description: error.response?.data?.detail || "Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleCloseImagePostModal = () => {
    setShowImagePostModal(false);
    setDraggedImageFile(null);
    setDraggedImagePreview(null);
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
            
            {/* More options */}
            <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white p-2">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages/Posts */}
      <div 
        ref={scrollContainerRef}
        className={`flex-1 overflow-y-auto p-4 space-y-4 relative chat-scrollbar ${
          isChannel 
            ? chat?.background_style === 'dark-structure' 
              ? 'bg-dark-structure' 
              : 'bg-default-dark'
            : ''
        }`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onScroll={handleScroll}
      >
        {/* Drag overlay for channels - fixed positioning to cover visible viewport */}
        {isDragOver && isChannel && canPost && (
          <div className="fixed inset-0 bg-blue-600/20 border-2 border-dashed border-blue-400 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="text-center text-white">
              <div className="text-4xl mb-2">📷</div>
              <p className="text-lg font-semibold">Отпустите для создания поста</p>
              <p className="text-sm opacity-75">Изображение будет добавлено как пост в канал</p>
            </div>
          </div>
        )}
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
          </div>
        ) : isChannel ? (
          /* Channel Posts - Aligned to left */
          <div className="flex flex-col items-start space-y-4">
            {/* Load more button for cases when auto-loading doesn't work */}
            {hasMorePosts && !isLoadingMorePosts && (
              <div className="flex justify-center w-full py-2">
                <Button
                  onClick={loadMorePosts}
                  variant="outline"
                  size="sm"
                  className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                >
                  Загрузить старые сообщения
                </Button>
              </div>
            )}
            
            {/* Loading more posts indicator */}
            {isLoadingMorePosts && (
              <div className="flex justify-center items-center w-full py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400"></div>
                <span className="ml-2 text-gray-400 text-sm">Загружаем старые посты...</span>
              </div>
            )}
            
            {posts.length === 0 ? (
              <div className="flex justify-center items-center h-full text-gray-400 w-full">
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
                  channel={chat}
                  currentUser={currentUser}
                  onReact={handleReactToPost}
                  onComment={handleCommentOnPost}
                  onShare={handleSharePost}
                  isChannel={true}
                />
              ))
            )}
          </div>
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
      <div 
        className="p-4 border-t border-slate-700 bg-slate-800/80 backdrop-blur-sm relative"
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
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
      )}

      {/* Image Post Modal */}
      <ImagePostModal 
        isOpen={showImagePostModal}
        onClose={handleCloseImagePostModal}
        onSubmit={handleImagePostSubmit}
        imageFile={draggedImageFile}
        imagePreview={draggedImagePreview}
      />
    </div>
  );
};

export default ChatWindow;