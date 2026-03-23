import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES, COLORS, RADIUS, SPACING, FONT_SIZE } from '@/constants';
import { usePromptStore } from '@/stores/promptStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/i18n/strings';
import type { PromptCategory } from '@/types';

export default function CategoryFilter() {
  const activeCategory = usePromptStore(s => s.activeCategory);
  const setActiveCategory = usePromptStore(s => s.setActiveCategory);
  const language = useSettingsStore(s => s.language);

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
        style={[styles.chip, !activeCategory && styles.chipActive]}
        onPress={() => handlePress(null)}
      >
        <Text style={[styles.chipText, !activeCategory && styles.chipTextActive]}>
          {t('all', language)}
        </Text>
      </Pressable>
      {CATEGORIES.map(cat => {
        const isActive = activeCategory === cat.value;
        return (
          <Pressable
            key={cat.value}
            style={[
              styles.chip,
              isActive && { backgroundColor: cat.color },
            ]}
            onPress={() => handlePress(cat.value)}
          >
            <Ionicons
              name={cat.icon as any}
              size={14}
              color={isActive ? '#fff' : cat.color}
            />
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
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
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
});
