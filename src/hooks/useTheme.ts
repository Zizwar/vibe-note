import { COLORS, DARK_COLORS } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';

export function useThemeColors() {
  const isDarkMode = useSettingsStore(s => s.isDarkMode);
  return isDarkMode ? DARK_COLORS : COLORS;
}
