import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, Modal, ScrollView, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants';
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
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={[styles.header, isRTL && styles.headerRTL]}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {prompt?.title || t('fillVariables', language)}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {variables.map(v => (
              <View key={v.name} style={styles.field}>
                <Text style={[styles.label, isRTL && styles.textRTL]}>
                  {v.label || v.name.replace(/_/g, ' ')}
                </Text>
                {v.type === 'select' && v.options ? (
                  <View style={styles.optionsRow}>
                    {v.options.map(opt => (
                      <Pressable
                        key={opt}
                        style={[
                          styles.optionChip,
                          values[v.name] === opt && styles.optionChipActive,
                        ]}
                        onPress={() =>
                          setValues(prev => ({ ...prev, [v.name]: opt }))
                        }
                      >
                        <Text
                          style={[
                            styles.optionText,
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
                    style={[styles.input, isRTL && styles.inputRTL]}
                    value={values[v.name] || ''}
                    onChangeText={text =>
                      setValues(prev => ({ ...prev, [v.name]: text }))
                    }
                    placeholder={v.defaultValue || v.name}
                    placeholderTextColor={COLORS.textMuted}
                  />
                )}
              </View>
            ))}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable style={styles.primaryBtn} onPress={handleCopyWithValues}>
              <Ionicons name="copy" size={16} color="#fff" />
              <Text style={styles.primaryBtnText}>
                {t('copyWithValues', language)}
              </Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={handleCopyRaw}>
              <Text style={styles.secondaryBtnText}>
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
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.card,
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
    borderBottomColor: COLORS.border,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
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
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textTransform: 'capitalize',
  },
  textRTL: {
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    backgroundColor: COLORS.background,
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
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  optionChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  actions: {
    padding: SPACING.lg,
    gap: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
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
    color: COLORS.textSecondary,
  },
});
