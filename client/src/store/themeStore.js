import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export const useThemeStore = create(
  devtools(
    persist(
      (set) => ({
        theme: 'light',
        
        // Initialize theme from localStorage or system preference
        initTheme: () => {
          const savedTheme = localStorage.getItem('theme');
          if (savedTheme) {
            set({ theme: savedTheme });
          } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            set({ theme: prefersDark ? 'dark' : 'light' });
          }
        },
        
        // Toggle theme
        toggleTheme: () => {
          set((state) => {
            const newTheme = state.theme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            return { theme: newTheme };
          });
        },
        
        // Set specific theme
        setTheme: (theme) => {
          localStorage.setItem('theme', theme);
          set({ theme });
        }
      }),
      {
        name: 'theme-storage',
      }
    )
  )
);
