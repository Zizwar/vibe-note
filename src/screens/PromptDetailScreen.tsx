import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, FONT_SIZE, SHADOW, CATEGORIES } from '@/constants';
import { useThemeColors } from '@/hooks/useTheme';
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
  const customCategories = useSettingsStore(s => s.customCategories);
  const colors = useThemeColors();

  const allCategories = [...CATEGORIES, ...customCategories];

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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.textSecondary }]}>Prompt not found</Text>
      </View>
    );
  }

  const catInfo = allCategories.find(c => c.value === prompt.category);
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

  const renderContent = () => {
    const parts = prompt.content.split(/(\{\{[^}]+\}\})/g);
    return (
      <Text style={[styles.content, { color: colors.text }, isRTL && styles.textRTL]}>
        {parts.map((part, i) =>
          part.match(/^\{\{/) ? (
            <Text key={i} style={[styles.variable, { color: colors.primary, backgroundColor: colors.primary + '12' }]}>{part}</Text>
          ) : (
            <Text key={i}>{part}</Text>
          )
        )}
      </Text>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }, isRTL && styles.headerRTL]}>
        <Pressable onPress={goBack} hitSlop={8}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => navigate('EditPrompt', { promptId: prompt.id })}
          hitSlop={8}
          style={styles.headerBtn}
        >
          <Ionicons name="create-outline" size={22} color={colors.primary} />
        </Pressable>
        <Pressable onPress={() => setShowDelete(true)} hitSlop={8} style={styles.headerBtn}>
          <Ionicons name="trash-outline" size={22} color={colors.danger} />
        </Pressable>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
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
            <View style={[styles.pinBadge, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="pin" size={12} color={colors.primary} />
              <Text style={[styles.pinText, { color: colors.primary }]}>{t('pinned', language)}</Text>
            </View>
          )}
        </View>

        <Text style={[styles.title, { color: colors.text }, isRTL && styles.textRTL]}>{prompt.title}</Text>

        {prompt.description && (
          <Text style={[styles.description, { color: colors.textSecondary }, isRTL && styles.textRTL]}>
            {prompt.description}
          </Text>
        )}

        <View style={[styles.contentCard, { backgroundColor: colors.card }]}>
          {renderContent()}
        </View>

        {prompt.tags.length > 0 && (
          <View style={[styles.tagRow, isRTL && styles.rowRTL]}>
            {prompt.tags.map((tag, i) => (
              <View key={i} style={[styles.tag, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <View style={[styles.statRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('usageCount', language)}</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{prompt.usageCount} {t('times', language)}</Text>
          </View>
          {prompt.lastUsedAt && (
            <View style={[styles.statRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('lastUsed', language)}</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{formatDate(prompt.lastUsedAt)}</Text>
            </View>
          )}
          <View style={[styles.statRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('created', language)}</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{formatDate(prompt.createdAt)}</Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={[styles.bottomActions, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <Pressable
          style={[styles.favBtn, { backgroundColor: colors.background }]}
          onPress={() => {
            toggleFavorite(prompt.id);
            setPrompt(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
          }}
        >
          <Ionicons
            name={prompt.isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={prompt.isFavorite ? '#EF4444' : colors.textMuted}
          />
        </Pressable>

        {hasVars ? (
          <Pressable style={[styles.mainAction, { backgroundColor: colors.primary }]} onPress={() => setShowFiller(true)}>
            <Ionicons name="play" size={18} color="#fff" />
            <Text style={styles.mainActionText}>{t('usePrompt', language)}</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.mainAction, { backgroundColor: colors.primary }]} onPress={handleCopy}>
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
  },
  notFound: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: FONT_SIZE.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  },
  pinText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  textRTL: {
    textAlign: 'right',
  },
  description: {
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  contentCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOW.card,
  },
  content: {
    fontSize: FONT_SIZE.md,
    lineHeight: 24,
  },
  variable: {
    fontWeight: '700',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  tag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  tagText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  statsCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOW.card,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statLabel: {
    fontSize: FONT_SIZE.md,
  },
  statValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  favBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  mainActionText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: '#fff',
  },
});
