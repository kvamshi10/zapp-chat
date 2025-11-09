import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import api from '../utils/api';
import toast from 'react-hot-toast';

export const useAuthStore = create(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,

        // Login
        login: async (credentials) => {
          set({ isLoading: true });
          try {
            const response = await api.post('/auth/login', credentials);
            const { user, token } = response.data;
            
            set({ 
              user, 
              token, 
              isAuthenticated: true,
              isLoading: false 
            });
            
            // Set token in API defaults
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            toast.success('Login successful!');
            return { success: true };
          } catch (error) {
            set({ isLoading: false });
            const message = error.response?.data?.message || 'Login failed';
            toast.error(message);
            return { success: false, error: message };
          }
        },

        // Register
        register: async (userData) => {
          set({ isLoading: true });
          try {
            const response = await api.post('/auth/register', userData);
            const { user, token } = response.data;
            
            set({ 
              user, 
              token, 
              isAuthenticated: true,
              isLoading: false 
            });
            
            // Set token in API defaults
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            toast.success('Registration successful!');
            return { success: true };
          } catch (error) {
            set({ isLoading: false });
            const message = error.response?.data?.message || 'Registration failed';
            toast.error(message);
            return { success: false, error: message };
          }
        },

        // Logout
        logout: async () => {
          try {
            await api.post('/auth/logout');
          } catch (error) {
            console.error('Logout error:', error);
          } finally {
            set({ 
              user: null, 
              token: null, 
              isAuthenticated: false 
            });
            
            // Remove token from API defaults
            delete api.defaults.headers.common['Authorization'];
            
            // Clear persisted state
            localStorage.removeItem('auth-storage');
            
            toast.success('Logged out successfully');
          }
        },

        // Check authentication status
        checkAuth: async () => {
          const token = get().token;
          if (!token) {
            set({ isLoading: false, isAuthenticated: false });
            return;
          }

          set({ isLoading: true });
          
          // Set token in API defaults
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          try {
            const response = await api.get('/auth/me');
            set({ 
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false 
            });
          } catch (error) {
            console.error('Auth check failed:', error);
            set({ 
              user: null, 
              token: null, 
              isAuthenticated: false,
              isLoading: false 
            });
            delete api.defaults.headers.common['Authorization'];
          }
        },

        // Update user profile
        updateProfile: async (updates) => {
          try {
            const response = await api.put('/auth/update-profile', updates);
            set({ user: response.data.user });
            toast.success('Profile updated successfully');
            return { success: true };
          } catch (error) {
            const message = error.response?.data?.message || 'Update failed';
            toast.error(message);
            return { success: false, error: message };
          }
        },

        // Change password
        changePassword: async (passwords) => {
          try {
            const response = await api.put('/auth/change-password', passwords);
            const { token } = response.data;
            
            set({ token });
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            toast.success('Password changed successfully');
            return { success: true };
          } catch (error) {
            const message = error.response?.data?.message || 'Password change failed';
            toast.error(message);
            return { success: false, error: message };
          }
        },

        // Update specific user fields
        updateUser: (updates) => {
          set((state) => ({
            user: { ...state.user, ...updates }
          }));
        }
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ 
          user: state.user, 
          token: state.token,
          isAuthenticated: state.isAuthenticated
        }),
      }
    )
  )
);
