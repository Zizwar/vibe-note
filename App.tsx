import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, BackHandler, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase } from '@/database/connection';
import { initializeDatabase } from '@/database/schema';
import { seedDatabase } from '@/database/seed';
import { initHistoryTable } from '@/stores/historyStore';
import { loadSettingsFromStorage } from '@/stores/settingsStore';
import Navigator from '@/components/Navigator';
import BottomTabBar from '@/components/BottomTabBar';
import { useNavigationStore } from '@/stores/navigationStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useThemeColors } from '@/hooks/useTheme';
import { t } from '@/i18n/strings';

const FULL_SCREEN_ROUTES = new Set(['CreatePrompt', 'EditPrompt', 'PromptDetail', 'ManageCategories', 'ManagePlatforms', 'AISettings', 'AIAssistant']);

export default function App() {
  const [ready, setReady] = useState(false);
  const currentScreen = useNavigationStore(s => s.currentScreen);
  const goBack = useNavigationStore(s => s.goBack);
  const history = useNavigationStore(s => s.history);
  const language = useSettingsStore(s => s.language);
  const isRTL = useSettingsStore(s => s.isRTL);
  const isDarkMode = useSettingsStore(s => s.isDarkMode);
  const colors = useThemeColors();

  useEffect(() => {
    const init = async () => {
      try {
        const db = getDatabase();
        initializeDatabase(db);
        initHistoryTable(db);
        seedDatabase(db);
        await loadSettingsFromStorage();
        setReady(true);
      } catch (e) {
        console.error('Database initialization failed:', e);
        setReady(true);
      }
    };
    init();
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
              <Ionicons name="sparkles" size={24} color="#fff" />
              <Text style={styles.headerTitle}>{t('appName', language)}</Text>
            </View>
          )}

          <View style={[styles.content, { backgroundColor: colors.background }]}>
            <Navigator />
          </View>

          {!isFullScreen && <BottomTabBar />}
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
    gap: 8,
    paddingVertical: 14,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
});
