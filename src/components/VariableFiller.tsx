import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, Modal, ScrollView, StyleSheet, Alert, FlatList,
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
import type { ProomyNote } from '@/types';

interface Props {
  prompt: ProomyNote | null;
  visible: boolean;
  onClose: () => void;
}

export default function VariableFiller({ prompt, visible, onClose }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const incrementUsage = usePromptStore(s => s.incrementUsage);
  const updatePrompt = usePromptStore(s => s.updatePrompt);
  const language = useSettingsStore(s => s.language);
  const isRTL = useSettingsStore(s => s.isRTL);
  const addHistory = useHistoryStore(s => s.addHistory);
  const loadHistory = useHistoryStore(s => s.loadHistory);
  const history = useHistoryStore(s => s.history);
  const colors = useThemeColors();

  const variables = prompt ? extractVariables(prompt.content) : [];

  useEffect(() => {
    if (prompt) {
      const defaults: Record<string, string> = {};
      for (const v of extractVariables(prompt.content)) {
        defaults[v.name] = v.defaultValue || '';
      }
      setValues(defaults);
      loadHistory(prompt.id);
    }
  }, [prompt?.id]);

  const handleCopyWithValues = async () => {
    if (!prompt) return;
    const final = buildFinalPrompt(prompt.content, values);
    await copyToClipboard(final);
    incrementUsage(prompt.id);
    // Save to history
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
    await copyToClipboard(prompt.content);
    incrementUsage(prompt.id);
    onClose();
  };

  const handleShare = async () => {
    if (!prompt) return;
    const hasAudio = !!prompt.audioBase64;
    if (hasAudio) {
      Alert.alert(
        t('sharePrompt', language),
        t('audioWarning', language),
        [
          { text: t('skipAudio', language), onPress: () => sharePromptFile(prompt, false) },
          { text: t('includeAudio', language), onPress: () => sharePromptFile(prompt, true) },
          { text: t('cancel', language), style: 'cancel' },
        ]
      );
    } else {
      await sharePromptFile(prompt, false);
    }
  };

  const handleSaveValue = (varName: string, value: string) => {
    if (!prompt) return;
    // Update the variable's default value in the prompt content
    const newContent = prompt.content.replace(
      new RegExp(`\\{\\{${varName}(?:[:|][^}]*)?\\}\\}`),
      value ? `{{${varName}|${value}}}` : `{{${varName}}}`
    );
    updatePrompt(prompt.id, { content: newContent });
    Alert.alert(t('valueSaved', language));
  };

  const handleAddOption = (varName: string) => {
    const newVal = customInputs[varName]?.trim();
    if (!newVal || !prompt) return;
    // Add option to the select variable
    const regex = new RegExp(`\\{\\{${varName}:([^}]*)\\}\\}`);
    const match = prompt.content.match(regex);
    if (match) {
      const newContent = prompt.content.replace(regex, `{{${varName}:${match[1]}|${newVal}}}`);
      updatePrompt(prompt.id, { content: newContent });
      setCustomInputs(prev => ({ ...prev, [varName]: '' }));
    }
  };

  const handleApplyHistory = (entry: any) => {
    setValues(entry.values);
    setShowHistory(false);
  };

  const tokenCount = prompt ? estimateTokens(buildFinalPrompt(prompt.content, values)) : 0;

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
              {/* Token count */}
              <View style={[styles.tokenBadge, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.tokenText, { color: colors.primary }]}>
                  {formatTokenCount(tokenCount)} {t('tokens', language)}
                </Text>
              </View>
              {/* History button */}
              {promptHistory.length > 0 && (
                <Pressable onPress={() => setShowHistory(!showHistory)} hitSlop={8}>
                  <Ionicons name="time-outline" size={22} color={colors.primary} />
                </Pressable>
              )}
              {/* Share button */}
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
            <View style={[styles.historyPanel, { backgroundColor: colors.background }]}>
              <Text style={[styles.historyTitle, { color: colors.text }]}>{t('usageHistory', language)}</Text>
              <FlatList
                data={promptHistory.slice(0, 10)}
                keyExtractor={item => item.id}
                style={{ maxHeight: 150 }}
                renderItem={({ item }) => (
                  <Pressable
                    style={[styles.historyItem, { borderColor: colors.border }]}
                    onPress={() => handleApplyHistory(item)}
                  >
                    <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                      {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={[styles.historyValues, { color: colors.textMuted }]} numberOfLines={1}>
                      {Object.entries(item.values).map(([k, v]) => `${k}: ${v}`).join(', ')}
                    </Text>
                  </Pressable>
                )}
              />
            </View>
          )}

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {variables.map(v => (
              <View key={v.name} style={styles.field}>
                <View style={[styles.labelRow, isRTL && { flexDirection: 'row-reverse' }]}>
                  <Text style={[styles.label, { color: colors.text }, isRTL && styles.textRTL]}>
                    {v.label || v.name.replace(/_/g, ' ')}
                  </Text>
                  {/* Save button */}
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
                    {/* Custom option input */}
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
              <Ionicons name="copy" size={16} color="#fff" />
              <Text style={styles.primaryBtnText}>{t('copyWithValues', language)}</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={handleCopyRaw}>
              <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>{t('copyRaw', language)}</Text>
            </Pressable>
          </View>
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
  historyPanel: { padding: SPACING.md, borderBottomWidth: StyleSheet.hairlineWidth },
  historyTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', marginBottom: SPACING.sm },
  historyItem: {
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md,
    borderWidth: 1, borderRadius: RADIUS.md, marginBottom: SPACING.xs,
  },
  historyDate: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  historyValues: { fontSize: FONT_SIZE.xs, marginTop: 2 },
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
  actions: { padding: SPACING.lg, gap: SPACING.sm, borderTopWidth: StyleSheet.hairlineWidth },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.md, borderRadius: RADIUS.md,
  },
  primaryBtnText: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: '#fff' },
  secondaryBtn: { alignItems: 'center', paddingVertical: SPACING.sm },
  secondaryBtnText: { fontSize: FONT_SIZE.md },
});
