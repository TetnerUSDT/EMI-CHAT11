import React, { useState, useEffect } from 'react';
import './App.css';
import 'react-image-crop/dist/ReactCrop.css';
import AuthScreen from './components/AuthScreen';
import MainApp from './components/MainApp';
import { Toaster } from './components/ui/toaster';
import { LanguageProvider } from './contexts/LanguageContext';
import { authAPI } from './services/api';
import EMILogo from './components/ui/logo';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');
      
      if (token && userData) {
        // Verify token is still valid
        const currentUser = await authAPI.getMe();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid auth data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    // Also update localStorage
    localStorage.setItem('user_data', JSON.stringify(updatedUser));
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%22%20height=%2260%22%20viewBox=%220%200%2060%2060%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22none%22%20fill-rule=%22evenodd%22%3E%3Cg%20fill=%22%239C92AC%22%20fill-opacity=%220.1%22%3E%3Ccircle%20cx=%2230%22%20cy=%2230%22%20r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
        <div className="text-center relative z-10">
          <EMILogo size={120} animate={true} className="mx-auto mb-6" />
          <div className="flex items-center space-x-2 text-purple-300">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-purple-300 mt-4 text-lg font-medium">Loading EMI...</p>
        </div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <div className="App">
        {!user ? (
          <AuthScreen onAuthSuccess={handleAuthSuccess} />
        ) : (
          <MainApp user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />
        )}
        <Toaster />
      </div>
    </LanguageProvider>
  );
}

export default App;