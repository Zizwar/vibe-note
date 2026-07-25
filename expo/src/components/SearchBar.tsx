import React, { useCallback, useRef } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, FONT_SIZE } from '@/constants';
import { useThemeColors } from '@/hooks/useTheme';
import { usePromptStore } from '@/stores/promptStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/i18n/strings';

export default function SearchBar() {
  const searchQuery = usePromptStore(s => s.searchQuery);
  const setSearchQuery = usePromptStore(s => s.setSearchQuery);
  const language = useSettingsStore(s => s.language);
  const isRTL = useSettingsStore(s => s.isRTL);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const colors = useThemeColors();

  const handleChange = useCallback((text: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSearchQuery(text);
    }, 300);
  }, [setSearchQuery]);

  return (
    <View style={[styles.container, { backgroundColor: colors.card }, isRTL && styles.containerRTL]}>
      <Ionicons name="search" size={18} color={colors.textSecondary} />
      <TextInput
        style={[styles.input, { color: colors.text }, isRTL && styles.inputRTL]}
        placeholder={t('search', language)}
        placeholderTextColor={colors.textMuted}
        defaultValue={searchQuery}
        onChangeText={handleChange}
        returnKeyType="search"
      />
      {searchQuery.length > 0 && (
        <Pressable onPress={() => setSearchQuery('')}>
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  containerRTL: {
    flexDirection: 'row-reverse',
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    padding: 0,
  },
  inputRTL: {
    textAlign: 'right',
  },
});
