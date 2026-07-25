import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator,
  FlatList, KeyboardAvoidingView, Platform, Keyboard, Animated, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants';
import { useThemeColors } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePromptStore } from '@/stores/promptStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useChatStore } from '@/stores/chatStore';
import { useHistoryStore } from '@/stores/historyStore';
import { isAIConfigured, analyzePrompt, improvePrompt, smartImportPrompt, generatePrompt } from '@/engine/aiService';
import { pickAndReadFile } from '@/engine/importExport';
import { extractVariables, buildFinalPrompt, hasVariables } from '@/engine/variableParser';
import { copyToClipboard } from '@/utils/clipboard';
import { getDatabase } from '@/database/connection';
import * as queries from '@/database/queries';
import { t } from '@/i18n/strings';
import type { PromptCategory, AIPlatform, VibeNote, ChatMessage } from '@/types';

type TabType = 'chat' | 'import' | 'generate' | 'analyze';

/** Finds the {"action":"create_template",...} block a reply may carry */
function extractTemplateJson(text: string): { json: any; cleanText: string } | null {
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
}

function displayContent(content: string): string {
  const extracted = extractTemplateJson(content);
  return extracted ? extracted.cleanText : content;
}

// Module-level so navigating away (e.g. "save as prompt") and back does not
// re-run the seed: the restored history entry carries the same nonce.
let lastSeedNonce: string | null = null;

export default function AIAssistantScreen() {
  const language = useSettingsStore(s => s.language);
  const isRTL = useSettingsStore(s => s.isRTL);
  const navigate = useNavigationStore(s => s.navigate);
  const goBack = useNavigationStore(s => s.goBack);
  const seedPrompt = useNavigationStore(s => s.params.seedPrompt);
  const seedPromptId = useNavigationStore(s => s.params.seedPromptId);
  const seedNonce = useNavigationStore(s => s.params.seedNonce);
  const aiProviders = useSettingsStore(s => s.aiProviders);
  const activeAIProvider = useSettingsStore(s => s.activeAIProvider);
  const addPrompt = usePromptStore(s => s.addPrompt);
  const incrementUsage = usePromptStore(s => s.incrementUsage);
  const addHistory = useHistoryStore(s => s.addHistory);
  const colors = useThemeColors();

  // Chat store
  const sessions = useChatStore(s => s.sessions);
  const activeSessionId = useChatStore(s => s.activeSessionId);
  const messages = useChatStore(s => s.messages);
  const sending = useChatStore(s => s.sending);
  const loadSessions = useChatStore(s => s.loadSessions);
  const newSession = useChatStore(s => s.newSession);
  const closeSession = useChatStore(s => s.closeSession);
  const openSession = useChatStore(s => s.openSession);
  const deleteSession = useChatStore(s => s.deleteSession);
  const togglePinSession = useChatStore(s => s.togglePinSession);
  const setSessionContexts = useChatStore(s => s.setSessionContexts);
  const sendMessage = useChatStore(s => s.sendMessage);
  const regenerateLast = useChatStore(s => s.regenerateLast);

  const activeProvider = aiProviders.find(p => p.id === activeAIProvider);
  const activeSession = sessions.find(s => s.id === activeSessionId);

  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<FlatList>(null);
  const keyboardHeight = useRef(new Animated.Value(0)).current;

  // Modals
  const [showPromptPicker, setShowPromptPicker] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [showContexts, setShowContexts] = useState(false);
  const [pickerPrompts, setPickerPrompts] = useState<VibeNote[]>([]);
  const [contextItems, setContextItems] = useState<VibeNote[]>([]);
  // Inline variable-filling step inside the prompt picker
  const [fillingPrompt, setFillingPrompt] = useState<VibeNote | null>(null);
  const [fillValues, setFillValues] = useState<Record<string, string>>({});
  // Contexts chosen before the session exists (applied on first send)
  const [pendingContextIds, setPendingContextIds] = useState<string[]>([]);

  const sessionContextIds = activeSession ? activeSession.contextIds : pendingContextIds;

  const chatSuggestions = language === 'ar'
    ? ['اكتب لي برومبت احترافي عن…', 'حسّن هذا البرومبت', 'اشرح كيف أكتب برومبت أفضل', 'حوّل فكرتي إلى قالب متغيّرات']
    : language === 'fr'
      ? ['Écris-moi un prompt pro sur…', 'Améliore ce prompt', 'Explique comment mieux écrire un prompt', 'Transforme mon idée en modèle']
      : ['Write me a pro prompt about…', 'Improve this prompt', 'Explain how to write a better prompt', 'Turn my idea into a template'];

  useEffect(() => { loadSessions(); }, []);

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

  // ---- Chain suggestions: linked prompts of the last prompt used in this chat ----
  const lastPromptId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].promptId) return messages[i].promptId!;
    }
    return null;
  }, [messages]);

  const chainPrompts = useMemo(() => {
    if (!lastPromptId) return [];
    try {
      const db = getDatabase();
      const source = queries.getPromptById(db, lastPromptId);
      if (!source || source.linkedIds.length === 0) return [];
      return queries.getPromptsByIds(db, source.linkedIds);
    } catch {
      return [];
    }
  }, [lastPromptId, messages.length]);

  const contextTitles = useMemo(() => {
    if (sessionContextIds.length === 0) return [];
    try {
      return queries.getPromptsByIds(getDatabase(), sessionContextIds);
    } catch {
      return [];
    }
  }, [sessionContextIds]);

  const showAIError = (e: any) => {
    Alert.alert(t('aiError', language), e?.message || '');
  };

  /** A reply is still streaming in: block the action honestly instead of dropping it */
  const ensureNotSending = (): boolean => {
    if (useChatStore.getState().sending) {
      Alert.alert(t('waitForReply', language));
      return false;
    }
    return true;
  };

  const maybeOfferTemplate = (response: string) => {
    const extracted = extractTemplateJson(response);
    if (!extracted) return;
    const { json: templateData } = extracted;
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
            Alert.alert(t('saved', language));
          }
        }
      ]
    );
  };

  const doSend = (text: string, opts?: { promptId?: string }) => {
    if (!ensureNotSending()) return;
    if (!activeSessionId && pendingContextIds.length > 0) {
      newSession(pendingContextIds);
      setPendingContextIds([]);
    }
    setChatInput('');
    sendMessage(text, opts)
      .then(response => { if (response) maybeOfferTemplate(response); })
      .catch(showAIError);
  };

  // Opened from a prompt ("Chat with AI"): fresh session, prompt contexts attached, run it
  useEffect(() => {
    const nonce = seedNonce || seedPrompt || null;
    if (seedPrompt && nonce && lastSeedNonce !== nonce) {
      if (useChatStore.getState().sending) {
        // A previous reply is still in flight: don't consume the nonce or
        // create an orphan session — surface it instead of dropping the seed
        setActiveTab('chat');
        Alert.alert(t('waitForReply', language));
        return;
      }
      lastSeedNonce = nonce;
      setActiveTab('chat');
      let seedContextIds: string[] = [];
      if (seedPromptId) {
        try {
          seedContextIds = queries.getPromptById(getDatabase(), seedPromptId)?.contextIds ?? [];
        } catch {}
      }
      newSession(seedContextIds);
      sendMessage(seedPrompt, { promptId: seedPromptId })
        .then(response => { if (response) maybeOfferTemplate(response); })
        .catch(showAIError);
    }
  }, [seedPrompt, seedNonce]);

  // ---- Prompt attach / chain running ----
  const openPromptPicker = () => {
    try {
      setPickerPrompts(queries.getAllPrompts(getDatabase(), { kind: 'prompt' }));
    } catch {
      setPickerPrompts([]);
    }
    setFillingPrompt(null);
    setShowPromptPicker(true);
  };

  const startPromptRun = (prompt: VibeNote) => {
    if (hasVariables(prompt.content)) {
      // Reached directly from a chain chip too, where the picker list was
      // never loaded — load it so the back arrow shows the full list
      if (pickerPrompts.length === 0) {
        try {
          setPickerPrompts(queries.getAllPrompts(getDatabase(), { kind: 'prompt' }));
        } catch {}
      }
      const defaults: Record<string, string> = {};
      for (const v of extractVariables(prompt.content)) {
        defaults[v.name] = v.defaultValue || '';
      }
      setFillValues(defaults);
      setFillingPrompt(prompt);
      setShowPromptPicker(true);
    } else {
      if (!ensureNotSending()) return;
      setShowPromptPicker(false);
      incrementUsage(prompt.id);
      doSend(prompt.content, { promptId: prompt.id });
    }
  };

  const sendFilledPrompt = () => {
    if (!fillingPrompt) return;
    if (!ensureNotSending()) return;
    const final = buildFinalPrompt(fillingPrompt.content, fillValues);
    incrementUsage(fillingPrompt.id);
    addHistory({
      promptId: fillingPrompt.id,
      promptTitle: fillingPrompt.title,
      values: { ...fillValues },
      timestamp: Date.now(),
    });
    setShowPromptPicker(false);
    setFillingPrompt(null);
    doSend(final, { promptId: fillingPrompt.id });
  };

  // ---- Contexts ----
  const openContextPicker = () => {
    try {
      setContextItems(queries.getAllPrompts(getDatabase(), { kind: 'context' }));
    } catch {
      setContextItems([]);
    }
    setShowContexts(true);
  };

  const toggleContext = (id: string) => {
    const current = sessionContextIds;
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    if (activeSessionId) {
      setSessionContexts(next);
    } else {
      setPendingContextIds(next);
    }
  };

  // ---- Message actions ----
  const handleCopyMessage = async (content: string) => {
    await copyToClipboard(displayContent(content));
    Alert.alert(t('copied', language));
  };

  const handleSaveAsNote = (content: string) => {
    const text = displayContent(content);
    const titleWords = text.trim().split(/\s+/).slice(0, 6).join(' ');
    addPrompt({
      kind: 'note',
      title: titleWords.length > 60 ? titleWords.slice(0, 57) + '…' : titleWords,
      content: text,
      category: 'other',
      platform: 'other',
      tags: ['chat'],
    });
    Alert.alert(t('savedAsNote', language));
  };

  const handleSaveAsPrompt = (content: string) => {
    navigate('CreatePrompt', { prefillContent: displayContent(content), prefillKind: 'prompt' });
  };

  const handleNewChat = () => {
    // No DB row yet — the session is created lazily on the first message,
    // so abandoned "new chats" never pile up in the history list
    closeSession();
    setPendingContextIds([]);
  };

  // ---- Tool tabs (unchanged behavior) ----
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
    Alert.alert(t('saved', language));
    setInput(''); setResult(null);
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

  const lastAssistantId = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return messages[i].id;
    }
    return null;
  })();

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[
      styles.chatBubble,
      item.role === 'user'
        ? [styles.userBubble, { backgroundColor: colors.primary }]
        : [styles.aiBubble, { backgroundColor: colors.card }],
    ]}>
      {item.role === 'assistant' && (
        <View style={[styles.aiBubbleLabel, isRTL && styles.aiHeaderRTL]}>
          <Ionicons name="sparkles" size={12} color={colors.primary} />
          <Text style={[styles.aiBubbleLabelText, { color: colors.primary }]}>Vibe</Text>
        </View>
      )}
      {item.role === 'user' && item.promptId && (
        <View style={[styles.aiBubbleLabel, isRTL && styles.aiHeaderRTL]}>
          <Ionicons name="flash" size={12} color="rgba(255,255,255,0.85)" />
          <Text style={[styles.aiBubbleLabelText, { color: 'rgba(255,255,255,0.85)' }]}>
            {t('kindPrompt', language)}
          </Text>
        </View>
      )}
      <Pressable onLongPress={() => handleCopyMessage(item.content)}>
        <Text style={[
          styles.chatBubbleText,
          { color: item.role === 'user' ? '#fff' : colors.text },
          isRTL && styles.inputRTL,
        ]}>
          {displayContent(item.content)}
        </Text>
      </Pressable>
      {item.role === 'assistant' && (
        <View style={[styles.msgActions, { borderTopColor: colors.border }, isRTL && styles.aiHeaderRTL]}>
          <Pressable onPress={() => handleCopyMessage(item.content)} hitSlop={6} style={styles.msgActionBtn}>
            <Ionicons name="copy-outline" size={15} color={colors.textMuted} />
          </Pressable>
          <Pressable onPress={() => handleSaveAsNote(item.content)} hitSlop={6} style={styles.msgActionBtn}>
            <Ionicons name="reader-outline" size={15} color={colors.textMuted} />
          </Pressable>
          <Pressable onPress={() => handleSaveAsPrompt(item.content)} hitSlop={6} style={styles.msgActionBtn}>
            <Ionicons name="bookmark-outline" size={15} color={colors.textMuted} />
          </Pressable>
          {item.id === lastAssistantId && !sending && (
            <Pressable onPress={() => { regenerateLast().catch(showAIError); }} hitSlop={6} style={styles.msgActionBtn}>
              <Ionicons name="refresh-outline" size={15} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );

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
          {/* Assistant identity + session controls */}
          <View style={[styles.assistantBar, { borderBottomColor: colors.border }, isRTL && styles.aiHeaderRTL]}>
            <View style={[styles.assistantBadge, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name="sparkles" size={14} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.assistantName, { color: colors.text }, isRTL && styles.inputRTL]} numberOfLines={1}>
                {activeSession && messages.length > 0 ? activeSession.title : 'Vibe AI'}
              </Text>
              {activeProvider && (
                <Text style={[styles.assistantMeta, { color: colors.textMuted }, isRTL && styles.inputRTL]} numberOfLines={1}>
                  {activeProvider.name}{activeProvider.model ? ` · ${activeProvider.model}` : ''}
                </Text>
              )}
            </View>
            <Pressable onPress={openContextPicker} hitSlop={8} style={styles.headerIconBtn}>
              <Ionicons name="layers-outline" size={20} color={sessionContextIds.length > 0 ? colors.primary : colors.textMuted} />
              {sessionContextIds.length > 0 && (
                <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.countBadgeText}>{sessionContextIds.length}</Text>
                </View>
              )}
            </Pressable>
            <Pressable onPress={() => setShowSessions(true)} hitSlop={8} style={styles.headerIconBtn}>
              <Ionicons name="time-outline" size={20} color={colors.textMuted} />
            </Pressable>
            {messages.length > 0 && (
              <Pressable onPress={handleNewChat} hitSlop={8} style={styles.headerIconBtn}>
                <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
              </Pressable>
            )}
          </View>

          {/* Attached contexts chips */}
          {contextTitles.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.contextChipsBar, { borderBottomColor: colors.border }]}
              contentContainerStyle={styles.contextChipsContent}
            >
              {contextTitles.map(ctx => (
                <View key={ctx.id} style={[styles.contextChip, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
                  <Ionicons name="layers" size={11} color={colors.primary} />
                  <Text style={[styles.contextChipText, { color: colors.primary }]} numberOfLines={1}>{ctx.title}</Text>
                  <Pressable onPress={() => toggleContext(ctx.id)} hitSlop={6}>
                    <Ionicons name="close" size={12} color={colors.primary} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}

          <FlatList
            ref={chatScrollRef}
            data={messages}
            keyExtractor={item => item.id}
            style={styles.chatList}
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={() => chatScrollRef.current?.scrollToEnd()}
            ListEmptyComponent={
              <View style={styles.chatEmpty}>
                <View style={[styles.chatEmptyIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="sparkles" size={32} color={colors.primary} />
                </View>
                <Text style={[styles.chatEmptyTitle, { color: colors.text }]}>
                  {language === 'ar' ? 'ابدأ محادثة مع Vibe' : language === 'fr' ? 'Discutez avec Vibe' : 'Chat with Vibe'}
                </Text>
                <Text style={[styles.chatEmptyText, { color: colors.textMuted }]}>
                  {t('chatPlaceholder', language)}
                </Text>
                <View style={styles.suggestionWrap}>
                  {chatSuggestions.map((s, i) => (
                    <Pressable
                      key={i}
                      style={[styles.suggestionChip, { borderColor: colors.border, backgroundColor: colors.card }]}
                      onPress={() => setChatInput(s)}
                    >
                      <Text style={[styles.suggestionChipText, { color: colors.textSecondary }]}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            }
            ListFooterComponent={
              sending && messages.length > 0 && messages[messages.length - 1].role === 'user' ? (
                <View style={[styles.chatBubble, styles.aiBubble, { backgroundColor: colors.card }]}>
                  <View style={[styles.typingRow, isRTL && styles.aiHeaderRTL]}>
                    <Ionicons name="sparkles" size={14} color={colors.primary} />
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                </View>
              ) : null
            }
            renderItem={renderMessage}
          />

          {/* Next-step chain suggestions (linked prompts of the last used prompt) */}
          {chainPrompts.length > 0 && !sending && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.chainBar, { borderTopColor: colors.border }]}
              contentContainerStyle={styles.chainBarContent}
            >
              <View style={[styles.chainLabel, isRTL && styles.aiHeaderRTL]}>
                <Ionicons name="git-branch-outline" size={13} color={colors.textMuted} />
                <Text style={[styles.chainLabelText, { color: colors.textMuted }]}>{t('nextStep', language)}</Text>
              </View>
              {chainPrompts.map(p => (
                <Pressable
                  key={p.id}
                  style={[styles.chainChip, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}
                  onPress={() => startPromptRun(p)}
                >
                  <Ionicons name="flash-outline" size={12} color={colors.primary} />
                  <Text style={[styles.chainChipText, { color: colors.primary }]} numberOfLines={1}>{p.title}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          <View style={[styles.chatInputRow, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <Pressable
              style={[styles.chainBtn, { borderColor: colors.border }]}
              onPress={openPromptPicker}
              hitSlop={6}
              accessibilityLabel={t('addPromptToChat', language)}
            >
              <Ionicons name="flash-outline" size={20} color={colors.primary} />
            </Pressable>
            <TextInput
              style={[styles.chatTextInput, { color: colors.text, backgroundColor: colors.background }, isRTL && styles.inputRTL]}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder={t('chatPlaceholder', language)}
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />
            <Pressable
              style={[styles.sendBtn, { backgroundColor: colors.primary }, (!chatInput.trim() || sending) && { opacity: 0.5 }]}
              onPress={() => { const text = chatInput.trim(); if (text) doSend(text); }}
              disabled={!chatInput.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </Pressable>
          </View>
          {Platform.OS === 'android' && (
            <Animated.View style={{ height: keyboardHeight, backgroundColor: colors.card }} />
          )}

          {/* Prompt picker: run a saved prompt in this conversation (with variable filling) */}
          <Modal visible={showPromptPicker} transparent animationType="slide" onRequestClose={() => setShowPromptPicker(false)}>
            <Pressable style={[styles.pickerOverlay, { backgroundColor: colors.overlay }]} onPress={() => setShowPromptPicker(false)}>
              <Pressable style={[styles.pickerSheet, { backgroundColor: colors.card }]} onPress={() => {}}>
                <View style={[styles.pickerHeader, isRTL && styles.aiHeaderRTL]}>
                  {fillingPrompt ? (
                    <Pressable onPress={() => setFillingPrompt(null)} hitSlop={8}>
                      <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={22} color={colors.text} />
                    </Pressable>
                  ) : null}
                  <Text style={[styles.pickerTitle, { color: colors.text }]} numberOfLines={1}>
                    {fillingPrompt ? fillingPrompt.title : t('addPromptToChat', language)}
                  </Text>
                  <Pressable onPress={() => setShowPromptPicker(false)} hitSlop={8}>
                    <Ionicons name="close" size={22} color={colors.text} />
                  </Pressable>
                </View>
                {fillingPrompt ? (
                  <>
                    <ScrollView style={{ maxHeight: 340 }} contentContainerStyle={styles.fillBody} keyboardShouldPersistTaps="handled">
                      {extractVariables(fillingPrompt.content).map(v => (
                        <View key={v.name} style={styles.fillField}>
                          <Text style={[styles.fillLabel, { color: colors.text }, isRTL && styles.inputRTL]}>
                            {v.name.replace(/_/g, ' ')}
                          </Text>
                          {v.type === 'select' && v.options ? (
                            <View style={styles.fillOptions}>
                              {v.options.map(opt => (
                                <Pressable
                                  key={opt}
                                  style={[
                                    styles.fillOptionChip,
                                    { borderColor: colors.border, backgroundColor: colors.background },
                                    fillValues[v.name] === opt && { backgroundColor: colors.primary, borderColor: colors.primary },
                                  ]}
                                  onPress={() => setFillValues(prev => ({ ...prev, [v.name]: opt }))}
                                >
                                  <Text style={[
                                    styles.fillOptionText, { color: colors.text },
                                    fillValues[v.name] === opt && { color: '#fff', fontWeight: '600' },
                                  ]}>
                                    {opt}
                                  </Text>
                                </Pressable>
                              ))}
                            </View>
                          ) : (
                            <TextInput
                              style={[styles.fillInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }, isRTL && styles.inputRTL]}
                              value={fillValues[v.name] || ''}
                              onChangeText={text => setFillValues(prev => ({ ...prev, [v.name]: text }))}
                              placeholder={v.defaultValue || v.name}
                              placeholderTextColor={colors.textMuted}
                              multiline
                              textAlignVertical="top"
                            />
                          )}
                        </View>
                      ))}
                    </ScrollView>
                    <View style={styles.fillActions}>
                      <Pressable style={[styles.fillSendBtn, { backgroundColor: colors.primary }]} onPress={sendFilledPrompt}>
                        <Ionicons name="send" size={16} color="#fff" />
                        <Text style={styles.fillSendText}>{t('sendToChat', language)}</Text>
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <FlatList
                    data={pickerPrompts}
                    keyExtractor={item => item.id}
                    style={{ maxHeight: 360 }}
                    ListEmptyComponent={
                      <Text style={[styles.pickerEmpty, { color: colors.textMuted }]}>{t('noPrompts', language)}</Text>
                    }
                    renderItem={({ item }) => (
                      <Pressable
                        style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                        onPress={() => startPromptRun(item)}
                      >
                        <View style={[styles.pickerItemRow, isRTL && styles.aiHeaderRTL]}>
                          <Text style={[styles.pickerItemTitle, { color: colors.text }, isRTL && styles.inputRTL]} numberOfLines={1}>
                            {item.title}
                          </Text>
                          {hasVariables(item.content) && (
                            <Ionicons name="options-outline" size={14} color={colors.primary} />
                          )}
                        </View>
                        <Text style={[styles.pickerItemPreview, { color: colors.textMuted }, isRTL && styles.inputRTL]} numberOfLines={2}>
                          {item.content}
                        </Text>
                      </Pressable>
                    )}
                  />
                )}
              </Pressable>
            </Pressable>
          </Modal>

          {/* Chat sessions (history) */}
          <Modal visible={showSessions} transparent animationType="slide" onRequestClose={() => setShowSessions(false)}>
            <Pressable style={[styles.pickerOverlay, { backgroundColor: colors.overlay }]} onPress={() => setShowSessions(false)}>
              <Pressable style={[styles.pickerSheet, { backgroundColor: colors.card }]} onPress={() => {}}>
                <View style={[styles.pickerHeader, isRTL && styles.aiHeaderRTL]}>
                  <Text style={[styles.pickerTitle, { color: colors.text }]}>{t('chats', language)}</Text>
                  <Pressable onPress={() => setShowSessions(false)} hitSlop={8}>
                    <Ionicons name="close" size={22} color={colors.text} />
                  </Pressable>
                </View>
                <Pressable
                  style={[styles.newChatBtn, { borderColor: colors.primary }]}
                  onPress={() => { setShowSessions(false); handleNewChat(); }}
                >
                  <Ionicons name="add" size={16} color={colors.primary} />
                  <Text style={[styles.newChatBtnText, { color: colors.primary }]}>{t('newChat', language)}</Text>
                </Pressable>
                <FlatList
                  data={sessions}
                  keyExtractor={item => item.id}
                  style={{ maxHeight: 360 }}
                  ListEmptyComponent={
                    <Text style={[styles.pickerEmpty, { color: colors.textMuted }]}>{t('noChats', language)}</Text>
                  }
                  renderItem={({ item }) => (
                    <Pressable
                      style={[
                        styles.pickerItem, { borderBottomColor: colors.border },
                        item.id === activeSessionId && { backgroundColor: colors.primary + '0A' },
                      ]}
                      onPress={() => { openSession(item.id); setShowSessions(false); }}
                    >
                      <View style={[styles.pickerItemRow, isRTL && styles.aiHeaderRTL]}>
                        <Text style={[styles.pickerItemTitle, { color: colors.text }, isRTL && styles.inputRTL]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <View style={[styles.sessionActions, isRTL && styles.aiHeaderRTL]}>
                          <Pressable onPress={() => togglePinSession(item.id)} hitSlop={8}>
                            <Ionicons name={item.isPinned ? 'pin' : 'pin-outline'} size={16} color={item.isPinned ? colors.primary : colors.textMuted} />
                          </Pressable>
                          <Pressable
                            onPress={() => {
                              Alert.alert(
                                t('delete', language),
                                t('deleteChatConfirm', language),
                                [
                                  { text: t('cancel', language), style: 'cancel' },
                                  { text: t('delete', language), style: 'destructive', onPress: () => deleteSession(item.id) },
                                ]
                              );
                            }}
                            hitSlop={8}
                          >
                            <Ionicons name="trash-outline" size={16} color={colors.danger} />
                          </Pressable>
                        </View>
                      </View>
                      <Text style={[styles.pickerItemPreview, { color: colors.textMuted }, isRTL && styles.inputRTL]} numberOfLines={1}>
                        {new Date(item.updatedAt).toLocaleDateString()} · {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </Pressable>
                  )}
                />
              </Pressable>
            </Pressable>
          </Modal>

          {/* Context picker: attach reusable context blocks to this conversation */}
          <Modal visible={showContexts} transparent animationType="slide" onRequestClose={() => setShowContexts(false)}>
            <Pressable style={[styles.pickerOverlay, { backgroundColor: colors.overlay }]} onPress={() => setShowContexts(false)}>
              <Pressable style={[styles.pickerSheet, { backgroundColor: colors.card }]} onPress={() => {}}>
                <View style={[styles.pickerHeader, isRTL && styles.aiHeaderRTL]}>
                  <Text style={[styles.pickerTitle, { color: colors.text }]}>{t('attachContexts', language)}</Text>
                  <Pressable onPress={() => setShowContexts(false)} hitSlop={8}>
                    <Ionicons name="close" size={22} color={colors.text} />
                  </Pressable>
                </View>
                <FlatList
                  data={contextItems}
                  keyExtractor={item => item.id}
                  style={{ maxHeight: 380 }}
                  ListEmptyComponent={
                    <Text style={[styles.pickerEmpty, { color: colors.textMuted }]}>{t('noContexts', language)}</Text>
                  }
                  renderItem={({ item }) => {
                    const selected = sessionContextIds.includes(item.id);
                    return (
                      <Pressable
                        style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                        onPress={() => toggleContext(item.id)}
                      >
                        <View style={[styles.pickerItemRow, isRTL && styles.aiHeaderRTL]}>
                          <Text style={[styles.pickerItemTitle, { color: colors.text }, isRTL && styles.inputRTL]} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Ionicons
                            name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                            size={20}
                            color={selected ? colors.primary : colors.textMuted}
                          />
                        </View>
                        <Text style={[styles.pickerItemPreview, { color: colors.textMuted }, isRTL && styles.inputRTL]} numberOfLines={2}>
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
            style={[styles.textArea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }, isRTL && styles.inputRTL]}
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
  assistantBar: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  assistantBadge: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  assistantName: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  assistantMeta: { fontSize: FONT_SIZE.xs },
  headerIconBtn: { padding: 2 },
  countBadge: {
    position: 'absolute', top: -4, right: -6, minWidth: 14, height: 14,
    borderRadius: 7, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2,
  },
  countBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  contextChipsBar: { maxHeight: 40, borderBottomWidth: StyleSheet.hairlineWidth },
  contextChipsContent: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xs,
    gap: SPACING.xs, alignItems: 'center',
  },
  contextChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
    borderRadius: RADIUS.full, borderWidth: 1, maxWidth: 180,
  },
  contextChipText: { fontSize: FONT_SIZE.xs, fontWeight: '600', flexShrink: 1 },
  chatList: { flex: 1 },
  chatContent: { padding: SPACING.lg, gap: SPACING.md, flexGrow: 1 },
  chatEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40, paddingHorizontal: SPACING.lg },
  chatEmptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg,
  },
  chatEmptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700', marginBottom: SPACING.xs },
  chatEmptyText: { fontSize: FONT_SIZE.sm, textAlign: 'center', lineHeight: 20 },
  suggestionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, justifyContent: 'center', marginTop: SPACING.xl },
  suggestionChip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, borderWidth: 1, maxWidth: '90%',
  },
  suggestionChipText: { fontSize: FONT_SIZE.sm },
  chatBubble: { maxWidth: '85%', padding: SPACING.md, borderRadius: RADIUS.lg },
  userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: SPACING.xs },
  aiBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: SPACING.xs, ...SHADOW.card },
  aiBubbleLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  aiBubbleLabelText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  chatBubbleText: { fontSize: FONT_SIZE.md, lineHeight: 22 },
  msgActions: {
    flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm,
    paddingTop: SPACING.xs, borderTopWidth: StyleSheet.hairlineWidth,
  },
  msgActionBtn: { padding: 2 },
  chainBar: { maxHeight: 44, borderTopWidth: StyleSheet.hairlineWidth },
  chainBarContent: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xs,
    gap: SPACING.xs, alignItems: 'center',
  },
  chainLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: SPACING.xs },
  chainLabelText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  chainChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full, borderWidth: 1, maxWidth: 200,
  },
  chainChipText: { fontSize: FONT_SIZE.xs, fontWeight: '600', flexShrink: 1 },
  chatInputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm,
    padding: SPACING.md, borderTopWidth: StyleSheet.hairlineWidth,
  },
  chatTextInput: {
    flex: 1, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm, fontSize: FONT_SIZE.md, maxHeight: 100,
  },
  inputRTL: { textAlign: 'right', writingDirection: 'rtl' },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  chainBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  pickerOverlay: { flex: 1, justifyContent: 'flex-end' },
  pickerSheet: {
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    paddingBottom: SPACING.xl, maxHeight: '75%',
  },
  pickerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.lg, gap: SPACING.sm,
  },
  pickerTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', flex: 1 },
  pickerItem: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: StyleSheet.hairlineWidth },
  pickerItemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm },
  pickerItemTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', flex: 1 },
  pickerItemPreview: { fontSize: FONT_SIZE.xs, lineHeight: 18, marginTop: 2 },
  pickerEmpty: { textAlign: 'center', paddingVertical: SPACING.xl, fontSize: FONT_SIZE.sm },
  sessionActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  newChatBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.sm,
    paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderStyle: 'dashed',
  },
  newChatBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  fillBody: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, gap: SPACING.md },
  fillField: { gap: SPACING.xs },
  fillLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600', textTransform: 'capitalize' },
  fillInput: {
    borderWidth: 1, borderRadius: RADIUS.md, padding: SPACING.md,
    fontSize: FONT_SIZE.md, minHeight: 44, maxHeight: 140, lineHeight: 21,
  },
  fillOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  fillOptionChip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full, borderWidth: 1,
  },
  fillOptionText: { fontSize: FONT_SIZE.sm },
  fillActions: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  fillSendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.md, borderRadius: RADIUS.md,
  },
  fillSendText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.md },

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
