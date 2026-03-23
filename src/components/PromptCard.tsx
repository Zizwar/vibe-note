import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, FONT_SIZE, SHADOW, CATEGORIES } from '@/constants';
import { useThemeColors } from '@/hooks/useTheme';
import PlatformBadge from './PlatformBadge';
import { hasVariables } from '@/engine/variableParser';
import { copyToClipboard } from '@/utils/clipboard';
import { usePromptStore } from '@/stores/promptStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ProomyNote } from '@/types';

interface Props {
  prompt: ProomyNote;
  onUse: (prompt: ProomyNote) => void;
}

export default function PromptCard({ prompt, onUse }: Props) {
  const toggleFavorite = usePromptStore(s => s.toggleFavorite);
  const incrementUsage = usePromptStore(s => s.incrementUsage);
  const navigate = useNavigationStore(s => s.navigate);
  const isRTL = useSettingsStore(s => s.isRTL);
  const customCategories = useSettingsStore(s => s.customCategories);
  const colors = useThemeColors();
  const allCategories = [...CATEGORIES, ...customCategories];
  const catInfo = allCategories.find(c => c.value === prompt.category);
  const hasVars = hasVariables(prompt.content);

  const handleCopy = async () => {
    await copyToClipboard(prompt.content);
    incrementUsage(prompt.id);
  };

  const handleUse = () => {
    onUse(prompt);
  };

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={() => navigate('PromptDetail', { promptId: prompt.id })}
    >
      <View style={[styles.topRow, isRTL && styles.rowRTL]}>
        <PlatformBadge platform={prompt.platform} />
        {prompt.isPinned && (
          <Ionicons name="pin" size={14} color={colors.primary} />
        )}
        {catInfo && (
          <View style={[styles.catBadge, { backgroundColor: catInfo.color + '18' }]}>
            <Text style={[styles.catText, { color: catInfo.color }]}>
              {catInfo.label}
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.title, { color: colors.text }, isRTL && styles.textRTL]} numberOfLines={1}>
        {prompt.title}
      </Text>

      <Text style={[styles.preview, { color: colors.textSecondary }, isRTL && styles.textRTL]} numberOfLines={2}>
        {prompt.content}
      </Text>

      {hasVars && (
        <View style={[styles.varRow, isRTL && styles.rowRTL]}>
          {prompt.content.match(/\{\{(\w+)/g)?.slice(0, 4).map((v, i) => (
            <View key={i} style={[styles.varChip, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.varText, { color: colors.primary }]}>{v.replace('{{', '')}</Text>
            </View>
          ))}
        </View>
      )}

      {prompt.tags.length > 0 && (
        <View style={[styles.tagRow, isRTL && styles.rowRTL]}>
          {prompt.tags.slice(0, 3).map((tag, i) => (
            <Text key={i} style={[styles.tag, { color: colors.textSecondary }]}>#{tag}</Text>
          ))}
        </View>
      )}

      <View style={[styles.actions, { borderTopColor: colors.border }, isRTL && styles.rowRTL]}>
        <Pressable onPress={() => toggleFavorite(prompt.id)} hitSlop={8}>
          <Ionicons
            name={prompt.isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={prompt.isFavorite ? '#EF4444' : colors.textMuted}
          />
        </Pressable>

        {prompt.usageCount > 0 && (
          <Text style={[styles.usageText, { color: colors.textMuted }]}>{prompt.usageCount}x</Text>
        )}

        <View style={{ flex: 1 }} />

        {hasVars ? (
          <Pressable style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={handleUse}>
            <Ionicons name="play" size={14} color="#fff" />
            <Text style={styles.actionBtnText}>Use</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={handleCopy}>
            <Ionicons name="copy" size={14} color="#fff" />
            <Text style={styles.actionBtnText}>Copy</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOW.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  catBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  catText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: 4,
  },
  textRTL: {
    textAlign: 'right',
  },
  preview: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  varRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: SPACING.sm,
  },
  varChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  varText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  tagRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tag: {
    fontSize: FONT_SIZE.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: SPACING.sm,
  },
  usageText: {
    fontSize: FONT_SIZE.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  actionBtnText: {
    fontSize: FONT_SIZE.sm,
    color: '#fff',
    fontWeight: '600',
  },
});
