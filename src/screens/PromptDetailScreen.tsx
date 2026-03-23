import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONT_SIZE, SHADOW, CATEGORIES } from '@/constants';
import PlatformBadge from '@/components/PlatformBadge';
import VariableFiller from '@/components/VariableFiller';
import ConfirmDialog from '@/components/ConfirmDialog';
import { hasVariables } from '@/engine/variableParser';
import { copyToClipboard } from '@/utils/clipboard';
import { usePromptStore } from '@/stores/promptStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/i18n/strings';
import type { ProomyNote } from '@/types';

interface Props {
  promptId?: string;
}

export default function PromptDetailScreen({ promptId }: Props) {
  const getPromptById = usePromptStore(s => s.getPromptById);
  const toggleFavorite = usePromptStore(s => s.toggleFavorite);
  const deletePrompt = usePromptStore(s => s.deletePrompt);
  const incrementUsage = usePromptStore(s => s.incrementUsage);
  const navigate = useNavigationStore(s => s.navigate);
  const goBack = useNavigationStore(s => s.goBack);
  const language = useSettingsStore(s => s.language);
  const isRTL = useSettingsStore(s => s.isRTL);

  const [prompt, setPrompt] = useState<ProomyNote | null>(null);
  const [showFiller, setShowFiller] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (promptId) {
      setPrompt(getPromptById(promptId));
    }
  }, [promptId]);

  if (!prompt) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Prompt not found</Text>
      </View>
    );
  }

  const catInfo = CATEGORIES.find(c => c.value === prompt.category);
  const hasVars = hasVariables(prompt.content);

  const handleCopy = async () => {
    await copyToClipboard(prompt.content);
    incrementUsage(prompt.id);
  };

  const handleDelete = () => {
    deletePrompt(prompt.id);
    goBack();
  };

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString();

  // Highlight {{variables}} in content
  const renderContent = () => {
    const parts = prompt.content.split(/(\{\{[^}]+\}\})/g);
    return (
      <Text style={[styles.content, isRTL && styles.textRTL]}>
        {parts.map((part, i) =>
          part.match(/^\{\{/) ? (
            <Text key={i} style={styles.variable}>{part}</Text>
          ) : (
            <Text key={i}>{part}</Text>
          )
        )}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <Pressable onPress={goBack} hitSlop={8}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={COLORS.text} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => navigate('EditPrompt', { promptId: prompt.id })}
          hitSlop={8}
          style={styles.headerBtn}
        >
          <Ionicons name="create-outline" size={22} color={COLORS.primary} />
        </Pressable>
        <Pressable onPress={() => setShowDelete(true)} hitSlop={8} style={styles.headerBtn}>
          <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
        </Pressable>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Badges */}
        <View style={[styles.badgeRow, isRTL && styles.rowRTL]}>
          <PlatformBadge platform={prompt.platform} size="md" />
          {catInfo && (
            <View style={[styles.catBadge, { backgroundColor: catInfo.color + '18' }]}>
              <Ionicons name={catInfo.icon as any} size={14} color={catInfo.color} />
              <Text style={[styles.catText, { color: catInfo.color }]}>
                {language === 'ar' ? catInfo.labelAr : catInfo.label}
              </Text>
            </View>
          )}
          {prompt.isPinned && (
            <View style={styles.pinBadge}>
              <Ionicons name="pin" size={12} color={COLORS.primary} />
              <Text style={styles.pinText}>{t('pinned', language)}</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={[styles.title, isRTL && styles.textRTL]}>{prompt.title}</Text>

        {/* Description */}
        {prompt.description && (
          <Text style={[styles.description, isRTL && styles.textRTL]}>
            {prompt.description}
          </Text>
        )}

        {/* Content */}
        <View style={styles.contentCard}>
          {renderContent()}
        </View>

        {/* Tags */}
        {prompt.tags.length > 0 && (
          <View style={[styles.tagRow, isRTL && styles.rowRTL]}>
            {prompt.tags.map((tag, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t('usageCount', language)}</Text>
            <Text style={styles.statValue}>{prompt.usageCount} {t('times', language)}</Text>
          </View>
          {prompt.lastUsedAt && (
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>{t('lastUsed', language)}</Text>
              <Text style={styles.statValue}>{formatDate(prompt.lastUsedAt)}</Text>
            </View>
          )}
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t('created', language)}</Text>
            <Text style={styles.statValue}>{formatDate(prompt.createdAt)}</Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.bottomActions}>
        <Pressable
          style={styles.favBtn}
          onPress={() => {
            toggleFavorite(prompt.id);
            setPrompt(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
          }}
        >
          <Ionicons
            name={prompt.isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={prompt.isFavorite ? '#EF4444' : COLORS.textMuted}
          />
        </Pressable>

        {hasVars ? (
          <Pressable style={styles.mainAction} onPress={() => setShowFiller(true)}>
            <Ionicons name="play" size={18} color="#fff" />
            <Text style={styles.mainActionText}>{t('usePrompt', language)}</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.mainAction} onPress={handleCopy}>
            <Ionicons name="copy" size={18} color="#fff" />
            <Text style={styles.mainActionText}>{t('copy', language)}</Text>
          </Pressable>
        )}
      </View>

      <VariableFiller
        prompt={prompt}
        visible={showFiller}
        onClose={() => setShowFiller(false)}
      />

      <ConfirmDialog
        visible={showDelete}
        title={t('deleteTitle', language)}
        message={t('deleteConfirm', language)}
        confirmText={t('delete', language)}
        cancelText={t('cancel', language)}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  notFound: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  headerBtn: {
    marginLeft: SPACING.lg,
  },
  body: {
    flex: 1,
    padding: SPACING.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  catText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  pinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary + '15',
  },
  pinText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: '500',
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  textRTL: {
    textAlign: 'right',
  },
  description: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  contentCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOW.card,
  },
  content: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    lineHeight: 24,
  },
  variable: {
    color: COLORS.primary,
    fontWeight: '700',
    backgroundColor: COLORS.primary + '12',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  tag: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  tagText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  statsCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOW.card,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  statLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  statValue: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  favBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  mainActionText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: '#fff',
  },
});
