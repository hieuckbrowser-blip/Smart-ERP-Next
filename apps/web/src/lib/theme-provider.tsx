/**
 * Theme context and provider for Smart ERP Next.
 * Supports light/dark mode, custom brand colors, and system preference.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';

export type Theme = 'light' | 'dark' | 'system';
export type BrandColor = 'blue' | 'green' | 'purple' | 'orange' | 'red';

interface ThemeContextValue {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  brandColor: BrandColor;
  setTheme: (theme: Theme) => void;
  setBrandColor: (color: BrandColor) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const BRAND_COLORS: Record<BrandColor, string> = {
  blue: '#3b82f6',
  green: '#10b981',
  purple: '#8b5cf6',
  orange: '#f97316',
  red: '#ef4444',
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation('common');
  const [theme, setThemeState] = useState<Theme>('system');
  const [brandColor, setBrandColorState] = useState<BrandColor>('blue');
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Load saved preferences
    loadPreferences();
  }, []);

  useEffect(() => {
    // Listen for system theme changes
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => setSystemPreference(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  const loadPreferences = async () => {
    try {
      const savedTheme = await SecureStore.getItemAsync('theme');
      const savedBrand = await SecureStore.getItemAsync('brandColor');
      if (savedTheme) setThemeState(savedTheme as Theme);
      if (savedBrand) setBrandColorState(savedBrand as BrandColor);
    } catch (e) {
      // Ignore errors
    }
  };

  const effectiveTheme = theme === 'system' ? systemPreference : theme;

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    await SecureStore.setItemAsync('theme', newTheme);
  };

  const setBrandColor = async (color: BrandColor) => {
    setBrandColorState(color);
    await SecureStore.setItemAsync('brandColor', color);
  };

  // Apply theme to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(effectiveTheme);
      document.documentElement.style.setProperty('--brand-color', BRAND_COLORS[brandColor]);
    }
  }, [effectiveTheme, brandColor]);

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, brandColor, setTheme, setBrandColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

export function ThemeSwitcher() {
  const { theme, setTheme, effectiveTheme } = useTheme();
  const { t } = useTranslation('common');

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded ${theme === 'light' || (theme === 'system' && effectiveTheme === 'light') ? 'bg-blue-100' : ''}`}
        title={t('profile.themeLight')}
      >
        ☀️
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded ${theme === 'dark' || (theme === 'system' && effectiveTheme === 'dark') ? 'bg-blue-100' : ''}`}
        title={t('profile.themeDark')}
      >
        🌙
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded ${theme === 'system' ? 'bg-blue-100' : ''}`}
        title={t('profile.themeSystem')}
      >
        ⚙️
      </button>
    </div>
  );
}