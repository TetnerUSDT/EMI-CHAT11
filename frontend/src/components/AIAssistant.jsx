import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Send, Bot, User, Sparkles, Zap, DollarSign } from 'lucide-react';
import { mockFunctions } from '../data/mock';

const AIAssistant = ({ user }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      text: 'Hello! I\'m your AI assistant. I can help you with reminders, translations, crypto transactions, and more. Try commands like /help, /balance, or just ask me anything!',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const quickCommands = [
    { command: '/help', icon: Sparkles, description: 'Show available commands' },
    { command: '/balance', icon: DollarSign, description: 'Check wallet balance' },
    { command: '/remind 1h Buy coffee', icon: Zap, description: 'Set a reminder' },
    { command: '/translate Hello world', icon: Bot, description: 'Translate text' }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const aiResponse = await mockFunctions.getAIResponse(inputMessage);
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        text: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI response error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickCommand = (command) => {
    setInputMessage(command);
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="flex-1 bg-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-700 bg-slate-800/80 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Assistant</h1>
            <p className="text-gray-400">Powered by Grok 3 - Your crypto companion</p>
          </div>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Online
          </Badge>
        </div>
      </div>

      {/* Quick Commands */}
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Quick Commands</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {quickCommands.map((cmd, index) => {
            const Icon = cmd.icon;
            return (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickCommand(cmd.command)}
                className="flex items-center justify-start space-x-2 bg-slate-700 hover:bg-slate-600 border-slate-600 text-left h-auto py-2"
              >
                <Icon className="w-4 h-4 text-purple-400" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">{cmd.command}</p>
                  <p className="text-xs text-gray-400 truncate">{cmd.description}</p>
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md flex items-start space-x-3 ${
              message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.type === 'user' 
                  ? 'bg-purple-600' 
                  : 'bg-gradient-to-r from-purple-500 to-pink-600'
              }`}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              
              <div className={`px-4 py-2 rounded-2xl ${
                message.type === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-white border border-slate-600'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                <div className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-purple-200' : 'text-gray-400'
                }`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-700 border border-slate-600 px-4 py-2 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700 bg-slate-800/80 backdrop-blur-sm">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me anything or use commands like /help..."
            className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500"
            disabled={isTyping}
          />
          <Button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700"
            disabled={!inputMessage.trim() || isTyping}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        
        <div className="mt-2 text-xs text-gray-400 text-center">
          Available commands: /help, /balance, /remind, /transfer, /translate, /price
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;