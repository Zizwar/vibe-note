import React from 'react';
import { View, ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES, RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants';
import { useThemeColors } from '@/hooks/useTheme';
import { usePromptStore } from '@/stores/promptStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/i18n/strings';
import type { PromptCategory } from '@/types';

export default function CategoryFilter() {
  const activeCategory = usePromptStore(s => s.activeCategory);
  const setActiveCategory = usePromptStore(s => s.setActiveCategory);
  const language = useSettingsStore(s => s.language);
  const customCategories = useSettingsStore(s => s.customCategories);
  const colors = useThemeColors();

  const allCategories = [...CATEGORIES, ...customCategories];

  const handlePress = (cat: PromptCategory | null) => {
    setActiveCategory(cat === activeCategory ? null : cat);
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <Pressable
          style={[
            styles.chip,
            { backgroundColor: colors.card },
            !activeCategory && { backgroundColor: colors.primary },
          ]}
          onPress={() => handlePress(null)}
        >
          <Text style={[
            styles.chipText,
            { color: colors.text },
            !activeCategory && styles.chipTextActive,
          ]}>
            {t('all', language)}
          </Text>
        </Pressable>
        {allCategories.map(cat => {
          const isActive = activeCategory === cat.value;
          return (
            <Pressable
              key={cat.value}
              style={[
                styles.chip,
                { backgroundColor: colors.card },
                isActive && { backgroundColor: cat.color },
              ]}
              onPress={() => handlePress(cat.value)}
            >
              <Ionicons
                name={cat.icon as any}
                size={15}
                color={isActive ? '#fff' : cat.color}
              />
              <Text style={[
                styles.chipText,
                { color: colors.text },
                isActive && styles.chipTextActive,
              ]}>
                {language === 'ar' ? cat.labelAr : cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  container: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    minHeight: 42,
    minWidth: 60,
    ...SHADOW.card,
  },
  chipText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
});
