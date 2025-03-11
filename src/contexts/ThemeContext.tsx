import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define theme types
export type ThemeMode = 'dark' | 'light';
export type ThemeColor = 'blue' | 'purple' | 'green' | 'amber' | 'rose';

interface ThemeContextType {
  mode: ThemeMode;
  color: ThemeColor;
  toggleMode: () => void;
  setThemeColor: (color: ThemeColor) => void;
  getColor: (intensity: number) => string;
  getBgColor: (opacity?: number) => string;
  getTextColor: () => string;
  getAccentColor: (opacity?: number) => string;
  getBorderColor: (opacity?: number) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme color definitions
const themeColors: Record<ThemeColor, Record<number, string>> = {
  blue: {
    100: 'rgb(219, 234, 254)',
    200: 'rgb(191, 219, 254)',
    300: 'rgb(147, 197, 253)',
    400: 'rgb(96, 165, 250)',
    500: 'rgb(59, 130, 246)',
    600: 'rgb(37, 99, 235)',
    700: 'rgb(29, 78, 216)',
    800: 'rgb(30, 64, 175)',
    900: 'rgb(30, 58, 138)',
    950: 'rgb(23, 37, 84)'
  },
  purple: {
    100: 'rgb(243, 232, 255)',
    200: 'rgb(233, 213, 255)',
    300: 'rgb(216, 180, 254)',
    400: 'rgb(192, 132, 252)',
    500: 'rgb(168, 85, 247)',
    600: 'rgb(147, 51, 234)',
    700: 'rgb(126, 34, 206)',
    800: 'rgb(107, 33, 168)',
    900: 'rgb(88, 28, 135)',
    950: 'rgb(59, 7, 100)'
  },
  green: {
    100: 'rgb(220, 252, 231)',
    200: 'rgb(187, 247, 208)',
    300: 'rgb(134, 239, 172)',
    400: 'rgb(74, 222, 128)',
    500: 'rgb(34, 197, 94)',
    600: 'rgb(22, 163, 74)',
    700: 'rgb(21, 128, 61)',
    800: 'rgb(22, 101, 52)',
    900: 'rgb(20, 83, 45)',
    950: 'rgb(5, 46, 22)'
  },
  amber: {
    100: 'rgb(254, 243, 199)',
    200: 'rgb(253, 230, 138)',
    300: 'rgb(252, 211, 77)',
    400: 'rgb(251, 191, 36)',
    500: 'rgb(245, 158, 11)',
    600: 'rgb(217, 119, 6)',
    700: 'rgb(180, 83, 9)',
    800: 'rgb(146, 64, 14)',
    900: 'rgb(120, 53, 15)',
    950: 'rgb(69, 26, 3)'
  },
  rose: {
    100: 'rgb(255, 228, 230)',
    200: 'rgb(254, 205, 211)',
    300: 'rgb(253, 164, 175)',
    400: 'rgb(251, 113, 133)',
    500: 'rgb(244, 63, 94)',
    600: 'rgb(225, 29, 72)',
    700: 'rgb(190, 18, 60)',
    800: 'rgb(159, 18, 57)',
    900: 'rgb(136, 19, 55)',
    950: 'rgb(76, 5, 25)'
  }
};

// Background colors by theme mode
const bgColors = {
  dark: {
    blue: 'rgb(15, 23, 42)',
    purple: 'rgb(17, 24, 39)',
    green: 'rgb(20, 26, 32)',
    amber: 'rgb(24, 24, 27)',
    rose: 'rgb(24, 24, 27)'
  },
  light: {
    blue: 'rgb(241, 245, 249)',
    purple: 'rgb(250, 245, 255)',
    green: 'rgb(240, 253, 244)',
    amber: 'rgb(254, 252, 232)',
    rose: 'rgb(255, 241, 242)'
  }
};

// Text colors by theme mode
const textColors = {
  dark: 'rgb(248, 250, 252)',
  light: 'rgb(15, 23, 42)'
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [color, setColor] = useState<ThemeColor>('blue');

  // Initialize from localStorage if available
  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode') as ThemeMode;
    const savedColor = localStorage.getItem('themeColor') as ThemeColor;
    
    if (savedMode) setMode(savedMode);
    if (savedColor) setColor(savedColor);
  }, []);

  // Save theme preferences to localStorage
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
    localStorage.setItem('themeColor', color);
    
    // Update document class for global CSS
    document.documentElement.classList.remove('theme-dark', 'theme-light');
    document.documentElement.classList.add(`theme-${mode}`);
    
    document.documentElement.classList.remove('color-blue', 'color-purple', 'color-green', 'color-amber', 'color-rose');
    document.documentElement.classList.add(`color-${color}`);
  }, [mode, color]);

  const toggleMode = () => {
    setMode(prevMode => prevMode === 'dark' ? 'light' : 'dark');
  };

  const setThemeColor = (newColor: ThemeColor) => {
    setColor(newColor);
  };

  // Helper functions to get theme-aware colors
  const getColor = (intensity: number) => {
    return themeColors[color][intensity];
  };

  const getBgColor = (opacity = 1) => {
    const baseColor = bgColors[mode][color];
    return opacity < 1 ? baseColor.replace('rgb', 'rgba').replace(')', `, ${opacity})`) : baseColor;
  };

  const getTextColor = () => {
    return textColors[mode];
  };

  const getAccentColor = (opacity = 1) => {
    const baseColor = themeColors[color][500];
    return opacity < 1 ? baseColor.replace('rgb', 'rgba').replace(')', `, ${opacity})`) : baseColor;
  };

  const getBorderColor = (opacity = 0.2) => {
    const baseColor = themeColors[color][500];
    return baseColor.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
  };

  const value = {
    mode,
    color,
    toggleMode,
    setThemeColor,
    getColor,
    getBgColor,
    getTextColor,
    getAccentColor,
    getBorderColor
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 