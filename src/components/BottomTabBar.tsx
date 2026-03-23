import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE } from '@/constants';
import { useNavigationStore } from '@/stores/navigationStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/i18n/strings';
import type { ScreenName } from '@/types';

interface Tab {
  screen: ScreenName;
  icon: string;
  iconActive: string;
  labelKey: 'home' | 'favorites' | 'settings';
}

const TABS: Tab[] = [
  { screen: 'Home', icon: 'home-outline', iconActive: 'home', labelKey: 'home' },
  { screen: 'Favorites', icon: 'heart-outline', iconActive: 'heart', labelKey: 'favorites' },
  { screen: 'Settings', icon: 'settings-outline', iconActive: 'settings', labelKey: 'settings' },
];

export default function BottomTabBar() {
  const currentScreen = useNavigationStore(s => s.currentScreen);
  const navigate = useNavigationStore(s => s.navigate);
  const language = useSettingsStore(s => s.language);

  return (
    <View style={styles.container}>
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
              color={isActive ? COLORS.primary : COLORS.textMuted}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>
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
    backgroundColor: COLORS.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
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
    color: COLORS.textMuted,
  },
  labelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
