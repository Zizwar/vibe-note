import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONT_SIZE, CATEGORIES, PLATFORMS } from '@/constants';
import TagInput from '@/components/TagInput';
import { usePromptStore } from '@/stores/promptStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/i18n/strings';
import type { PromptCategory, AIPlatform } from '@/types';

interface Props {
  promptId?: string;
}

export default function CreatePromptScreen({ promptId }: Props) {
  const addPrompt = usePromptStore(s => s.addPrompt);
  const updatePrompt = usePromptStore(s => s.updatePrompt);
  const getPromptById = usePromptStore(s => s.getPromptById);
  const goBack = useNavigationStore(s => s.goBack);
  const language = useSettingsStore(s => s.language);
  const isRTL = useSettingsStore(s => s.isRTL);

  const isEditing = !!promptId;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PromptCategory>('other');
  const [platform, setPlatform] = useState<AIPlatform>('chatgpt');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (promptId) {
      const prompt = getPromptById(promptId);
      if (prompt) {
        setTitle(prompt.title);
        setContent(prompt.content);
        setDescription(prompt.description || '');
        setCategory(prompt.category);
        setPlatform(prompt.platform);
        setTags(prompt.tags);
      }
    }
  }, [promptId]);

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;

    if (isEditing && promptId) {
      updatePrompt(promptId, {
        title: title.trim(),
        content: content.trim(),
        description: description.trim() || undefined,
        category,
        platform,
        tags,
      });
    } else {
      addPrompt({
        title: title.trim(),
        content: content.trim(),
        description: description.trim() || undefined,
        category,
        platform,
        tags,
      });
    }
    goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <Pressable onPress={goBack} hitSlop={8}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {t(isEditing ? 'editPrompt' : 'newPrompt', language)}
        </Text>
        <Pressable
          onPress={handleSave}
          style={[styles.saveBtn, (!title.trim() || !content.trim()) && styles.saveBtnDisabled]}
          disabled={!title.trim() || !content.trim()}
        >
          <Text style={styles.saveBtnText}>{t('save', language)}</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={[styles.label, isRTL && styles.textRTL]}>{t('title', language)}</Text>
        <TextInput
          style={[styles.input, isRTL && styles.inputRTL]}
          value={title}
          onChangeText={setTitle}
          placeholder={t('title', language)}
          placeholderTextColor={COLORS.textMuted}
        />

        {/* Content */}
        <Text style={[styles.label, isRTL && styles.textRTL]}>{t('content', language)}</Text>
        <TextInput
          style={[styles.input, styles.contentInput, isRTL && styles.inputRTL]}
          value={content}
          onChangeText={setContent}
          placeholder={t('content', language)}
          placeholderTextColor={COLORS.textMuted}
          multiline
          textAlignVertical="top"
        />
        <Text style={styles.hint}>{t('variableHint', language)}</Text>

        {/* Description */}
        <Text style={[styles.label, isRTL && styles.textRTL]}>{t('description', language)}</Text>
        <TextInput
          style={[styles.input, isRTL && styles.inputRTL]}
          value={description}
          onChangeText={setDescription}
          placeholder={t('description', language)}
          placeholderTextColor={COLORS.textMuted}
        />

        {/* Category */}
        <Text style={[styles.label, isRTL && styles.textRTL]}>{t('category', language)}</Text>
        <View style={styles.chipGrid}>
          {CATEGORIES.map(cat => (
            <Pressable
              key={cat.value}
              style={[
                styles.chip,
                category === cat.value && { backgroundColor: cat.color },
              ]}
              onPress={() => setCategory(cat.value)}
            >
              <Ionicons
                name={cat.icon as any}
                size={14}
                color={category === cat.value ? '#fff' : cat.color}
              />
              <Text style={[
                styles.chipText,
                category === cat.value && styles.chipTextActive,
              ]}>
                {language === 'ar' ? cat.labelAr : cat.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Platform */}
        <Text style={[styles.label, isRTL && styles.textRTL]}>{t('platform', language)}</Text>
        <View style={styles.chipGrid}>
          {PLATFORMS.map(plat => (
            <Pressable
              key={plat.value}
              style={[
                styles.chip,
                platform === plat.value && { backgroundColor: plat.color },
              ]}
              onPress={() => setPlatform(plat.value)}
            >
              <Ionicons
                name={plat.icon as any}
                size={14}
                color={platform === plat.value ? '#fff' : plat.color}
              />
              <Text style={[
                styles.chipText,
                platform === plat.value && styles.chipTextActive,
              ]}>
                {plat.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Tags */}
        <Text style={[styles.label, isRTL && styles.textRTL]}>{t('tags', language)}</Text>
        <TagInput tags={tags} onChange={setTags} />

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
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
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
  body: {
    flex: 1,
    padding: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    marginTop: SPACING.lg,
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
    backgroundColor: COLORS.card,
  },
  inputRTL: {
    textAlign: 'right',
  },
  contentInput: {
    minHeight: 120,
  },
  hint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
});
