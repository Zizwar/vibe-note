import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE } from '@/constants';
import SearchBar from '@/components/SearchBar';
import CategoryFilter from '@/components/CategoryFilter';
import PromptCard from '@/components/PromptCard';
import FAB from '@/components/FAB';
import VariableFiller from '@/components/VariableFiller';
import { usePromptStore } from '@/stores/promptStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/i18n/strings';
import type { ProomyNote } from '@/types';

export default function HomeScreen() {
  const prompts = usePromptStore(s => s.prompts);
  const isLoading = usePromptStore(s => s.isLoading);
  const loadPrompts = usePromptStore(s => s.loadPrompts);
  const language = useSettingsStore(s => s.language);
  const [fillerPrompt, setFillerPrompt] = useState<ProomyNote | null>(null);

  useEffect(() => {
    loadPrompts();
  }, []);

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name="document-text-outline" size={64} color={COLORS.textMuted} />
      <Text style={styles.emptyTitle}>{t('noPrompts', language)}</Text>
      <Text style={styles.emptyDesc}>{t('noPromptsDesc', language)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <SearchBar />
      <CategoryFilter />
      <FlatList
        data={prompts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PromptCard prompt={item} onUse={setFillerPrompt} />
        )}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        contentContainerStyle={prompts.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
      />
      <FAB />
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
    backgroundColor: COLORS.background,
  },
  list: {
    paddingBottom: 100,
  },
  emptyList: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
  },
  emptyDesc: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
});
