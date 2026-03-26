export type ColorTheme = 'light' | 'ocean' | 'forest' | 'sunset' | 'dark';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  danger: string;
  success: string;
  warning: string;
  white: string;
  black: string;
  overlay: string;
}

export const THEME_PRESETS: Record<ColorTheme, ThemeColors> = {
  light: {
    primary: '#336699',
    primaryLight: '#4a80b4',
    primaryDark: '#264d73',
    background: '#f5f5f5',
    card: '#ffffff',
    text: '#1a1a2e',
    textSecondary: '#555555',
    textMuted: '#888888',
    border: '#e0e0e0',
    danger: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
    white: '#ffffff',
    black: '#000000',
    overlay: 'rgba(0,0,0,0.5)',
  },
  ocean: {
    primary: '#1976D2',
    primaryLight: '#42A5F5',
    primaryDark: '#0D47A1',
    background: '#EFF6FF',
    card: '#ffffff',
    text: '#1a1a2e',
    textSecondary: '#4a5568',
    textMuted: '#7a8a9e',
    border: '#d0e3f7',
    danger: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
    white: '#ffffff',
    black: '#000000',
    overlay: 'rgba(0,0,0,0.5)',
  },
  forest: {
    primary: '#2E7D32',
    primaryLight: '#4CAF50',
    primaryDark: '#1B5E20',
    background: '#F1F8E9',
    card: '#ffffff',
    text: '#1a1a2e',
    textSecondary: '#4a5a48',
    textMuted: '#7a8a78',
    border: '#d0e8c8',
    danger: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
    white: '#ffffff',
    black: '#000000',
    overlay: 'rgba(0,0,0,0.5)',
  },
  sunset: {
    primary: '#E65100',
    primaryLight: '#FF8A65',
    primaryDark: '#BF360C',
    background: '#FFF8F0',
    card: '#ffffff',
    text: '#1a1a2e',
    textSecondary: '#5a4a40',
    textMuted: '#8a7a70',
    border: '#f0ddd0',
    danger: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
    white: '#ffffff',
    black: '#000000',
    overlay: 'rgba(0,0,0,0.5)',
  },
  dark: {
    primary: '#4a88c2',
    primaryLight: '#5a9ad5',
    primaryDark: '#336699',
    background: '#121212',
    card: '#1e1e1e',
    text: '#e8e8e8',
    textSecondary: '#a0a0a0',
    textMuted: '#666666',
    border: '#2c2c2c',
    danger: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
    white: '#ffffff',
    black: '#000000',
    overlay: 'rgba(0,0,0,0.7)',
  },
};

// Backward compatibility
export const COLORS = THEME_PRESETS.light;
export const DARK_COLORS = THEME_PRESETS.dark;

export const THEME_META: Record<ColorTheme, { label: string; labelAr: string; labelFr: string; color: string; bg: string }> = {
  light: { label: 'Classic', labelAr: 'كلاسيكي', labelFr: 'Classique', color: '#336699', bg: '#f5f5f5' },
  ocean: { label: 'Ocean', labelAr: 'محيط', labelFr: 'Océan', color: '#1976D2', bg: '#EFF6FF' },
  forest: { label: 'Forest', labelAr: 'غابة', labelFr: 'Forêt', color: '#2E7D32', bg: '#F1F8E9' },
  sunset: { label: 'Sunset', labelAr: 'غروب', labelFr: 'Coucher', color: '#E65100', bg: '#FFF8F0' },
  dark: { label: 'Dark', labelAr: 'داكن', labelFr: 'Sombre', color: '#4a88c2', bg: '#121212' },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
};

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
};

export const SHADOW = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};
