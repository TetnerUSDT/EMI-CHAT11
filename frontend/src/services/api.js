import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  // Generate authentication message
  generateMessage: async (walletAddress, network) => {
    const response = await api.post('/auth/generate-message', null, {
      params: { wallet_address: walletAddress, network }
    });
    return response.data;
  },

  // Login with wallet signature
  login: async (walletAddress, network, signature, message) => {
    const response = await api.post('/auth/login', {
      wallet_address: walletAddress,
      network,
      signature,
      message
    });
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

export const chatAPI = {
  // Get user's chats
  getChats: async (chatType = null) => {
    const params = chatType ? { chat_type: chatType } : {};
    const response = await api.get('/chats/', { params });
    return response.data;
  },

  // Create new chat
  createChat: async (chatData) => {
    const response = await api.post('/chats/', chatData);
    return response.data;
  },

  // Get chat messages
  getMessages: async (chatId, page = 1, limit = 50) => {
    const response = await api.get(`/chats/${chatId}/messages`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Send message
  sendMessage: async (chatId, messageData) => {
    const response = await api.post(`/chats/${chatId}/messages`, messageData);
    return response.data;
  },

  // Search chats
  searchChats: async (query, chatType = null) => {
    const params = { query };
    if (chatType) params.chat_type = chatType;
    const response = await api.get('/chats/search', { params });
    return response.data;
  },

  // Subscribe to channel
  subscribeToChannel: async (channelId) => {
    const response = await api.post(`/chats/${channelId}/subscribe`);
    return response.data;
  },

  // Toggle pin status
  toggleChatPin: async (chatId) => {
    const response = await api.patch(`/chats/${chatId}/pin`);
    return response.data;
  },

  // Update chat information
  updateChat: async (chatId, updateData) => {
    const response = await api.put(`/chats/${chatId}`, updateData);
    return response.data;
  },

  // Update channel background
  updateChannelBackground: async (chatId, backgroundStyle) => {
    const response = await api.patch(`/chats/${chatId}/background?background_style=${backgroundStyle}`);
    return response.data;
  }
};

export const userAPI = {
  // Search users
  searchUsers: async (query) => {
    const response = await api.get('/users/search', {
      params: { query }
    });
    return response.data;
  },

  // Get user profile
  getUserProfile: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  }
};

export const postAPI = {
  // Create a post in a channel
  createPost: async (channelId, postData) => {
    const response = await api.post(`/posts/${channelId}`, postData);
    return response.data;
  },

  // Get posts from a channel
  getChannelPosts: async (channelId, page = 1, limit = 20) => {
    const response = await api.get(`/posts/${channelId}`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Add reaction to a post
  addReaction: async (postId, reactionType) => {
    const response = await api.post(`/posts/${postId}/reactions`, {
      reaction_type: reactionType
    });
    return response.data;
  },

  // Delete a post
  deletePost: async (postId) => {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  }
};

export default api;