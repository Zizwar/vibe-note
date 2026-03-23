import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants';
import { useThemeColors } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePromptStore } from '@/stores/promptStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { isAIConfigured, analyzePrompt, improvePrompt, smartImportPrompt, generatePrompt } from '@/engine/aiService';
import { t } from '@/i18n/strings';
import type { PromptCategory, AIPlatform } from '@/types';

type TabType = 'import' | 'generate' | 'analyze';

export default function AIAssistantScreen() {
  const language = useSettingsStore(s => s.language);
  const isRTL = useSettingsStore(s => s.isRTL);
  const navigate = useNavigationStore(s => s.navigate);
  const addPrompt = usePromptStore(s => s.addPrompt);
  const colors = useThemeColors();

  const [activeTab, setActiveTab] = useState<TabType>('import');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const aiReady = isAIConfigured();

  const handleSmartImport = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await smartImportPrompt(input.trim());
      setResult({ type: 'import', data: res });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to process prompt');
    }
    setLoading(false);
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await generatePrompt(input.trim());
      setResult({ type: 'generate', data: res });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to generate prompt');
    }
    setLoading(false);
  };

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await analyzePrompt(input.trim());
      setResult({ type: 'analyze', data: res });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to analyze prompt');
    }
    setLoading(false);
  };

  const handleImprove = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const improved = await improvePrompt(input.trim());
      setInput(improved);
      setResult(null);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to improve prompt');
    }
    setLoading(false);
  };

  const handleAcceptAndSave = () => {
    if (!result) return;
    const data = result.data;
    addPrompt({
      title: data.title || 'Imported Prompt',
      content: data.content || input,
      description: data.description,
      category: (data.category || 'other') as PromptCategory,
      platform: (data.platform || 'chatgpt') as AIPlatform,
      tags: data.tags || [],
    });
    Alert.alert(language === 'ar' ? 'تم الحفظ!' : 'Saved!');
    setInput('');
    setResult(null);
  };

  const getActionLabel = () => {
    switch (activeTab) {
      case 'import': return loading ? t('importingSmartly', language) : t('smartImport', language);
      case 'generate': return loading ? t('generating', language) : t('generatePrompt', language);
      case 'analyze': return loading ? t('analyzing', language) : t('analyzePrompt', language);
    }
  };

  const handleAction = () => {
    switch (activeTab) {
      case 'import': return handleSmartImport();
      case 'generate': return handleGenerate();
      case 'analyze': return handleAnalyze();
    }
  };

  if (!aiReady) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <Ionicons name="sparkles-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{t('noAIProvider', language)}</Text>
          <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>{t('noAIProviderDesc', language)}</Text>
          <Pressable
            style={[styles.setupBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigate('AISettings')}
          >
            <Ionicons name="settings-outline" size={18} color="#fff" />
            <Text style={styles.setupBtnText}>{t('configureAI', language)}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* Tab Selector */}
        <View style={[styles.tabRow, { backgroundColor: colors.card }]}>
          {([
            { key: 'import', icon: 'cloud-download', label: t('smartImport', language) },
            { key: 'generate', icon: 'create', label: t('generatePrompt', language) },
            { key: 'analyze', icon: 'analytics', label: t('analyzePrompt', language) },
          ] as const).map(tab => (
            <Pressable
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && { backgroundColor: colors.primary },
              ]}
              onPress={() => { setActiveTab(tab.key); setResult(null); }}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.key ? '#fff' : colors.textSecondary}
              />
              <Text style={[
                styles.tabText,
                { color: colors.textSecondary },
                activeTab === tab.key && { color: '#fff' },
              ]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Description */}
        <Text style={[styles.desc, { color: colors.textMuted }]}>
          {activeTab === 'import' && t('smartImportDesc', language)}
          {activeTab === 'generate' && t('generateDesc', language)}
          {activeTab === 'analyze' && (language === 'ar' ? 'الصق برومبت لتحليل جودته والحصول على اقتراحات' : 'Paste a prompt to analyze its quality and get suggestions')}
        </Text>

        {/* Input */}
        <TextInput
          style={[styles.textArea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
          value={input}
          onChangeText={setInput}
          placeholder={activeTab === 'generate' ? t('describePrompt', language) : t('pastePrompt', language)}
          placeholderTextColor={colors.textMuted}
          multiline
          textAlignVertical="top"
        />

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.mainBtn, { backgroundColor: colors.primary }, (!input.trim() || loading) && { opacity: 0.5 }]}
            onPress={handleAction}
            disabled={!input.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="sparkles" size={18} color="#fff" />
            )}
            <Text style={styles.mainBtnText}>{getActionLabel()}</Text>
          </Pressable>

          {activeTab !== 'generate' && input.trim().length > 0 && (
            <Pressable
              style={[styles.secondaryBtn, { borderColor: colors.primary }]}
              onPress={handleImprove}
              disabled={loading}
            >
              <Ionicons name="arrow-up-circle" size={18} color={colors.primary} />
              <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>{t('improvePrompt', language)}</Text>
            </Pressable>
          )}
        </View>

        {/* Results */}
        {result && result.type === 'import' && (
          <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.resultTitle, { color: colors.text }]}>{t('aiSuggestion', language)}</Text>

            <View style={styles.resultField}>
              <Text style={[styles.resultLabel, { color: colors.textMuted }]}>{t('suggestedTitle', language)}</Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>{result.data.title}</Text>
            </View>

            <View style={styles.resultField}>
              <Text style={[styles.resultLabel, { color: colors.textMuted }]}>{t('suggestedCategory', language)}</Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>{result.data.category}</Text>
            </View>

            <View style={styles.resultField}>
              <Text style={[styles.resultLabel, { color: colors.textMuted }]}>{t('suggestedPlatform', language)}</Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>{result.data.platform}</Text>
            </View>

            {result.data.tags?.length > 0 && (
              <View style={styles.resultField}>
                <Text style={[styles.resultLabel, { color: colors.textMuted }]}>{t('suggestedTags', language)}</Text>
                <View style={styles.tagRow}>
                  {result.data.tags.map((tag: string, i: number) => (
                    <View key={i} style={[styles.tagChip, { backgroundColor: colors.primary + '15' }]}>
                      <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {result.data.variables?.length > 0 && (
              <View style={styles.resultField}>
                <Text style={[styles.resultLabel, { color: colors.textMuted }]}>{t('detectedVariables', language)}</Text>
                <View style={styles.tagRow}>
                  {result.data.variables.map((v: string, i: number) => (
                    <View key={i} style={[styles.tagChip, { backgroundColor: colors.warning + '15' }]}>
                      <Text style={{ color: colors.warning, fontSize: FONT_SIZE.xs }}>{`{{${v}}}`}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.resultField}>
              <Text style={[styles.resultLabel, { color: colors.textMuted }]}>{t('content', language)}</Text>
              <Text style={[styles.resultContent, { color: colors.text, backgroundColor: colors.background }]}>
                {result.data.content}
              </Text>
            </View>

            <Pressable style={[styles.acceptBtn, { backgroundColor: colors.success }]} onPress={handleAcceptAndSave}>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.acceptBtnText}>{t('acceptSuggestion', language)}</Text>
            </Pressable>
          </View>
        )}

        {result && result.type === 'generate' && (
          <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.resultTitle, { color: colors.text }]}>{t('aiSuggestion', language)}</Text>

            <View style={styles.resultField}>
              <Text style={[styles.resultLabel, { color: colors.textMuted }]}>{t('suggestedTitle', language)}</Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>{result.data.title}</Text>
            </View>

            <View style={styles.resultField}>
              <Text style={[styles.resultLabel, { color: colors.textMuted }]}>{t('content', language)}</Text>
              <Text style={[styles.resultContent, { color: colors.text, backgroundColor: colors.background }]}>
                {result.data.content}
              </Text>
            </View>

            <Pressable style={[styles.acceptBtn, { backgroundColor: colors.success }]} onPress={handleAcceptAndSave}>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.acceptBtnText}>{t('acceptSuggestion', language)}</Text>
            </Pressable>
          </View>
        )}

        {result && result.type === 'analyze' && (
          <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.resultTitle, { color: colors.text }]}>{t('promptAnalysis', language)}</Text>

            <View style={styles.scoreRow}>
              <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>{t('promptQuality', language)}</Text>
              <View style={[styles.scoreBadge, {
                backgroundColor: result.data.quality >= 7 ? colors.success + '20' : result.data.quality >= 4 ? colors.warning + '20' : colors.danger + '20',
              }]}>
                <Text style={{
                  fontSize: FONT_SIZE.xl,
                  fontWeight: '700',
                  color: result.data.quality >= 7 ? colors.success : result.data.quality >= 4 ? colors.warning : colors.danger,
                }}>
                  {result.data.quality}/10
                </Text>
              </View>
            </View>

            <View style={styles.resultField}>
              <Text style={[styles.resultLabel, { color: colors.textMuted }]}>
                {language === 'ar' ? 'التحليل' : 'Analysis'}
              </Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>{result.data.analysis}</Text>
            </View>

            {result.data.suggestions?.length > 0 && (
              <View style={styles.resultField}>
                <Text style={[styles.resultLabel, { color: colors.textMuted }]}>{t('suggestions', language)}</Text>
                {result.data.suggestions.map((s: string, i: number) => (
                  <View key={i} style={styles.suggestionItem}>
                    <Ionicons name="bulb-outline" size={14} color={colors.warning} />
                    <Text style={[styles.suggestionText, { color: colors.text }]}>{s}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1 },
  bodyContent: { padding: SPACING.lg, gap: SPACING.md },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxxl,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: FONT_SIZE.md,
    marginTop: SPACING.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  setupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xl,
  },
  setupBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.lg },
  tabRow: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    padding: SPACING.xs,
    gap: SPACING.xs,
    ...SHADOW.card,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  tabText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  desc: { fontSize: FONT_SIZE.sm, lineHeight: 20 },
  textArea: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    fontSize: FONT_SIZE.md,
    minHeight: 140,
    lineHeight: 22,
  },
  actionRow: { gap: SPACING.sm },
  mainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  mainBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.lg },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  secondaryBtnText: { fontWeight: '600', fontSize: FONT_SIZE.md },
  resultCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOW.card,
  },
  resultTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700', marginBottom: SPACING.md },
  resultField: { marginBottom: SPACING.md },
  resultLabel: { fontSize: FONT_SIZE.xs, fontWeight: '600', marginBottom: SPACING.xs, textTransform: 'uppercase' },
  resultValue: { fontSize: FONT_SIZE.md, lineHeight: 22 },
  resultContent: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 22,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  tagChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  tagText: { fontSize: FONT_SIZE.xs, fontWeight: '500' },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  scoreLabel: { fontSize: FONT_SIZE.lg, fontWeight: '600' },
  scoreBadge: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  suggestionText: { flex: 1, fontSize: FONT_SIZE.sm, lineHeight: 20 },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
  },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.lg },
});
