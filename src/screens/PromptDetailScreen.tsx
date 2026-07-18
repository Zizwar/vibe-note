import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, FONT_SIZE, SHADOW, CATEGORIES } from '@/constants';
import { useThemeColors } from '@/hooks/useTheme';
import PlatformBadge from '@/components/PlatformBadge';
import VariableFiller from '@/components/VariableFiller';
import ConfirmDialog from '@/components/ConfirmDialog';
import { hasVariables } from '@/engine/variableParser';
import { isAIConfigured } from '@/engine/aiService';
import { copyToClipboard } from '@/utils/clipboard';
import { sharePromptFile } from '@/engine/importExport';
import { estimateTokens, formatTokenCount } from '@/utils/tokenCounter';
import { usePromptStore } from '@/stores/promptStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { getDatabase } from '@/database/connection';
import * as queries from '@/database/queries';
import { t } from '@/i18n/strings';
import type { VibeNote } from '@/types';

interface Props {
  promptId?: string;
}

export default function PromptDetailScreen({ promptId }: Props) {
  const getPromptById = usePromptStore(s => s.getPromptById);
  const toggleFavorite = usePromptStore(s => s.toggleFavorite);
  const togglePin = usePromptStore(s => s.togglePin);
  const deletePrompt = usePromptStore(s => s.deletePrompt);
  const incrementUsage = usePromptStore(s => s.incrementUsage);
  const navigate = useNavigationStore(s => s.navigate);
  const goBack = useNavigationStore(s => s.goBack);
  const language = useSettingsStore(s => s.language);
  const isRTL = useSettingsStore(s => s.isRTL);
  const customCategories = useSettingsStore(s => s.customCategories);
  const colors = useThemeColors();

  const allCategories = [...CATEGORIES, ...customCategories];

  const updatePromptFields = usePromptStore(s => s.updatePrompt);

  const [prompt, setPrompt] = useState<VibeNote | null>(null);
  const [showFiller, setShowFiller] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  // Link picker: attach other prompts (chains) or contexts to this prompt
  const [linkPicker, setLinkPicker] = useState<'linked' | 'context' | null>(null);
  const [pickerItems, setPickerItems] = useState<VibeNote[]>([]);

  useEffect(() => {
    if (promptId) {
      setPrompt(getPromptById(promptId));
    }
  }, [promptId]);

  const openLinkPicker = (mode: 'linked' | 'context') => {
    if (!prompt) return;
    try {
      const db = getDatabase();
      const all = queries.getAllPrompts(db, { kind: mode === 'linked' ? 'prompt' : 'context' });
      setPickerItems(all.filter(p => p.id !== prompt.id));
    } catch {
      setPickerItems([]);
    }
    setLinkPicker(mode);
  };

  const toggleLinkedItem = (id: string) => {
    if (!prompt) return;
    const field = linkPicker === 'linked' ? 'linkedIds' : 'contextIds';
    const current = prompt[field as 'linkedIds' | 'contextIds'];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    updatePromptFields(prompt.id, { [field]: next });
    setPrompt(prev => (prev ? { ...prev, [field]: next } : prev));
  };

  const resolveItems = (ids: string[]): VibeNote[] => {
    try {
      return queries.getPromptsByIds(getDatabase(), ids);
    } catch {
      return [];
    }
  };

  if (!prompt) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.textSecondary }]}>Prompt not found</Text>
      </View>
    );
  }

  const catInfo = allCategories.find(c => c.value === prompt.category);
  const hasVars = hasVariables(prompt.content);
  const tokenCount = estimateTokens(prompt.content);
  const isPromptKind = prompt.kind === 'prompt';
  const linkedPrompts = isPromptKind ? resolveItems(prompt.linkedIds) : [];
  const attachedContexts = isPromptKind ? resolveItems(prompt.contextIds) : [];

  const kindMeta = prompt.kind === 'note'
    ? { icon: 'reader-outline' as const, label: t('kindNote', language), color: '#F59E0B' }
    : prompt.kind === 'context'
      ? { icon: 'layers-outline' as const, label: t('kindContext', language), color: '#8B5CF6' }
      : null;

  const handleCopy = async () => {
    await copyToClipboard(prompt.content);
    incrementUsage(prompt.id);
  };

  const handleDelete = () => {
    deletePrompt(prompt.id);
    goBack();
  };

  const handleShare = async () => {
    await sharePromptFile(prompt, false);
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
        <Pressable onPress={handleShare} hitSlop={8} style={styles.headerBtn}>
          <Ionicons name="share-outline" size={22} color={colors.primary} />
        </Pressable>
        <Pressable
          onPress={() => {
            togglePin(prompt.id);
            setPrompt(prev => prev ? { ...prev, isPinned: !prev.isPinned } : null);
          }}
          hitSlop={8}
          style={styles.headerBtn}
        >
          <Ionicons
            name={prompt.isPinned ? 'pin' : 'pin-outline'}
            size={22}
            color={prompt.isPinned ? colors.primary : colors.textMuted}
          />
        </Pressable>
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
          {kindMeta && (
            <View style={[styles.catBadge, { backgroundColor: kindMeta.color + '18' }]}>
              <Ionicons name={kindMeta.icon} size={14} color={kindMeta.color} />
              <Text style={[styles.catText, { color: kindMeta.color }]}>{kindMeta.label}</Text>
            </View>
          )}
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

        {/* Token count badge */}
        <View style={[styles.tokenRow, isRTL && { flexDirection: 'row-reverse' }]}>
          <View style={[styles.tokenBadge, { backgroundColor: colors.primary + '12' }]}>
            <Ionicons name="analytics-outline" size={14} color={colors.primary} />
            <Text style={[styles.tokenText, { color: colors.primary }]}>
              ~{formatTokenCount(tokenCount)} {t('tokens', language)}
            </Text>
          </View>
        </View>

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

        {/* Linked prompts: composition chains ("next step" suggestions in chat) */}
        {isPromptKind && (
          <View style={[styles.linkCard, { backgroundColor: colors.card }]}>
            <View style={[styles.linkHeader, isRTL && styles.rowRTL]}>
              <View style={[styles.linkTitleRow, isRTL && styles.rowRTL]}>
                <Ionicons name="git-branch-outline" size={16} color={colors.primary} />
                <Text style={[styles.linkTitle, { color: colors.text }]}>{t('linkedPrompts', language)}</Text>
              </View>
              <Pressable onPress={() => openLinkPicker('linked')} hitSlop={8}>
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              </Pressable>
            </View>
            {linkedPrompts.length > 0 ? (
              <View style={[styles.linkChips, isRTL && styles.rowRTL]}>
                {linkedPrompts.map(lp => (
                  <Pressable
                    key={lp.id}
                    style={[styles.linkChip, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}
                    onPress={() => navigate('PromptDetail', { promptId: lp.id })}
                  >
                    <Ionicons name="flash-outline" size={12} color={colors.primary} />
                    <Text style={[styles.linkChipText, { color: colors.primary }]} numberOfLines={1}>{lp.title}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={[styles.linkEmpty, { color: colors.textMuted }, isRTL && styles.textRTL]}>
                {t('linkedPromptsHint', language)}
              </Text>
            )}
          </View>
        )}

        {/* Attached contexts: injected as system context when run in chat */}
        {isPromptKind && (
          <View style={[styles.linkCard, { backgroundColor: colors.card }]}>
            <View style={[styles.linkHeader, isRTL && styles.rowRTL]}>
              <View style={[styles.linkTitleRow, isRTL && styles.rowRTL]}>
                <Ionicons name="layers-outline" size={16} color={colors.primary} />
                <Text style={[styles.linkTitle, { color: colors.text }]}>{t('contexts', language)}</Text>
              </View>
              <Pressable onPress={() => openLinkPicker('context')} hitSlop={8}>
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              </Pressable>
            </View>
            {attachedContexts.length > 0 ? (
              <View style={[styles.linkChips, isRTL && styles.rowRTL]}>
                {attachedContexts.map(ctx => (
                  <Pressable
                    key={ctx.id}
                    style={[styles.linkChip, { backgroundColor: '#8B5CF618', borderColor: '#8B5CF640' }]}
                    onPress={() => navigate('PromptDetail', { promptId: ctx.id })}
                  >
                    <Ionicons name="layers" size={12} color="#8B5CF6" />
                    <Text style={[styles.linkChipText, { color: '#8B5CF6' }]} numberOfLines={1}>{ctx.title}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={[styles.linkEmpty, { color: colors.textMuted }, isRTL && styles.textRTL]}>
                {t('contextsHint', language)}
              </Text>
            )}
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

        {isAIConfigured() && (
          <Pressable
            style={[styles.favBtn, { backgroundColor: colors.background }]}
            onPress={() => navigate('AIAssistant', { seedPrompt: prompt.content, seedPromptId: prompt.id, seedNonce: String(Date.now()) })}
            accessibilityLabel={t('chatWithAI', language)}
          >
            <Ionicons name="chatbubbles-outline" size={24} color={colors.primary} />
          </Pressable>
        )}

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

      {/* Picker for linking prompts / attaching contexts */}
      <Modal visible={linkPicker !== null} transparent animationType="slide" onRequestClose={() => setLinkPicker(null)}>
        <Pressable style={[styles.pickerOverlay, { backgroundColor: colors.overlay }]} onPress={() => setLinkPicker(null)}>
          <Pressable style={[styles.pickerSheet, { backgroundColor: colors.card }]} onPress={() => {}}>
            <View style={[styles.pickerHeader, isRTL && styles.headerRTL]}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>
                {linkPicker === 'linked' ? t('linkPrompt', language) : t('attachContexts', language)}
              </Text>
              <Pressable onPress={() => setLinkPicker(null)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>
            <FlatList
              data={pickerItems}
              keyExtractor={item => item.id}
              style={{ maxHeight: 380 }}
              ListEmptyComponent={
                <Text style={[styles.pickerEmpty, { color: colors.textMuted }]}>
                  {linkPicker === 'linked' ? t('noPrompts', language) : t('noContexts', language)}
                </Text>
              }
              renderItem={({ item }) => {
                const field = linkPicker === 'linked' ? prompt.linkedIds : prompt.contextIds;
                const selected = field.includes(item.id);
                return (
                  <Pressable
                    style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                    onPress={() => toggleLinkedItem(item.id)}
                  >
                    <View style={[styles.pickerItemRow, isRTL && styles.headerRTL]}>
                      <Text style={[styles.pickerItemTitle, { color: colors.text }, isRTL && styles.textRTL]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Ionicons
                        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={20}
                        color={selected ? colors.primary : colors.textMuted}
                      />
                    </View>
                    <Text style={[styles.pickerItemPreview, { color: colors.textMuted }, isRTL && styles.textRTL]} numberOfLines={2}>
                      {item.content}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { textAlign: 'center', marginTop: 100, fontSize: FONT_SIZE.lg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRTL: { flexDirection: 'row-reverse' },
  headerBtn: { marginLeft: SPACING.lg },
  body: { flex: 1, padding: SPACING.lg },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  rowRTL: { flexDirection: 'row-reverse' },
  catBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full,
  },
  catText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  pinBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full,
  },
  pinText: { fontSize: FONT_SIZE.xs, fontWeight: '500' },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '700', marginBottom: SPACING.sm },
  textRTL: { textAlign: 'right' },
  description: { fontSize: FONT_SIZE.md, marginBottom: SPACING.lg, lineHeight: 22 },
  tokenRow: { flexDirection: 'row', marginBottom: SPACING.md },
  tokenBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: RADIUS.full,
  },
  tokenText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  contentCard: { borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, ...SHADOW.card },
  content: { fontSize: FONT_SIZE.md, lineHeight: 24 },
  variable: { fontWeight: '700' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  tag: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  tagText: { fontSize: FONT_SIZE.sm, fontWeight: '500' },
  linkCard: { borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, ...SHADOW.card },
  linkHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  linkTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  linkTitle: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  linkChips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  linkChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full, borderWidth: 1, maxWidth: 220,
  },
  linkChipText: { fontSize: FONT_SIZE.xs, fontWeight: '600', flexShrink: 1 },
  linkEmpty: { fontSize: FONT_SIZE.xs, lineHeight: 18 },
  pickerOverlay: { flex: 1, justifyContent: 'flex-end' },
  pickerSheet: {
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    paddingBottom: SPACING.xl, maxHeight: '75%',
  },
  pickerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  pickerTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700' },
  pickerItem: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: StyleSheet.hairlineWidth },
  pickerItemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm },
  pickerItemTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', flex: 1 },
  pickerItemPreview: { fontSize: FONT_SIZE.xs, lineHeight: 18, marginTop: 2 },
  pickerEmpty: { textAlign: 'center', paddingVertical: SPACING.xl, fontSize: FONT_SIZE.sm },
  statsCard: { borderRadius: RADIUS.lg, padding: SPACING.lg, ...SHADOW.card },
  statRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: SPACING.sm, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statLabel: { fontSize: FONT_SIZE.md },
  statValue: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  bottomActions: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    padding: SPACING.lg, borderTopWidth: StyleSheet.hairlineWidth,
  },
  favBtn: {
    width: 48, height: 48, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },
  mainAction: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.md, borderRadius: RADIUS.md,
  },
  mainActionText: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: '#fff' },
});
