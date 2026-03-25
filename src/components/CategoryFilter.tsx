import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES, RADIUS, SPACING, FONT_SIZE } from '@/constants';
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
              size={14}
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
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    minHeight: 36,
    minWidth: 60,
  },
  chipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
});
