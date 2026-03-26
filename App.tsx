import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, BackHandler, Platform, Linking, Alert, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { File } from 'expo-file-system';
import * as FileSystem from 'expo-file-system';
import { getDatabase } from '@/database/connection';
import { initializeDatabase } from '@/database/schema';
import { seedDatabase } from '@/database/seed';
import { initHistoryTable } from '@/stores/historyStore';
import { loadSettingsFromStorage } from '@/stores/settingsStore';
import { importPrompts } from '@/database/queries';
import { parseImportJson } from '@/engine/importExport';
import { usePromptStore } from '@/stores/promptStore';
import { generateId } from '@/utils/id';
import Navigator from '@/components/Navigator';
import BottomTabBar from '@/components/BottomTabBar';
import { useNavigationStore } from '@/stores/navigationStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useThemeColors } from '@/hooks/useTheme';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants';
import { t } from '@/i18n/strings';
import type { VibeNote } from '@/types';

const FULL_SCREEN_ROUTES = new Set(['CreatePrompt', 'EditPrompt', 'PromptDetail', 'ManageCategories', 'ManagePlatforms', 'AISettings']);

export default function App() {
  const [ready, setReady] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const currentScreen = useNavigationStore(s => s.currentScreen);
  const goBack = useNavigationStore(s => s.goBack);
  const history = useNavigationStore(s => s.history);
  const language = useSettingsStore(s => s.language);
  const isRTL = useSettingsStore(s => s.isRTL);
  const isDarkMode = useSettingsStore(s => s.isDarkMode);
  const colors = useThemeColors();
  const loadPrompts = usePromptStore(s => s.loadPrompts);

  const handleOpenFileUrl = async (url: string) => {
    try {
      let content: string;
      if (url.startsWith('file://')) {
        const file = new File(url);
        content = await file.text();
      } else {
        // Handle content:// and other URI schemes (Android)
        const destPath = FileSystem.cacheDirectory + 'import_temp.vibe';
        await FileSystem.copyAsync({ from: url, to: destPath });
        content = await FileSystem.readAsStringAsync(destPath);
      }
      const parsed = parseImportJson(content);
      const db = getDatabase();
      const promptsToImport: VibeNote[] = parsed.prompts.map((p: any) => ({
        id: p.id || generateId(),
        title: p.title || 'Imported Prompt',
        content: p.content || '',
        description: p.description,
        category: p.category || 'other',
        platform: p.platform || 'chatgpt',
        tags: p.tags || [],
        variables: p.variables || [],
        isFavorite: false,
        isPinned: false,
        usageCount: 0,
        lastUsedAt: undefined,
        createdAt: p.createdAt || Date.now(),
        updatedAt: p.updatedAt || Date.now(),
      }));
      const count = importPrompts(db, promptsToImport, 'merge');
      loadPrompts();
      Alert.alert(
        language === 'ar' ? 'تم الاستيراد' : 'Imported',
        `${count} ${language === 'ar' ? 'برومبت تم استيراده' : 'prompt(s) imported'}`
      );
    } catch (e) {
      console.error('File open error:', e);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const db = getDatabase();
        initializeDatabase(db);
        initHistoryTable(db);
        seedDatabase(db);
        await loadSettingsFromStorage();
        setReady(true);
        // Handle file opened while app was closed
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) handleOpenFileUrl(initialUrl);
      } catch (e) {
        console.error('Database initialization failed:', e);
        setReady(true);
      }
    };
    init();
    // Handle file opened while app is running
    const sub = Linking.addEventListener('url', ({ url }) => handleOpenFileUrl(url));
    return () => sub.remove();
  }, []);

  // Android back button handler
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (history.length > 0) {
        goBack();
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, [history, goBack]);

  if (!ready) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isFullScreen = FULL_SCREEN_ROUTES.has(currentScreen);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.primary }]} edges={['top', 'bottom']}>
          <StatusBar style="light" />

          {!isFullScreen && (
            <View style={[styles.header, { backgroundColor: colors.primary }, isRTL && styles.headerRTL]}>
              <View style={[styles.headerCenter, isRTL && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="sparkles" size={24} color="#fff" />
                <Text style={styles.headerTitle}>{t('appName', language)}</Text>
              </View>
              <Pressable style={styles.helpBtn} onPress={() => setShowHelp(true)} hitSlop={8}>
                <Ionicons name="help-circle-outline" size={24} color="rgba(255,255,255,0.8)" />
              </Pressable>
            </View>
          )}

          <View style={[styles.content, { backgroundColor: colors.background }]}>
            <Navigator />
          </View>

          {!isFullScreen && <BottomTabBar />}

          {/* Help Modal */}
          <Modal visible={showHelp} transparent animationType="fade" onRequestClose={() => setShowHelp(false)}>
            <View style={[styles.helpOverlay, { backgroundColor: colors.overlay }]}>
              <View style={[styles.helpCard, { backgroundColor: colors.card }]}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={[styles.helpTitle, { color: colors.primary }]}>{t('helpTitle', language)}</Text>

                  <View style={styles.helpSection}>
                    <View style={styles.helpSectionHeader}>
                      <Ionicons name="code-slash" size={20} color={colors.primary} />
                      <Text style={[styles.helpSectionTitle, { color: colors.text }]}>{t('helpVariables', language)}</Text>
                    </View>
                    <Text style={[styles.helpText, { color: colors.textSecondary }]}>{t('helpVariablesDesc', language)}</Text>
                  </View>

                  <View style={styles.helpSection}>
                    <View style={styles.helpSectionHeader}>
                      <Ionicons name="sparkles" size={20} color={colors.primary} />
                      <Text style={[styles.helpSectionTitle, { color: colors.text }]}>{t('helpAI', language)}</Text>
                    </View>
                    <Text style={[styles.helpText, { color: colors.textSecondary }]}>{t('helpAIDesc', language)}</Text>
                  </View>

                  <View style={styles.helpSection}>
                    <View style={styles.helpSectionHeader}>
                      <Ionicons name="rocket" size={20} color={colors.primary} />
                      <Text style={[styles.helpSectionTitle, { color: colors.text }]}>{t('helpSetup', language)}</Text>
                    </View>
                    <Text style={[styles.helpText, { color: colors.textSecondary }]}>{t('helpSetupDesc', language)}</Text>
                  </View>

                  <View style={styles.helpSection}>
                    <View style={styles.helpSectionHeader}>
                      <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                      <Text style={[styles.helpSectionTitle, { color: colors.text }]}>{t('helpSecurity', language)}</Text>
                    </View>
                    <Text style={[styles.helpText, { color: colors.textSecondary }]}>{t('helpSecurityDesc', language)}</Text>
                  </View>
                </ScrollView>

                <Pressable style={[styles.helpCloseBtn, { backgroundColor: colors.primary }]} onPress={() => setShowHelp(false)}>
                  <Text style={styles.helpCloseBtnText}>{t('helpClose', language)}</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  helpBtn: {
    position: 'absolute',
    right: SPACING.lg,
  },
  content: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  // Help modal
  helpOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  helpCard: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOW.elevated,
  },
  helpTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  helpSection: {
    marginBottom: SPACING.xl,
  },
  helpSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  helpSectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  helpText: {
    fontSize: FONT_SIZE.md,
    lineHeight: 22,
  },
  helpCloseBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
  },
  helpCloseBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FONT_SIZE.lg,
  },
});
