import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZE } from '@/constants';
import { useThemeColors } from '@/hooks/useTheme';
import { useNavigationStore } from '@/stores/navigationStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/i18n/strings';
import type { ScreenName } from '@/types';

interface Tab {
  screen: ScreenName;
  icon: string;
  iconActive: string;
  labelKey: 'home' | 'favorites' | 'aiAssistant' | 'settings';
}

const TABS: Tab[] = [
  { screen: 'Home', icon: 'home-outline', iconActive: 'home', labelKey: 'home' },
  { screen: 'Favorites', icon: 'heart-outline', iconActive: 'heart', labelKey: 'favorites' },
  { screen: 'AIAssistant', icon: 'sparkles-outline', iconActive: 'sparkles', labelKey: 'aiAssistant' },
  { screen: 'Settings', icon: 'settings-outline', iconActive: 'settings', labelKey: 'settings' },
];

export default function BottomTabBar() {
  const currentScreen = useNavigationStore(s => s.currentScreen);
  const navigate = useNavigationStore(s => s.navigate);
  const language = useSettingsStore(s => s.language);
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {TABS.map(tab => {
        const isActive = currentScreen === tab.screen;
        return (
          <Pressable
            key={tab.screen}
            style={styles.tab}
            onPress={() => navigate(tab.screen)}
          >
            <Ionicons
              name={(isActive ? tab.iconActive : tab.icon) as any}
              size={22}
              color={isActive ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.label, { color: colors.textMuted }, isActive && { color: colors.primary, fontWeight: '600' }]}>
              {t(tab.labelKey, language)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: FONT_SIZE.xs,
  },
});
