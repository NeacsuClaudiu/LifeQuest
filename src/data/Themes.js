const THEMES = [
  {
    id: 'dark',
    name: 'Dark Realm',
    description: 'The classic dark theme',
    cost: 0,
    colors: {
      background: '#0D0D1A',
      cardBg: '#1A1A2E',
      cardBorder: '#2A2A3E',
      accent: '#FFD700',
      accentSecondary: '#A78BFA',
      textPrimary: '#FFFFFF',
      textSecondary: '#666666',
      textMuted: '#444444',
      buttonBg: '#FFD700',
      buttonText: '#0D0D1A',
      success: '#4CAF50',
      warning: '#FF9800',
      danger: '#F44336',
      info: '#2196F3',
      statCardBg: '#2A2A3E',
      tabBar: '#0D0D1A',
      tabBorder: '#1A1A2E',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean Depths',
    description: 'Calm blue underwater vibes',
    cost: 200,
    colors: {
      background: '#0A1628',
      cardBg: '#0F2440',
      cardBorder: '#1A3A5C',
      accent: '#4FC3F7',
      accentSecondary: '#81D4FA',
      textPrimary: '#E3F2FD',
      textSecondary: '#90A4AE',
      textMuted: '#546E7A',
      buttonBg: '#4FC3F7',
      buttonText: '#0A1628',
      success: '#4DB6AC',
      warning: '#FFB74D',
      danger: '#E57373',
      info: '#64B5F6',
      statCardBg: '#0F2440',
      tabBar: '#0A1628',
      tabBorder: '#0F2440',
    },
  },
  {
    id: 'forest',
    name: 'Enchanted Forest',
    description: 'Deep green nature theme',
    cost: 200,
    colors: {
      background: '#0A1A0A',
      cardBg: '#122A12',
      cardBorder: '#1E3F1E',
      accent: '#66BB6A',
      accentSecondary: '#A5D6A7',
      textPrimary: '#E8F5E9',
      textSecondary: '#81C784',
      textMuted: '#2E7D32',
      buttonBg: '#66BB6A',
      buttonText: '#0A1A0A',
      success: '#4CAF50',
      warning: '#FFA726',
      danger: '#EF5350',
      info: '#26A69A',
      statCardBg: '#122A12',
      tabBar: '#0A1A0A',
      tabBorder: '#122A12',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset Horizon',
    description: 'Warm evening glow',
    cost: 300,
    colors: {
      background: '#1A0A0A',
      cardBg: '#2E1414',
      cardBorder: '#4A2020',
      accent: '#FF7043',
      accentSecondary: '#FFAB91',
      textPrimary: '#FBE9E7',
      textSecondary: '#BF8A7A',
      textMuted: '#6D4C41',
      buttonBg: '#FF7043',
      buttonText: '#1A0A0A',
      success: '#FF8A65',
      warning: '#FFB74D',
      danger: '#EF5350',
      info: '#4DB6AC',
      statCardBg: '#2E1414',
      tabBar: '#1A0A0A',
      tabBorder: '#2E1414',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight Purple',
    description: 'Royal purple and indigo',
    cost: 300,
    colors: {
      background: '#0D0A1A',
      cardBg: '#1A1230',
      cardBorder: '#2A1E4A',
      accent: '#B388FF',
      accentSecondary: '#D1C4E9',
      textPrimary: '#EDE7F6',
      textSecondary: '#9E9E9E',
      textMuted: '#5D4E6A',
      buttonBg: '#B388FF',
      buttonText: '#0D0A1A',
      success: '#81C784',
      warning: '#FFD54F',
      danger: '#E57373',
      info: '#64B5F6',
      statCardBg: '#1A1230',
      tabBar: '#0D0A1A',
      tabBorder: '#1A1230',
    },
  },
  {
    id: 'neon',
    name: 'Neon Nights',
    description: 'Cyberpunk bright glow',
    cost: 500,
    colors: {
      background: '#0A0A1A',
      cardBg: '#12122A',
      cardBorder: '#2A2A5A',
      accent: '#00E5FF',
      accentSecondary: '#FF4081',
      textPrimary: '#E0F7FA',
      textSecondary: '#80CBC4',
      textMuted: '#4A4A7A',
      buttonBg: '#00E5FF',
      buttonText: '#0A0A1A',
      success: '#69F0AE',
      warning: '#FFD740',
      danger: '#FF5252',
      info: '#448AFF',
      statCardBg: '#12122A',
      tabBar: '#0A0A1A',
      tabBorder: '#12122A',
    },
  },
  {
    id: 'rose',
    name: 'Rose Garden',
    description: 'Soft pink elegance',
    cost: 400,
    colors: {
      background: '#1A0D14',
      cardBg: '#2E1422',
      cardBorder: '#4A1E34',
      accent: '#F48FB1',
      accentSecondary: '#F8BBD0',
      textPrimary: '#FCE4EC',
      textSecondary: '#B88A9E',
      textMuted: '#6D4C5A',
      buttonBg: '#F48FB1',
      buttonText: '#1A0D14',
      success: '#FF8A80',
      warning: '#FFD54F',
      danger: '#FF5252',
      info: '#80DEEA',
      statCardBg: '#2E1422',
      tabBar: '#1A0D14',
      tabBorder: '#2E1422',
    },
  },
  {
    id: 'mono',
    name: 'Monochrome',
    description: 'Clean grayscale',
    cost: 500,
    colors: {
      background: '#0D0D0D',
      cardBg: '#1A1A1A',
      cardBorder: '#2A2A2A',
      accent: '#E0E0E0',
      accentSecondary: '#9E9E9E',
      textPrimary: '#F5F5F5',
      textSecondary: '#757575',
      textMuted: '#424242',
      buttonBg: '#E0E0E0',
      buttonText: '#0D0D0D',
      success: '#BDBDBD',
      warning: '#BDBDBD',
      danger: '#BDBDBD',
      info: '#BDBDBD',
      statCardBg: '#1A1A1A',
      tabBar: '#0D0D0D',
      tabBorder: '#1A1A1A',
    },
  },
];

function getTheme(themeId) {
  return THEMES.find(t => t.id === themeId) || THEMES[0];
}

function getThemeColors(themeId) {
  const theme = getTheme(themeId);
  return theme.colors;
}

function isThemePurchased(character, themeId) {
  if (themeId === 'dark') return true;
  return (character.purchasedThemes || []).includes(themeId);
}

function canAffordTheme(character, theme) {
  return (character.gold || 0) >= theme.cost;
}

function purchaseTheme(character, themeId) {
  const theme = getTheme(themeId);
  if (!theme) return character;
  if (theme.cost === 0) return character;
  if (isThemePurchased(character, themeId)) return character;
  if (!canAffordTheme(character, theme)) return character;

  return {
    ...character,
    gold: (character.gold || 0) - theme.cost,
    purchasedThemes: [...(character.purchasedThemes || []), themeId],
    selectedTheme: themeId,
  };
}

export {
  THEMES,
  getTheme,
  getThemeColors,
  isThemePurchased,
  canAffordTheme,
  purchaseTheme,
};
