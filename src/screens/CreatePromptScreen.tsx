import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
  Modal, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync } from 'expo-audio';
import { File as FSFile } from 'expo-file-system';
import MiniAudioPlayer from '@/components/MiniAudioPlayer';
import { RADIUS, SPACING, FONT_SIZE, CATEGORIES, PLATFORMS } from '@/constants';
import { useThemeColors } from '@/hooks/useTheme';
import TagInput from '@/components/TagInput';
import { usePromptStore } from '@/stores/promptStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { isAIConfigured, editPromptWithAI } from '@/engine/aiService';
import { estimateTokens, formatTokenCount } from '@/utils/tokenCounter';
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
  const customCategories = useSettingsStore(s => s.customCategories);
  const customPlatforms = useSettingsStore(s => s.customPlatforms);
  const colors = useThemeColors();

  const allCategories = [...CATEGORIES, ...customCategories];
  const allPlatforms = [...PLATFORMS, ...customPlatforms];

  const isEditing = !!promptId;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PromptCategory>('other');
  const [platform, setPlatform] = useState<AIPlatform>('chatgpt');
  const [tags, setTags] = useState<string[]>([]);
  const [audioBase64, setAudioBase64] = useState<string | undefined>(undefined);

  // AI Edit modal
  const [showAIEdit, setShowAIEdit] = useState(false);
  const [aiEditInstructions, setAiEditInstructions] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Audio
  const [isRecording, setIsRecording] = useState(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

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
        setAudioBase64(prompt.audioBase64);
      }
    }
  }, [promptId]);

  const handleSave = () => {
    if (!content.trim()) return;

    // Auto-title: use first words of content if title is empty
    let finalTitle = title.trim();
    if (!finalTitle) {
      finalTitle = content.trim().split(/\s+/).slice(0, 6).join(' ');
      if (finalTitle.length > 60) finalTitle = finalTitle.slice(0, 57) + '...';
    }

    if (isEditing && promptId) {
      updatePrompt(promptId, {
        title: finalTitle,
        content: content.trim(),
        description: description.trim() || undefined,
        category,
        platform,
        tags,
        audioBase64,
      });
    } else {
      addPrompt({
        title: finalTitle,
        content: content.trim(),
        description: description.trim() || undefined,
        category,
        platform,
        tags,
      });
    }
    goBack();
  };

  const handleAIEdit = async () => {
    if (!aiEditInstructions.trim() || !content.trim()) return;
    setAiLoading(true);
    try {
      const result = await editPromptWithAI(content, aiEditInstructions.trim());
      setContent(result);
      setShowAIEdit(false);
      setAiEditInstructions('');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'AI edit failed');
    }
    setAiLoading(false);
  };

  const handleStartRecording = async () => {
    try {
      const status = await requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission required', 'Audio recording permission is needed');
        return;
      }
      recorder.record();
      setIsRecording(true);
    } catch (e) {
      console.error('Recording error:', e);
    }
  };

  const handleStopRecording = async () => {
    try {
      await recorder.stop();
      setIsRecording(false);
      if (recorder.uri) {
        const file = new FSFile(recorder.uri);
        const base64 = await file.base64();
        setAudioBase64(base64);
      }
    } catch (e) {
      console.error('Stop recording error:', e);
      setIsRecording(false);
    }
  };

  const tokenCount = estimateTokens(content);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }, isRTL && styles.headerRTL]}>
        <Pressable onPress={goBack} hitSlop={8}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t(isEditing ? 'editPrompt' : 'newPrompt', language)}
        </Text>
        <Pressable
          onPress={handleSave}
          style={[styles.saveBtn, { backgroundColor: colors.primary }, !content.trim() && styles.saveBtnDisabled]}
          disabled={!content.trim()}
        >
          <Text style={styles.saveBtnText}>{t('save', language)}</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Token counter */}
        <View style={[styles.tokenRow, isRTL && { flexDirection: 'row-reverse' }]}>
          <View style={[styles.tokenBadge, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="analytics-outline" size={14} color={colors.primary} />
            <Text style={[styles.tokenText, { color: colors.primary }]}>
              {formatTokenCount(tokenCount)} {t('tokens', language)}
            </Text>
          </View>
          {isAIConfigured() && isEditing && (
            <Pressable
              style={[styles.aiEditBtn, { borderColor: colors.primary }]}
              onPress={() => setShowAIEdit(true)}
            >
              <Ionicons name="sparkles" size={14} color={colors.primary} />
              <Text style={[styles.aiEditText, { color: colors.primary }]}>{t('editWithAI', language)}</Text>
            </Pressable>
          )}
        </View>

        <Text style={[styles.label, { color: colors.text }, isRTL && styles.textRTL]}>{t('title', language)}</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }, isRTL && styles.inputRTL]}
          value={title}
          onChangeText={setTitle}
          placeholder={language === 'ar' ? 'سيتم إنشاؤه تلقائياً من المحتوى' : 'Auto-generated from content if empty'}
          placeholderTextColor={colors.textMuted}
        />

        <Text style={[styles.label, { color: colors.text }, isRTL && styles.textRTL]}>{t('content', language)}</Text>
        <TextInput
          style={[styles.input, styles.contentInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }, isRTL && styles.inputRTL]}
          value={content}
          onChangeText={setContent}
          placeholder={t('content', language)}
          placeholderTextColor={colors.textMuted}
          multiline
          textAlignVertical="top"
        />
        <Text style={[styles.hint, { color: colors.textMuted }]}>{t('variableHint', language)}</Text>

        <Text style={[styles.label, { color: colors.text }, isRTL && styles.textRTL]}>{t('description', language)}</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }, isRTL && styles.inputRTL]}
          value={description}
          onChangeText={setDescription}
          placeholder={t('description', language)}
          placeholderTextColor={colors.textMuted}
        />

        {/* Audio Note */}
        <Text style={[styles.label, { color: colors.text }, isRTL && styles.textRTL]}>{t('audioNote', language)}</Text>
        <View style={[styles.audioRow, isRTL && { flexDirection: 'row-reverse' }]}>
          {!isRecording ? (
            <Pressable
              style={[styles.audioBtn, { backgroundColor: colors.danger + '15' }]}
              onPress={handleStartRecording}
            >
              <Ionicons name="mic" size={20} color={colors.danger} />
              <Text style={[styles.audioBtnText, { color: colors.danger }]}>{t('recordAudio', language)}</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.audioBtn, { backgroundColor: colors.danger }]}
              onPress={handleStopRecording}
            >
              <Ionicons name="stop" size={20} color="#fff" />
              <Text style={[styles.audioBtnText, { color: '#fff' }]}>{t('stopAudio', language)}</Text>
            </Pressable>
          )}
          {audioBase64 && (
            <Pressable onPress={() => setAudioBase64(undefined)} hitSlop={8} style={{ marginLeft: 'auto' }}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          )}
        </View>

        {audioBase64 && (
          <View style={{ marginBottom: SPACING.md }}>
            <MiniAudioPlayer audioBase64={audioBase64} />
          </View>
        )}

        <Text style={[styles.label, { color: colors.text }, isRTL && styles.textRTL]}>{t('category', language)}</Text>
        <View style={styles.chipGrid}>
          {allCategories.map(cat => (
            <Pressable
              key={cat.value}
              style={[
                styles.chip,
                { backgroundColor: colors.card, borderColor: colors.border },
                category === cat.value && { backgroundColor: cat.color, borderColor: cat.color },
              ]}
              onPress={() => setCategory(cat.value)}
            >
              <Ionicons name={cat.icon as any} size={14} color={category === cat.value ? '#fff' : cat.color} />
              <Text style={[styles.chipText, { color: colors.text }, category === cat.value && styles.chipTextActive]}>
                {language === 'ar' ? cat.labelAr : cat.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.text }, isRTL && styles.textRTL]}>{t('platform', language)}</Text>
        <View style={styles.chipGrid}>
          {allPlatforms.map(plat => (
            <Pressable
              key={plat.value}
              style={[
                styles.chip,
                { backgroundColor: colors.card, borderColor: colors.border },
                platform === plat.value && { backgroundColor: plat.color, borderColor: plat.color },
              ]}
              onPress={() => setPlatform(plat.value)}
            >
              <Ionicons name={plat.icon as any} size={14} color={platform === plat.value ? '#fff' : plat.color} />
              <Text style={[styles.chipText, { color: colors.text }, platform === plat.value && styles.chipTextActive]}>
                {plat.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.text }, isRTL && styles.textRTL]}>{t('tags', language)}</Text>
        <TagInput tags={tags} onChange={setTags} />

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* AI Edit Modal */}
      <Modal visible={showAIEdit} transparent animationType="fade" onRequestClose={() => setShowAIEdit(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('aiEdit', language)}</Text>
            <Text style={[styles.modalDesc, { color: colors.textMuted }]}>{t('aiEditDesc', language)}</Text>
            <TextInput
              style={[styles.aiInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              value={aiEditInstructions}
              onChangeText={setAiEditInstructions}
              placeholder={t('editInstructions', language)}
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: colors.primary }, aiLoading && { opacity: 0.5 }]}
                onPress={handleAIEdit}
                disabled={aiLoading || !aiEditInstructions.trim()}
              >
                {aiLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="sparkles" size={16} color="#fff" />
                )}
                <Text style={styles.modalBtnText}>{t('editWithAI', language)}</Text>
              </Pressable>
              <Pressable onPress={() => setShowAIEdit(false)}>
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>{t('cancel', language)}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRTL: { flexDirection: 'row-reverse' },
  headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700' },
  saveBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.md },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.md },
  body: { flex: 1, padding: SPACING.lg },
  tokenRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  tokenBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: RADIUS.full,
  },
  tokenText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  aiEditBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full, borderWidth: 1,
  },
  aiEditText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  label: { fontSize: FONT_SIZE.md, fontWeight: '600', marginBottom: SPACING.xs, marginTop: SPACING.lg },
  textRTL: { textAlign: 'right' },
  input: { borderWidth: 1, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONT_SIZE.md },
  inputRTL: { textAlign: 'right' },
  contentInput: { minHeight: 120 },
  hint: { fontSize: FONT_SIZE.xs, marginTop: SPACING.xs, fontStyle: 'italic' },
  audioRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flexWrap: 'wrap' },
  audioBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md,
  },
  audioBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  audioIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: RADIUS.full,
  },
  audioIndicatorText: { fontSize: FONT_SIZE.xs, fontWeight: '500' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1,
  },
  chipText: { fontSize: FONT_SIZE.sm, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  // AI Edit Modal
  modalOverlay: { flex: 1, justifyContent: 'center', padding: SPACING.xl },
  modalCard: { borderRadius: RADIUS.xl, padding: SPACING.xl },
  modalTitle: { fontSize: FONT_SIZE.xxl, fontWeight: '700', marginBottom: SPACING.sm },
  modalDesc: { fontSize: FONT_SIZE.sm, marginBottom: SPACING.lg, lineHeight: 20 },
  aiInput: {
    borderWidth: 1, borderRadius: RADIUS.md, padding: SPACING.md,
    fontSize: FONT_SIZE.md, minHeight: 80,
  },
  modalActions: { gap: SPACING.md, marginTop: SPACING.lg, alignItems: 'center' },
  modalBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.md, borderRadius: RADIUS.md, width: '100%',
  },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.lg },
  cancelText: { fontSize: FONT_SIZE.md, fontWeight: '600', paddingVertical: SPACING.sm },
});
