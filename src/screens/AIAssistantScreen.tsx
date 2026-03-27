import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator,
  FlatList, KeyboardAvoidingView, Platform, Keyboard, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants';
import { useThemeColors } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePromptStore } from '@/stores/promptStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { isAIConfigured, analyzePrompt, improvePrompt, smartImportPrompt, generatePrompt, callAIChat } from '@/engine/aiService';
import { pickAndReadFile } from '@/engine/importExport';
import { t } from '@/i18n/strings';
import type { PromptCategory, AIPlatform } from '@/types';

type TabType = 'chat' | 'import' | 'generate' | 'analyze';
interface ChatMessage { role: 'user' | 'assistant'; content: string; }

export default function AIAssistantScreen() {
  const language = useSettingsStore(s => s.language);
  const isRTL = useSettingsStore(s => s.isRTL);
  const navigate = useNavigationStore(s => s.navigate);
  const goBack = useNavigationStore(s => s.goBack);
  const addPrompt = usePromptStore(s => s.addPrompt);
  const colors = useThemeColors();

  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<FlatList>(null);
  const keyboardHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', e => {
      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height,
        duration: 200,
        useNativeDriver: false,
      }).start();
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
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

  const aiReady = isAIConfigured();

  const handleFileImport = async () => {
    try {
      const file = await pickAndReadFile();
      if (file) {
        setInput(file.content);
        Alert.alert(language === 'ar' ? 'تم التحميل' : 'Loaded', file.name);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to read file');
    }
  };

  const handleSmartImport = async () => {
    if (!input.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await smartImportPrompt(input.trim());
      setResult({ type: 'import', data: res });
    } catch (e: any) { Alert.alert('Error', e.message || 'Failed'); }
    setLoading(false);
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await generatePrompt(input.trim());
      setResult({ type: 'generate', data: res });
    } catch (e: any) { Alert.alert('Error', e.message || 'Failed'); }
    setLoading(false);
  };

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await analyzePrompt(input.trim());
      setResult({ type: 'analyze', data: res });
    } catch (e: any) { Alert.alert('Error', e.message || 'Failed'); }
    setLoading(false);
  };

  const handleImprove = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const improved = await improvePrompt(input.trim());
      setInput(improved); setResult(null);
    } catch (e: any) { Alert.alert('Error', e.message || 'Failed'); }
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
    setInput(''); setResult(null);
  };

  const extractTemplateJson = (text: string): { json: any; cleanText: string } | null => {
    const marker = '"action":"create_template"';
    const idx = text.indexOf(marker);
    if (idx === -1) return null;
    const start = text.lastIndexOf('{', idx);
    if (start === -1) return null;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\' && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          try {
            const json = JSON.parse(text.slice(start, i + 1));
            const cleanText = (text.slice(0, start) + text.slice(i + 1)).trim();
            return { json, cleanText };
          } catch {
            return null;
          }
        }
      }
    }
    return null;
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: chatInput.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setChatInput('');
    setLoading(true);
    try {
      const systemMsg = {
        role: 'system' as any,
        content: `You are Vibe, a helpful AI assistant specialized in prompt engineering. Help users create, improve, and understand AI prompts. If the user seems to want a prompt template, offer to create one. When you think a template should be created, include the following JSON at the end of your message on its own line: {"action":"create_template","title":"...","content":"...","category":"...","platform":"..."} Use {{variable_name}} syntax for variables.`
      };
      const allMsgs = [systemMsg, ...newMessages];
      const response = await callAIChat(allMsgs);

      const extracted = extractTemplateJson(response);
      if (extracted) {
        const { json: templateData, cleanText } = extracted;
        const displayText = cleanText + '\n\n' + (language === 'ar' ? '📋 اقترح قالبًا - هل تريد حفظه؟' : '📋 A template was suggested - save it?');
        setMessages(prev => [...prev, { role: 'assistant', content: displayText }]);
        Alert.alert(
          t('createTemplate', language),
          t('createTemplateFromChat', language),
          [
            { text: t('cancel', language), style: 'cancel' },
            {
              text: t('createTemplate', language),
              onPress: () => {
                addPrompt({
                  title: templateData.title || 'Chat Template',
                  content: templateData.content || '',
                  category: templateData.category || 'other',
                  platform: templateData.platform || 'chatgpt',
                  tags: [],
                });
                Alert.alert(language === 'ar' ? 'تم الحفظ!' : 'Saved!');
              }
            }
          ]
        );
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      }
    } catch (e: any) {
      const errMsg = language === 'ar' ? 'حدث خطأ في الاتصال بالذكاء الاصطناعي' : 'Failed to connect to AI';
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
    }
    setLoading(false);
  };

  const getActionLabel = () => {
    switch (activeTab) {
      case 'import': return loading ? t('importingSmartly', language) : t('smartImport', language);
      case 'generate': return loading ? t('generating', language) : t('generatePrompt', language);
      case 'analyze': return loading ? t('analyzing', language) : t('analyzePrompt', language);
      default: return '';
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
        <View style={[styles.aiHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }, isRTL && styles.aiHeaderRTL]}>
          <Pressable onPress={goBack} hitSlop={8}>
            <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.aiHeaderTitle, { color: colors.text }]}>{t('aiAssistant', language)}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="sparkles-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{t('noAIProvider', language)}</Text>
          <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>{t('noAIProviderDesc', language)}</Text>
          <Pressable style={[styles.setupBtn, { backgroundColor: colors.primary }]} onPress={() => navigate('AISettings')}>
            <Ionicons name="settings-outline" size={18} color="#fff" />
            <Text style={styles.setupBtnText}>{t('configureAI', language)}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const ContainerView = Platform.OS === 'ios' ? KeyboardAvoidingView : View;
  const containerProps = Platform.OS === 'ios' ? { behavior: 'padding' as const, keyboardVerticalOffset: 0 } : {};

  return (
    <ContainerView
      style={[styles.container, { backgroundColor: colors.background }]}
      {...containerProps}
    >
      {/* Header with back button */}
      <View style={[styles.aiHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }, isRTL && styles.aiHeaderRTL]}>
        <Pressable onPress={goBack} hitSlop={8}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.aiHeaderTitle, { color: colors.text }]}>{t('aiAssistant', language)}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tab Selector */}
      <View style={[styles.tabRow, { backgroundColor: colors.card }]}>
        {([
          { key: 'chat', icon: 'chatbubbles', label: t('freeChat', language) },
          { key: 'import', icon: 'cloud-download', label: t('smartImport', language) },
          { key: 'generate', icon: 'create', label: t('generatePrompt', language) },
          { key: 'analyze', icon: 'analytics', label: t('analyzePrompt', language) },
        ] as const).map(tab => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && { backgroundColor: colors.primary }]}
            onPress={() => { setActiveTab(tab.key); setResult(null); }}
          >
            <Ionicons name={tab.icon as any} size={14} color={activeTab === tab.key ? '#fff' : colors.textSecondary} />
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === tab.key && { color: '#fff' }]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Chat View */}
      {activeTab === 'chat' ? (
        <View style={styles.chatContainer}>
          <FlatList
            ref={chatScrollRef}
            data={messages}
            keyExtractor={(_, i) => i.toString()}
            style={styles.chatList}
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={() => chatScrollRef.current?.scrollToEnd()}
            ListEmptyComponent={
              <View style={styles.chatEmpty}>
                <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.chatEmptyText, { color: colors.textMuted }]}>
                  {t('chatPlaceholder', language)}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={[
                styles.chatBubble,
                item.role === 'user'
                  ? [styles.userBubble, { backgroundColor: colors.primary }]
                  : [styles.aiBubble, { backgroundColor: colors.card }],
              ]}>
                {item.role === 'assistant' && (
                  <Ionicons name="sparkles" size={14} color={colors.primary} style={{ marginBottom: 4 }} />
                )}
                <Text style={[
                  styles.chatBubbleText,
                  { color: item.role === 'user' ? '#fff' : colors.text },
                ]}>
                  {item.content}
                </Text>
              </View>
            )}
          />
          <View style={[styles.chatInputRow, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <TextInput
              style={[styles.chatTextInput, { color: colors.text, backgroundColor: colors.background }]}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder={t('chatPlaceholder', language)}
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <Pressable
              style={[styles.sendBtn, { backgroundColor: colors.primary }, (!chatInput.trim() || loading) && { opacity: 0.5 }]}
              onPress={handleSendChat}
              disabled={!chatInput.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </Pressable>
          </View>
          {Platform.OS === 'android' && (
            <Animated.View style={{ height: keyboardHeight, backgroundColor: colors.card }} />
          )}
        </View>
      ) : (
        /* Tools View */
        <ScrollView style={styles.toolBody} contentContainerStyle={styles.toolContent} keyboardShouldPersistTaps="handled">
          {/* Description */}
          <Text style={[styles.desc, { color: colors.textMuted }]}>
            {activeTab === 'import' && t('smartImportDesc', language)}
            {activeTab === 'generate' && t('generateDesc', language)}
            {activeTab === 'analyze' && (language === 'ar' ? 'الصق برومبت لتحليل جودته والحصول على اقتراحات' : 'Paste a prompt to analyze its quality and get suggestions')}
          </Text>

          {/* File import button */}
          <Pressable style={[styles.fileBtn, { borderColor: colors.border }]} onPress={handleFileImport}>
            <Ionicons name="document-attach-outline" size={18} color={colors.primary} />
            <Text style={[styles.fileBtnText, { color: colors.primary }]}>{t('importFile', language)}</Text>
            <Text style={[styles.fileBtnHint, { color: colors.textMuted }]}>{t('supportedFiles', language)}</Text>
          </Pressable>

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
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="sparkles" size={18} color="#fff" />}
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
          {result && (result.type === 'import' || result.type === 'generate') && (
            <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.resultTitle, { color: colors.text }]}>{t('aiSuggestion', language)}</Text>

              {result.data.title && (
                <View style={styles.resultField}>
                  <Text style={[styles.resultLabel, { color: colors.textMuted }]}>{t('suggestedTitle', language)}</Text>
                  <Text style={[styles.resultValue, { color: colors.text }]}>{result.data.title}</Text>
                </View>
              )}

              {result.data.category && (
                <View style={styles.resultField}>
                  <Text style={[styles.resultLabel, { color: colors.textMuted }]}>{t('suggestedCategory', language)}</Text>
                  <Text style={[styles.resultValue, { color: colors.text }]}>{result.data.category}</Text>
                </View>
              )}

              {result.data.tags?.length > 0 && (
                <View style={styles.resultField}>
                  <Text style={[styles.resultLabel, { color: colors.textMuted }]}>{t('suggestedTags', language)}</Text>
                  <View style={styles.tagRow}>
                    {result.data.tags.map((tag: string, i: number) => (
                      <View key={i} style={[styles.tagChip, { backgroundColor: colors.primary + '15' }]}>
                        <Text style={[styles.tagChipText, { color: colors.primary }]}>#{tag}</Text>
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

          {result && result.type === 'analyze' && (
            <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.resultTitle, { color: colors.text }]}>{t('promptAnalysis', language)}</Text>

              <View style={styles.scoreRow}>
                <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>{t('promptQuality', language)}</Text>
                <View style={[styles.scoreBadge, {
                  backgroundColor: result.data.quality >= 7 ? colors.success + '20' : result.data.quality >= 4 ? colors.warning + '20' : colors.danger + '20',
                }]}>
                  <Text style={{
                    fontSize: FONT_SIZE.xl, fontWeight: '700',
                    color: result.data.quality >= 7 ? colors.success : result.data.quality >= 4 ? colors.warning : colors.danger,
                  }}>
                    {result.data.quality}/10
                  </Text>
                </View>
              </View>

              <View style={styles.resultField}>
                <Text style={[styles.resultLabel, { color: colors.textMuted }]}>{language === 'ar' ? 'التحليل' : 'Analysis'}</Text>
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
      )}
    </ContainerView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  aiHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  aiHeaderRTL: { flexDirection: 'row-reverse' },
  aiHeaderTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xxxl },
  emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: '600', marginTop: SPACING.lg, textAlign: 'center' },
  emptyDesc: { fontSize: FONT_SIZE.md, marginTop: SPACING.sm, textAlign: 'center', lineHeight: 22 },
  setupBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.md, marginTop: SPACING.xl,
  },
  setupBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.lg },
  tabRow: {
    flexDirection: 'row', padding: SPACING.xs, gap: SPACING.xs,
    marginHorizontal: SPACING.lg, marginTop: SPACING.md, borderRadius: RADIUS.lg, ...SHADOW.card,
  },
  tab: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2,
    paddingVertical: SPACING.sm, borderRadius: RADIUS.md,
  },
  tabText: { fontSize: 10, fontWeight: '600' },

  // Chat styles
  chatContainer: { flex: 1 },
  chatList: { flex: 1 },
  chatContent: { padding: SPACING.lg, gap: SPACING.md },
  chatEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  chatEmptyText: { fontSize: FONT_SIZE.md, marginTop: SPACING.md, textAlign: 'center' },
  chatBubble: { maxWidth: '85%', padding: SPACING.md, borderRadius: RADIUS.lg },
  userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: SPACING.xs },
  aiBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: SPACING.xs, ...SHADOW.card },
  chatBubbleText: { fontSize: FONT_SIZE.md, lineHeight: 22 },
  chatInputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm,
    padding: SPACING.md, borderTopWidth: StyleSheet.hairlineWidth,
  },
  chatTextInput: {
    flex: 1, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm, fontSize: FONT_SIZE.md, maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },

  // Tools styles
  toolBody: { flex: 1 },
  toolContent: { padding: SPACING.lg, gap: SPACING.md },
  desc: { fontSize: FONT_SIZE.sm, lineHeight: 20 },
  fileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderStyle: 'dashed',
  },
  fileBtnText: { fontWeight: '600', fontSize: FONT_SIZE.sm },
  fileBtnHint: { fontSize: FONT_SIZE.xs, marginLeft: 'auto' },
  textArea: {
    borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.lg,
    fontSize: FONT_SIZE.md, minHeight: 140, lineHeight: 22,
  },
  actionRow: { gap: SPACING.sm },
  mainBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.md, borderRadius: RADIUS.md,
  },
  mainBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.lg },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1,
  },
  secondaryBtnText: { fontWeight: '600', fontSize: FONT_SIZE.md },
  resultCard: { borderRadius: RADIUS.lg, padding: SPACING.lg, ...SHADOW.card },
  resultTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700', marginBottom: SPACING.md },
  resultField: { marginBottom: SPACING.md },
  resultLabel: { fontSize: FONT_SIZE.xs, fontWeight: '600', marginBottom: SPACING.xs, textTransform: 'uppercase' },
  resultValue: { fontSize: FONT_SIZE.md, lineHeight: 22 },
  resultContent: { fontSize: FONT_SIZE.sm, lineHeight: 22, padding: SPACING.md, borderRadius: RADIUS.md },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  tagChip: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full },
  tagChipText: { fontSize: FONT_SIZE.xs, fontWeight: '500' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
  scoreLabel: { fontSize: FONT_SIZE.lg, fontWeight: '600' },
  scoreBadge: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.lg },
  suggestionItem: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginTop: SPACING.sm },
  suggestionText: { flex: 1, fontSize: FONT_SIZE.sm, lineHeight: 20 },
  acceptBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.md, borderRadius: RADIUS.md, marginTop: SPACING.md,
  },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.lg },
});
