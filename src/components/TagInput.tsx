import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONT_SIZE } from '@/constants';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/i18n/strings';

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({ tags, onChange }: Props) {
  const [input, setInput] = useState('');
  const language = useSettingsStore(s => s.language);
  const isRTL = useSettingsStore(s => s.isRTL);

  const addTag = () => {
    const tag = input.trim().toLowerCase().replace(/^#/, '');
    if (tag && !tags.includes(tag) && tags.length < 10) {
      onChange([...tags, tag]);
      setInput('');
    }
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <View>
      <View style={[styles.tagsRow, isRTL && styles.tagsRowRTL]}>
        {tags.map((tag, i) => (
          <View key={i} style={styles.tag}>
            <Text style={styles.tagText}>#{tag}</Text>
            <Pressable onPress={() => removeTag(i)} hitSlop={4}>
              <Ionicons name="close-circle" size={14} color={COLORS.textSecondary} />
            </Pressable>
          </View>
        ))}
      </View>
      <View style={[styles.inputRow, isRTL && styles.inputRowRTL]}>
        <TextInput
          style={[styles.input, isRTL && { textAlign: 'right' as const }]}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={addTag}
          placeholder={t('addTag', language)}
          placeholderTextColor={COLORS.textMuted}
          returnKeyType="done"
        />
        {input.length > 0 && (
          <Pressable onPress={addTag} style={styles.addBtn}>
            <Ionicons name="add-circle" size={24} color={COLORS.primary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tagsRowRTL: {
    flexDirection: 'row-reverse',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  inputRowRTL: {
    flexDirection: 'row-reverse',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  addBtn: {
    padding: 4,
  },
});
