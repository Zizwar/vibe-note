import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants';
import { useThemeColors } from '@/hooks/useTheme';
import { fetchRemotePrompt } from '@/services/backendService';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePromptStore } from '@/stores/promptStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { getDatabase } from '@/database/connection';
import { importPrompts } from '@/database/queries';
import { generateId } from '@/utils/id';
import type { VibeNote } from '@/types';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function ImportCodeModal({ visible, onClose }: Props) {
  const [codeOrUrl, setCodeOrUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const colors = useThemeColors();
  const language = useSettingsStore(s => s.language);
  const isRTL = useSettingsStore(s => s.isRTL);
  const backendServerUrl = useSettingsStore(s => s.backendServerUrl);
  const setBackendServerUrl = useSettingsStore(s => s.setBackendServerUrl);
  const loadPrompts = usePromptStore(s => s.loadPrompts);
  const navigate = useNavigationStore(s => s.navigate);

  const [customServer, setCustomServer] = useState(backendServerUrl || 'https://test.10rg.com');
  const [showServerSetting, setShowServerSetting] = useState(false);

  const handleImport = async () => {
    const text = codeOrUrl.trim();
    if (!text) {
      Alert.alert('Invalid Input', 'Please enter a prompt short code or link.');
      return;
    }

    // Extract shortId code from full URL or standalone code
    let shortId = text;
    if (text.includes('/p/')) {
      shortId = text.split('/p/')[1].split('?')[0].split('#')[0];
    } else if (text.includes('/')) {
      shortId = text.split('/').pop()?.split('?')[0] || text;
    }

    shortId = shortId.trim();

    if (!shortId) {
      Alert.alert('Error', 'Could not parse short code from the provided link.');
      return;
    }

    setIsLoading(true);

    try {
      const remoteData = await fetchRemotePrompt(shortId, customServer);
      if (!remoteData || !remoteData.content) {
        Alert.alert(
          'Prompt Not Found',
          `Could not find prompt with code "${shortId}" on server (${customServer}). Check code or server URL.`
        );
        setIsLoading(false);
        return;
      }

      // Save active server URL preference
      setBackendServerUrl(customServer);

      const db = getDatabase();
      const newPrompt: VibeNote = {
        id: generateId(),
        kind: remoteData.kind === 'note' || remoteData.kind === 'context' ? remoteData.kind : 'prompt',
        title: remoteData.title || 'Imported Prompt',
        content: remoteData.content,
        description: remoteData.description || '',
        category: remoteData.category || 'other',
        platform: remoteData.platform || 'chatgpt',
        tags: remoteData.tags || [],
        variables: remoteData.variables || [],
        linkedIds: [],
        contextIds: [],
        isFavorite: false,
        isPinned: false,
        usageCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      importPrompts(db, [newPrompt], 'merge');
      loadPrompts();

      setCodeOrUrl('');
      setIsLoading(false);
      onClose();

      navigate('PromptDetail', { promptId: newPrompt.id });

      Alert.alert(
        language === 'ar' ? 'تم الاستيراد بنجاح' : 'Imported Successfully',
        language === 'ar'
          ? `تم استيراد البرومبت "${newPrompt.title}" وتخزينه في التطبيق.`
          : `Prompt "${newPrompt.title}" saved to your library!`
      );
    } catch (err: any) {
      setIsLoading(false);
      Alert.alert('Import Failed', err.message || 'Error connecting to server.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable style={[styles.card, { backgroundColor: colors.card }]} onPress={() => {}}>
          <View style={[styles.header, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="cloud-download-outline" size={22} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>
                {language === 'ar' ? 'ادخال كود / رابط البرومبت' : 'Import via Link or Code'}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          <Text style={[styles.desc, { color: colors.textSecondary }, isRTL && { textAlign: 'right' }]}>
            {language === 'ar'
              ? 'ادخل الرابط المختصر الكامل (مثل http://localhost:8000/p/PTZt0p) أو كود البرومبت فقط (مثل PTZt0p):'
              : 'Paste a full short link (e.g. https://vibenote.sbs/p/PTZt0p) or just the prompt code (e.g. PTZt0p):'}
          </Text>

          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="e.g. PTZt0p or https://vibenote.sbs/p/PTZt0p"
            placeholderTextColor={colors.textMuted}
            value={codeOrUrl}
            onChangeText={setCodeOrUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Server URL Accordion Toggle */}
          <Pressable
            style={[styles.serverToggle, isRTL && { flexDirection: 'row-reverse' }]}
            onPress={() => setShowServerSetting(!showServerSetting)}
          >
            <Ionicons name="server-outline" size={14} color={colors.primary} />
            <Text style={[styles.serverToggleText, { color: colors.primary }]}>
              Server URL: {customServer}
            </Text>
            <Ionicons name={showServerSetting ? 'chevron-up' : 'chevron-down'} size={14} color={colors.primary} />
          </Pressable>

          {showServerSetting && (
            <View style={styles.serverBox}>
              <Text style={[styles.serverLabel, { color: colors.textMuted }]}>Deno Backend Host:</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={customServer}
                onChangeText={setCustomServer}
                autoCapitalize="none"
                placeholder="http://localhost:8000"
              />
            </View>
          )}

          <View style={[styles.footer, isRTL && { flexDirection: 'row-reverse' }]}>
            <Pressable style={[styles.btn, styles.cancelBtn, { borderColor: colors.border }]} onPress={onClose}>
              <Text style={[styles.btnText, { color: colors.textSecondary }]}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.btn, styles.importBtn, { backgroundColor: colors.primary }]}
              onPress={handleImport}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="download" size={16} color="#fff" />
                  <Text style={[styles.btnText, { color: '#fff' }]}>
                    {language === 'ar' ? 'استيراد' : 'Import'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg,
  },
  card: {
    width: '100%', maxWidth: 450, borderRadius: RADIUS.xl, padding: SPACING.lg, ...SHADOW.card,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md,
  },
  headerTitleRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZE.lg, fontWeight: '700',
  },
  desc: {
    fontSize: FONT_SIZE.xs, lineHeight: 18, marginBottom: SPACING.md,
  },
  input: {
    borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md, marginBottom: SPACING.md,
  },
  serverToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.md,
  },
  serverToggleText: {
    fontSize: FONT_SIZE.xs, fontWeight: '600', flex: 1,
  },
  serverBox: {
    marginBottom: SPACING.md,
  },
  serverLabel: {
    fontSize: FONT_SIZE.xs, marginBottom: 4,
  },
  footer: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.md, marginTop: SPACING.sm,
  },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: RADIUS.md,
  },
  cancelBtn: {
    borderWidth: 1,
  },
  importBtn: {},
  btnText: {
    fontSize: FONT_SIZE.md, fontWeight: '600',
  },
});
