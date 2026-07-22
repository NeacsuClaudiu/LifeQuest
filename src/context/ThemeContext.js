import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getThemeColors, getTheme } from '../data/Themes';
import { KEYS } from '../utils/Storage';

const ThemeContext = createContext({
  colors: getThemeColors('dark'),
  themeId: 'dark',
  loaded: false,
  refreshTheme: () => {},
  setThemeId: (id) => {},
  currentTheme: getTheme('dark'),
});

export function ThemeProvider({ children }) {
  const [themeId, setThemeIdState] = useState('dark');
  const [loaded, setLoaded] = useState(false);

  const loadTheme = useCallback(async () => {
    try {
      const json = await AsyncStorage.getItem(KEYS.CHARACTER_DATA);
      if (json) {
        const character = JSON.parse(json);
        if (character.selectedTheme) {
          setThemeIdState(character.selectedTheme);
        }
      }
    } catch (e) {
      // ignore
    }
    setLoaded(true);
  }, []);

  useEffect(() => { loadTheme(); }, [loadTheme]);

  const setThemeId = useCallback((id) => {
    setThemeIdState(id);
  }, []);

  const refreshTheme = useCallback(() => {
    loadTheme();
  }, [loadTheme]);

  const colors = getThemeColors(themeId);
  const currentTheme = getTheme(themeId);

  return (
    <ThemeContext.Provider value={{ colors, themeId, loaded, refreshTheme, setThemeId, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;
