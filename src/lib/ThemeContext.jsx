import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { powerSync } from "@/api/PowerSyncConnector";
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const [theme, setThemeState] = useState(() => {
    // 1. Check local storage for quick sync to prevent flash on load
    const stored = localStorage.getItem('theme');
    if (stored) return stored;
    return 'system';
  });

  const isUpdatingRef = useRef(false);

  // Apply theme class to document
  const applyTheme = (themeName) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (themeName === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(themeName);
    }
  };

  // Run on mount and whenever theme changes
  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Handle system theme updates dynamically
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      applyTheme('system');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Sync with user database theme once user session resolves
  useEffect(() => {
    if (user && user.user_metadata?.theme) {
      const userTheme = user.user_metadata.theme;
      if (userTheme !== theme) {
        setThemeState(userTheme);
      }
    }
  }, [user]);

  const changeTheme = async (newTheme) => {
    if (newTheme === theme) return;
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    // If user is authenticated, save the preference in Supabase auth user_metadata
    if (user && !isUpdatingRef.current) {
      isUpdatingRef.current = true;
      try {
        const { error } = await supabase.auth.updateUser({
          data: { theme: newTheme }
        });
        if (error) {
          console.error('Failed to persist theme preference on server:', error);
        }
      } catch (err) {
        console.error('Error persisting theme:', err);
      } finally {
        isUpdatingRef.current = false;
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
