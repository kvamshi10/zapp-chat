import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { useSocketStore } from './store/socketStore';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './components/LoadingScreen';

function App() {
  const { user, checkAuth, isLoading } = useAuthStore();
  const { theme, initTheme } = useThemeStore();
  const { connect, disconnect } = useSocketStore();

  useEffect(() => {
    // Initialize theme
    initTheme();
    
    // Check authentication status
    checkAuth();
  }, []);

  useEffect(() => {
    // Connect to socket when user is authenticated
    if (user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      // Cleanup on unmount
      if (user) {
        disconnect();
      }
    };
  }, [user]);

  useEffect(() => {
    // Apply theme class to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/chat" replace /> : <Login />
        } />
        <Route path="/register" element={
          user ? <Navigate to="/chat" replace /> : <Register />
        } />
        <Route path="/chat" element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } />
        <Route path="/chat/:chatId" element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        <Route path="/profile/:userId?" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/" element={
          <Navigate to={user ? "/chat" : "/login"} replace />
        } />
        <Route path="*" element={
          <Navigate to="/" replace />
        } />
      </Routes>
    </div>
  );
}

export default App;
