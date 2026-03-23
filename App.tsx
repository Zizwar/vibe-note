import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase } from '@/database/connection';
import { initializeDatabase } from '@/database/schema';
import { seedDatabase } from '@/database/seed';
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
  const language = useSettingsStore(s => s.language);
  const isRTL = useSettingsStore(s => s.isRTL);
  const isDarkMode = useSettingsStore(s => s.isDarkMode);
  const colors = useThemeColors();

  useEffect(() => {
    try {
      const db = getDatabase();
      initializeDatabase(db);
      seedDatabase(db);
      setReady(true);
    } catch (e) {
      console.error('Database initialization failed:', e);
      setReady(true);
    }
  }, []);

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
        <SafeAreaView style={[styles.container, { backgroundColor: colors.primary }]} edges={['top']}>
          <StatusBar style={isDarkMode ? 'light' : 'light'} />

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
