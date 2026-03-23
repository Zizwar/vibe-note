import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, Modal, ScrollView, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants';
import { useThemeColors } from '@/hooks/useTheme';
import { extractVariables, buildFinalPrompt } from '@/engine/variableParser';
import { copyToClipboard } from '@/utils/clipboard';
import { usePromptStore } from '@/stores/promptStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/i18n/strings';
import type { ProomyNote } from '@/types';

interface Props {
  prompt: ProomyNote | null;
  visible: boolean;
  onClose: () => void;
}

export default function VariableFiller({ prompt, visible, onClose }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const incrementUsage = usePromptStore(s => s.incrementUsage);
  const language = useSettingsStore(s => s.language);
  const isRTL = useSettingsStore(s => s.isRTL);
  const colors = useThemeColors();

  const variables = prompt ? extractVariables(prompt.content) : [];

  useEffect(() => {
    if (prompt) {
      const defaults: Record<string, string> = {};
      for (const v of extractVariables(prompt.content)) {
        defaults[v.name] = v.defaultValue || '';
      }
      setValues(defaults);
    }
  }, [prompt?.id]);

  const handleCopyWithValues = async () => {
    if (!prompt) return;
    const final = buildFinalPrompt(prompt.content, values);
    await copyToClipboard(final);
    incrementUsage(prompt.id);
    onClose();
  };

  const handleCopyRaw = async () => {
    if (!prompt) return;
    await copyToClipboard(prompt.content);
    incrementUsage(prompt.id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }, isRTL && styles.headerRTL]}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {prompt?.title || t('fillVariables', language)}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {variables.map(v => (
              <View key={v.name} style={styles.field}>
                <Text style={[styles.label, { color: colors.text }, isRTL && styles.textRTL]}>
                  {v.label || v.name.replace(/_/g, ' ')}
                </Text>
                {v.type === 'select' && v.options ? (
                  <View style={styles.optionsRow}>
                    {v.options.map(opt => (
                      <Pressable
                        key={opt}
                        style={[
                          styles.optionChip,
                          { borderColor: colors.border, backgroundColor: colors.background },
                          values[v.name] === opt && { backgroundColor: colors.primary, borderColor: colors.primary },
                        ]}
                        onPress={() =>
                          setValues(prev => ({ ...prev, [v.name]: opt }))
                        }
                      >
                        <Text
                          style={[
                            styles.optionText,
                            { color: colors.text },
                            values[v.name] === opt && styles.optionTextActive,
                          ]}
                        >
                          {opt}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }, isRTL && styles.inputRTL]}
                    value={values[v.name] || ''}
                    onChangeText={text =>
                      setValues(prev => ({ ...prev, [v.name]: text }))
                    }
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
              <Text style={styles.primaryBtnText}>
                {t('copyWithValues', language)}
              </Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={handleCopyRaw}>
              <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>
                {t('copyRaw', language)}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '80%',
    ...SHADOW.elevated,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    flex: 1,
  },
  body: {
    padding: SPACING.lg,
  },
  field: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    textTransform: 'capitalize',
  },
  textRTL: {
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
  },
  inputRTL: {
    textAlign: 'right',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  optionChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  optionText: {
    fontSize: FONT_SIZE.sm,
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  actions: {
    padding: SPACING.lg,
    gap: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  primaryBtnText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: '#fff',
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  secondaryBtnText: {
    fontSize: FONT_SIZE.md,
  },
});
