import { THEME_PRESETS } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';

export function useThemeColors() {
  const colorTheme = useSettingsStore(s => s.colorTheme);
  return THEME_PRESETS[colorTheme] || THEME_PRESETS.light;
}
