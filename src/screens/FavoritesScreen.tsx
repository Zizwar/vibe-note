import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZE } from '@/constants';
import { useThemeColors } from '@/hooks/useTheme';
import PromptCard from '@/components/PromptCard';
import VariableFiller from '@/components/VariableFiller';
import { usePromptStore } from '@/stores/promptStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/i18n/strings';
import type { ProomyNote } from '@/types';

export default function FavoritesScreen() {
  const prompts = usePromptStore(s => s.prompts);
  const loadPrompts = usePromptStore(s => s.loadPrompts);
  const language = useSettingsStore(s => s.language);
  const [fillerPrompt, setFillerPrompt] = useState<ProomyNote | null>(null);
  const colors = useThemeColors();

  useEffect(() => {
    loadPrompts();
  }, []);

  const favorites = prompts.filter(p => p.isFavorite);

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name="heart-outline" size={64} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{t('noFavorites', language)}</Text>
      <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>{t('noFavoritesDesc', language)}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={favorites}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PromptCard prompt={item} onUse={setFillerPrompt} />
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={favorites.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
      />
      <VariableFiller
        prompt={fillerPrompt}
        visible={fillerPrompt !== null}
        onClose={() => setFillerPrompt(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: SPACING.md,
  },
  list: {
    paddingBottom: 40,
  },
  emptyList: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    marginTop: SPACING.lg,
  },
  emptyDesc: {
    fontSize: FONT_SIZE.md,
    marginTop: SPACING.xs,
  },
});
