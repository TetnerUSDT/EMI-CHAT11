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
  Search
} from 'lucide-react';
import StickerPicker from './StickerPicker';
import VoiceRecorder from './VoiceRecorder';
import FileUploader from './FileUploader';
import { chatAPI, userAPI } from '../services/api';
import { useToast } from '../hooks/use-toast';
import { useLanguage } from '../contexts/LanguageContext';

const ChatWindow = ({ chat, currentUser, onSendMessage, onBack }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showStickers, setShowStickers] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showFileUploader, setShowFileUploader] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (chat?.id) {
      loadMessages();
      loadOtherUser();
    }
  }, [chat?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
              <AvatarFallback className="bg-emerald-600 text-white">
                {displayInfo.name.charAt(0).toUpperCase()}
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
          </div>
        ) : messages.length === 0 ? (
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
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                      >
                        <Play size={16} />
                      </Button>
                      <div className="flex-1">
                        <div className="bg-white/20 h-1 rounded-full">
                          <div className="bg-white h-1 rounded-full w-1/3"></div>
                        </div>
                      </div>
                      <span className="text-xs opacity-75">0:05</span>
                    </div>
                  )}
                  
                  {msg.message_type === 'file' && (
                    <div className="flex items-center space-x-2">
                      <Paperclip size={16} />
                      <span className="text-sm">{msg.file_name}</span>
                    </div>
                  )}
                  
                  {msg.message_type === 'text' && (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                  
                  <div className={`text-xs mt-1 ${
                    isSentByMe ? 'text-emerald-200' : 'text-gray-400'
                  }`}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            );
          })
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

      {/* Input */}
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