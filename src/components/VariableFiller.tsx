import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, Modal, ScrollView, StyleSheet, Alert, FlatList,
  Keyboard, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants';
import { useThemeColors } from '@/hooks/useTheme';
import { extractVariables, buildFinalPrompt } from '@/engine/variableParser';
import { copyToClipboard } from '@/utils/clipboard';
import { sharePromptFile } from '@/engine/importExport';
import { estimateTokens, formatTokenCount } from '@/utils/tokenCounter';
import { usePromptStore } from '@/stores/promptStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHistoryStore } from '@/stores/historyStore';
import { t } from '@/i18n/strings';
import type { VibeNote } from '@/types';

interface Props {
  prompt: VibeNote | null;
  visible: boolean;
  onClose: () => void;
}

export default function VariableFiller({ prompt, visible, onClose }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const keyboardHeight = useRef(new Animated.Value(0)).current;
  // Local content state to reflect real-time updates
  const [localContent, setLocalContent] = useState('');
  const incrementUsage = usePromptStore(s => s.incrementUsage);
  const updatePrompt = usePromptStore(s => s.updatePrompt);
  const getPromptById = usePromptStore(s => s.getPromptById);
  const language = useSettingsStore(s => s.language);
  const isRTL = useSettingsStore(s => s.isRTL);
  const addHistory = useHistoryStore(s => s.addHistory);
  const loadHistory = useHistoryStore(s => s.loadHistory);
  const history = useHistoryStore(s => s.history);
  const colors = useThemeColors();

  const variables = localContent ? extractVariables(localContent) : [];

  useEffect(() => {
    if (prompt && visible) {
      setLocalContent(prompt.content);
      const defaults: Record<string, string> = {};
      for (const v of extractVariables(prompt.content)) {
        defaults[v.name] = v.defaultValue || '';
      }
      setValues(defaults);
      setShowHistory(false);
      loadHistory(prompt.id);
    }
  }, [prompt?.id, visible]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', e => {
      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }).start();
    });
    return () => { show.remove(); hide.remove(); };
  }, []);

  const handleCopyWithValues = async () => {
    if (!prompt) return;
    const final = buildFinalPrompt(localContent, values);
    await copyToClipboard(final);
    incrementUsage(prompt.id);
    addHistory({
      promptId: prompt.id,
      promptTitle: prompt.title,
      values: { ...values },
      timestamp: Date.now(),
    });
    onClose();
  };

  const handleCopyRaw = async () => {
    if (!prompt) return;
    await copyToClipboard(localContent);
    incrementUsage(prompt.id);
    onClose();
  };

  const handleShare = async () => {
    if (!prompt) return;
    await sharePromptFile(prompt, false);
  };

  const handleSaveValue = (varName: string, value: string) => {
    if (!prompt) return;
    const newContent = localContent.replace(
      new RegExp(`\\{\\{${varName}(?:[:|][^}]*)?\\}\\}`),
      value ? `{{${varName}|${value}}}` : `{{${varName}}}`
    );
    updatePrompt(prompt.id, { content: newContent });
    setLocalContent(newContent);
    Alert.alert(t('valueSaved', language));
  };

  const handleAddOption = (varName: string) => {
    const newVal = customInputs[varName]?.trim();
    if (!newVal || !prompt) return;
    const regex = new RegExp(`\\{\\{${varName}:([^}]*)\\}\\}`);
    const match = localContent.match(regex);
    if (match) {
      const newContent = localContent.replace(regex, `{{${varName}:${match[1]}|${newVal}}}`);
      updatePrompt(prompt.id, { content: newContent });
      setLocalContent(newContent);
      setCustomInputs(prev => ({ ...prev, [varName]: '' }));
      // Auto-select the new value
      setValues(prev => ({ ...prev, [varName]: newVal }));
    }
  };

  const handleApplyHistory = (entry: any) => {
    setValues(entry.values);
    setShowHistory(false);
  };

  const tokenCount = localContent ? estimateTokens(buildFinalPrompt(localContent, values)) : 0;

  const promptHistory = history.filter(h => h.promptId === prompt?.id);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }, isRTL && styles.headerRTL]}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {prompt?.title || t('fillVariables', language)}
            </Text>
            <View style={[styles.headerActions, isRTL && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.tokenBadge, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.tokenText, { color: colors.primary }]}>
                  {formatTokenCount(tokenCount)} {t('tokens', language)}
                </Text>
              </View>
              {/* History button - always visible */}
              <Pressable
                onPress={() => setShowHistory(!showHistory)}
                hitSlop={8}
                style={[styles.historyBtn, showHistory && { backgroundColor: colors.primary + '15' }]}
              >
                <Ionicons name="time-outline" size={22} color={showHistory ? colors.primary : colors.textSecondary} />
              </Pressable>
              <Pressable onPress={handleShare} hitSlop={8}>
                <Ionicons name="share-outline" size={22} color={colors.primary} />
              </Pressable>
              <Pressable onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
          </View>

          {/* History panel */}
          {showHistory && (
            <View style={[styles.historyPanel, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
              <Text style={[styles.historyTitle, { color: colors.text }]}>{t('usageHistory', language)}</Text>
              {promptHistory.length > 0 ? (
                <FlatList
                  data={promptHistory.slice(0, 10)}
                  keyExtractor={item => item.id}
                  style={{ maxHeight: 180 }}
                  renderItem={({ item }) => (
                    <Pressable
                      style={[styles.historyItem, { borderColor: colors.border, backgroundColor: colors.card }]}
                      onPress={() => handleApplyHistory(item)}
                    >
                      <View style={[styles.historyItemHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                        <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                          {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        <View style={[styles.useBtn, { backgroundColor: colors.primary }]}>
                          <Text style={styles.useBtnText}>{t('usePrompt', language)}</Text>
                        </View>
                      </View>
                      <Text style={[styles.historyValues, { color: colors.textMuted }]} numberOfLines={2}>
                        {Object.entries(item.values).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                      </Text>
                    </Pressable>
                  )}
                />
              ) : (
                <Text style={[styles.noHistory, { color: colors.textMuted }]}>{t('noHistory', language)}</Text>
              )}
            </View>
          )}

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {variables.map(v => (
              <View key={v.name} style={styles.field}>
                <View style={[styles.labelRow, isRTL && { flexDirection: 'row-reverse' }]}>
                  <Text style={[styles.label, { color: colors.text }, isRTL && styles.textRTL]}>
                    {v.label || v.name.replace(/_/g, ' ')}
                  </Text>
                  <Pressable
                    style={[styles.saveBtn, { borderColor: colors.primary }]}
                    onPress={() => handleSaveValue(v.name, values[v.name] || '')}
                    hitSlop={4}
                  >
                    <Ionicons name="save-outline" size={14} color={colors.primary} />
                  </Pressable>
                </View>
                {v.type === 'select' && v.options ? (
                  <View>
                    <View style={styles.optionsRow}>
                      {v.options.map(opt => (
                        <Pressable
                          key={opt}
                          style={[
                            styles.optionChip,
                            { borderColor: colors.border, backgroundColor: colors.background },
                            values[v.name] === opt && { backgroundColor: colors.primary, borderColor: colors.primary },
                          ]}
                          onPress={() => setValues(prev => ({ ...prev, [v.name]: opt }))}
                        >
                          <Text style={[
                            styles.optionText, { color: colors.text },
                            values[v.name] === opt && styles.optionTextActive,
                          ]}>
                            {opt}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <View style={[styles.addOptionRow, isRTL && { flexDirection: 'row-reverse' }]}>
                      <TextInput
                        style={[styles.addOptionInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                        value={customInputs[v.name] || ''}
                        onChangeText={text => setCustomInputs(prev => ({ ...prev, [v.name]: text }))}
                        placeholder={t('customValue', language)}
                        placeholderTextColor={colors.textMuted}
                      />
                      <Pressable
                        style={[styles.addOptionBtn, { backgroundColor: colors.primary }]}
                        onPress={() => handleAddOption(v.name)}
                      >
                        <Ionicons name="add" size={16} color="#fff" />
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }, isRTL && styles.inputRTL]}
                    value={values[v.name] || ''}
                    onChangeText={text => setValues(prev => ({ ...prev, [v.name]: text }))}
                    placeholder={v.defaultValue || v.name}
                    placeholderTextColor={colors.textMuted}
                  />
                )}
              </View>
            ))}
          </ScrollView>

          <View style={[styles.actions, { borderTopColor: colors.border }]}>
            <Pressable style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={handleCopyWithValues}>
              <Ionicons name="copy" size={14} color="#fff" />
              <Text style={styles.primaryBtnText}>{t('copyWithValues', language)}</Text>
            </Pressable>
            <Pressable style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={handleCopyRaw}>
              <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>{t('copyRaw', language)}</Text>
            </Pressable>
          </View>
          <Animated.View style={{ height: keyboardHeight, backgroundColor: colors.card }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, maxHeight: '85%', ...SHADOW.elevated },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.lg, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRTL: { flexDirection: 'row-reverse' },
  headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700', flex: 1, marginRight: SPACING.sm },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  tokenBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full },
  tokenText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  historyBtn: { padding: 4, borderRadius: RADIUS.sm },
  historyPanel: { padding: SPACING.md, borderBottomWidth: StyleSheet.hairlineWidth },
  historyTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', marginBottom: SPACING.sm },
  historyItem: {
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md,
    borderWidth: 1, borderRadius: RADIUS.md, marginBottom: SPACING.sm,
  },
  historyItemHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyDate: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  historyValues: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  useBtn: {
    paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.sm,
  },
  useBtnText: { color: '#fff', fontSize: FONT_SIZE.xs, fontWeight: '700' },
  noHistory: { fontSize: FONT_SIZE.sm, textAlign: 'center', paddingVertical: SPACING.md },
  body: { padding: SPACING.lg },
  field: { marginBottom: SPACING.lg },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.xs },
  label: { fontSize: FONT_SIZE.md, fontWeight: '600', textTransform: 'capitalize' },
  textRTL: { textAlign: 'right' },
  saveBtn: { padding: 4, borderRadius: RADIUS.sm, borderWidth: 1 },
  input: { borderWidth: 1, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONT_SIZE.md },
  inputRTL: { textAlign: 'right' },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  optionChip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, borderWidth: 1,
  },
  optionText: { fontSize: FONT_SIZE.sm },
  optionTextActive: { color: '#fff', fontWeight: '600' },
  addOptionRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  addOptionInput: {
    flex: 1, borderWidth: 1, borderRadius: RADIUS.md,
    padding: SPACING.sm, fontSize: FONT_SIZE.sm,
  },
  addOptionBtn: {
    width: 36, height: 36, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row', gap: SPACING.sm,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  primaryBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.xs, paddingVertical: SPACING.sm, borderRadius: RADIUS.md,
  },
  primaryBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: '#fff' },
  secondaryBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1,
  },
  secondaryBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
});
