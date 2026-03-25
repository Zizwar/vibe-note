import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, FlatList, Text, Pressable, TextInput, StyleSheet, SectionList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZE, RADIUS, SHADOW, CATEGORIES } from '@/constants';
import { useThemeColors } from '@/hooks/useTheme';
import CategoryFilter from '@/components/CategoryFilter';
import PromptCard from '@/components/PromptCard';
import FAB from '@/components/FAB';
import VariableFiller from '@/components/VariableFiller';
import { usePromptStore } from '@/stores/promptStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/i18n/strings';
import { estimateTokens, formatTokenCount } from '@/utils/tokenCounter';
import type { ProomyNote } from '@/types';

type ViewMode = 'list' | 'grid' | 'category';
type SortMode = 'newest' | 'oldest' | 'mostUsed' | 'alphabetical';

export default function HomeScreen() {
  const prompts = usePromptStore(s => s.prompts);
  const isLoading = usePromptStore(s => s.isLoading);
  const loadPrompts = usePromptStore(s => s.loadPrompts);
  const setSearchQuery = usePromptStore(s => s.setSearchQuery);
  const language = useSettingsStore(s => s.language);
  const isRTL = useSettingsStore(s => s.isRTL);
  const customCategories = useSettingsStore(s => s.customCategories);
  const [fillerPrompt, setFillerPrompt] = useState<ProomyNote | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [showFilter, setShowFilter] = useState(false);
  const [searchText, setSearchText] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const colors = useThemeColors();

  useEffect(() => { loadPrompts(); }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSearchQuery(text);
    }, 500);
  }, [setSearchQuery]);

  const sortedPrompts = [...prompts].sort((a, b) => {
    switch (sortMode) {
      case 'oldest': return a.createdAt - b.createdAt;
      case 'mostUsed': return b.usageCount - a.usageCount;
      case 'alphabetical': return a.title.localeCompare(b.title);
      default: return b.updatedAt - a.updatedAt;
    }
  });

  const allCategories = [...CATEGORIES, ...customCategories];

  const getSections = () => {
    const map = new Map<string, ProomyNote[]>();
    for (const p of sortedPrompts) {
      const cat = p.category;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return Array.from(map.entries()).map(([key, data]) => {
      const catInfo = allCategories.find(c => c.value === key);
      return { title: catInfo ? (language === 'ar' ? catInfo.labelAr : catInfo.label) : key, data };
    });
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name="document-text-outline" size={64} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{t('noPrompts', language)}</Text>
      <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>{t('noPromptsDesc', language)}</Text>
    </View>
  );

  const renderGridItem = ({ item }: { item: ProomyNote }) => (
    <PromptCard prompt={item} onUse={setFillerPrompt} compact />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchRow, { backgroundColor: colors.card }, isRTL && { flexDirection: 'row-reverse' }]}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }, isRTL && { textAlign: 'right' }]}
          placeholder={t('search', language)}
          placeholderTextColor={colors.textMuted}
          value={searchText}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
        {searchText.length > 0 && (
          <Pressable onPress={() => { setSearchText(''); setSearchQuery(''); }}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Toolbar: View modes + Sort + Filter */}
      <View style={[styles.toolbar, isRTL && { flexDirection: 'row-reverse' }]}>
        <View style={[styles.viewModes, isRTL && { flexDirection: 'row-reverse' }]}>
          {(['list', 'grid', 'category'] as const).map(mode => (
            <Pressable
              key={mode}
              style={[styles.viewModeBtn, viewMode === mode && { backgroundColor: colors.primary + '20' }]}
              onPress={() => setViewMode(mode)}
            >
              <Ionicons
                name={mode === 'list' ? 'list' : mode === 'grid' ? 'grid' : 'layers'}
                size={16}
                color={viewMode === mode ? colors.primary : colors.textMuted}
              />
            </Pressable>
          ))}
        </View>

        <View style={[styles.toolbarRight, isRTL && { flexDirection: 'row-reverse' }]}>
          <Pressable
            style={[styles.sortBtn, { borderColor: colors.border }]}
            onPress={() => {
              const modes: SortMode[] = ['newest', 'oldest', 'mostUsed', 'alphabetical'];
              const idx = modes.indexOf(sortMode);
              setSortMode(modes[(idx + 1) % modes.length]);
            }}
          >
            <Ionicons name="swap-vertical" size={14} color={colors.textSecondary} />
            <Text style={[styles.sortText, { color: colors.textSecondary }]}>{t(sortMode, language)}</Text>
          </Pressable>

          <Pressable
            style={[styles.filterBtn, showFilter && { backgroundColor: colors.primary + '20' }]}
            onPress={() => setShowFilter(!showFilter)}
          >
            <Ionicons name="funnel" size={14} color={showFilter ? colors.primary : colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {showFilter && <CategoryFilter />}

      {/* Prompt count + token estimate */}
      {sortedPrompts.length > 0 && (
        <View style={[styles.statsBar, isRTL && { flexDirection: 'row-reverse' }]}>
          <Text style={[styles.statsText, { color: colors.textMuted }]}>
            {sortedPrompts.length} {language === 'ar' ? 'برومبت' : 'prompts'}
          </Text>
        </View>
      )}

      {/* Content based on view mode */}
      {viewMode === 'category' ? (
        <SectionList
          sections={getSections()}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <PromptCard prompt={item} onUse={setFillerPrompt} />}
          renderSectionHeader={({ section: { title } }) => (
            <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>{title}</Text>
            </View>
          )}
          ListEmptyComponent={!isLoading ? renderEmpty : null}
          contentContainerStyle={sortedPrompts.length === 0 ? styles.emptyList : styles.list}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled
        />
      ) : (
        <FlatList
          key={viewMode}
          data={sortedPrompts}
          keyExtractor={item => item.id}
          renderItem={viewMode === 'grid' ? renderGridItem : ({ item }) => <PromptCard prompt={item} onUse={setFillerPrompt} />}
          numColumns={viewMode === 'grid' ? 2 : 1}
          ListEmptyComponent={!isLoading ? renderEmpty : null}
          contentContainerStyle={sortedPrompts.length === 0 ? styles.emptyList : styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

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
  container: { flex: 1 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, gap: SPACING.sm,
  },
  searchInput: { flex: 1, fontSize: FONT_SIZE.md, padding: 0 },
  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm,
  },
  viewModes: { flexDirection: 'row', gap: 2 },
  viewModeBtn: {
    padding: SPACING.sm, borderRadius: RADIUS.sm,
  },
  toolbarRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  sortBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm, borderWidth: 1,
  },
  sortText: { fontSize: FONT_SIZE.xs },
  filterBtn: { padding: SPACING.sm, borderRadius: RADIUS.sm },
  statsBar: {
    flexDirection: 'row', paddingHorizontal: SPACING.lg, marginBottom: SPACING.xs,
  },
  statsText: { fontSize: FONT_SIZE.xs },
  sectionHeader: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
  },
  sectionTitle: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  list: { paddingBottom: 100 },
  emptyList: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 100 },
  emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: '600', marginTop: SPACING.lg },
  emptyDesc: { fontSize: FONT_SIZE.md, marginTop: SPACING.xs },
});
