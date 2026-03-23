import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONT_SIZE, SHADOW, CATEGORIES } from '@/constants';
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
  const catInfo = CATEGORIES.find(c => c.value === prompt.category);
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
      style={styles.card}
      onPress={() => navigate('PromptDetail', { promptId: prompt.id })}
    >
      {/* Top row */}
      <View style={[styles.topRow, isRTL && styles.rowRTL]}>
        <PlatformBadge platform={prompt.platform} />
        {prompt.isPinned && (
          <Ionicons name="pin" size={14} color={COLORS.primary} />
        )}
        {catInfo && (
          <View style={[styles.catBadge, { backgroundColor: catInfo.color + '18' }]}>
            <Text style={[styles.catText, { color: catInfo.color }]}>
              {catInfo.label}
            </Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={[styles.title, isRTL && styles.textRTL]} numberOfLines={1}>
        {prompt.title}
      </Text>

      {/* Content preview */}
      <Text style={[styles.preview, isRTL && styles.textRTL]} numberOfLines={2}>
        {prompt.content}
      </Text>

      {/* Variable chips */}
      {hasVars && (
        <View style={[styles.varRow, isRTL && styles.rowRTL]}>
          {prompt.content.match(/\{\{(\w+)/g)?.slice(0, 4).map((v, i) => (
            <View key={i} style={styles.varChip}>
              <Text style={styles.varText}>{v.replace('{{', '')}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Tags */}
      {prompt.tags.length > 0 && (
        <View style={[styles.tagRow, isRTL && styles.rowRTL]}>
          {prompt.tags.slice(0, 3).map((tag, i) => (
            <Text key={i} style={styles.tag}>#{tag}</Text>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={[styles.actions, isRTL && styles.rowRTL]}>
        <Pressable onPress={() => toggleFavorite(prompt.id)} hitSlop={8}>
          <Ionicons
            name={prompt.isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={prompt.isFavorite ? '#EF4444' : COLORS.textMuted}
          />
        </Pressable>

        {prompt.usageCount > 0 && (
          <Text style={styles.usageText}>{prompt.usageCount}x</Text>
        )}

        <View style={{ flex: 1 }} />

        {hasVars ? (
          <Pressable style={styles.actionBtn} onPress={handleUse}>
            <Ionicons name="play" size={14} color="#fff" />
            <Text style={styles.actionBtnText}>Use</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.actionBtn} onPress={handleCopy}>
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
    backgroundColor: COLORS.card,
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
    color: COLORS.text,
    marginBottom: 4,
  },
  textRTL: {
    textAlign: 'right',
  },
  preview: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  varText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: '500',
  },
  tagRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tag: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  usageText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
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
