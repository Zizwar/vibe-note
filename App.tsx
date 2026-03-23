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
import { t } from '@/i18n/strings';

const FULL_SCREEN_ROUTES = new Set(['CreatePrompt', 'EditPrompt', 'PromptDetail']);

export default function App() {
  const [ready, setReady] = useState(false);
  const currentScreen = useNavigationStore(s => s.currentScreen);
  const language = useSettingsStore(s => s.language);
  const isRTL = useSettingsStore(s => s.isRTL);

  useEffect(() => {
    try {
      const db = getDatabase();
      initializeDatabase(db);
      seedDatabase(db);
      setReady(true);
    } catch (e) {
      console.error('Database initialization failed:', e);
      setReady(true); // Still show app
    }
  }, []);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#046f98" />
      </View>
    );
  }

  const isFullScreen = FULL_SCREEN_ROUTES.has(currentScreen);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container} edges={['top']}>
          <StatusBar style="light" />

          {/* Header - only show on tab screens */}
          {!isFullScreen && (
            <View style={[styles.header, isRTL && styles.headerRTL]}>
              <Ionicons name="sparkles" size={24} color="#fff" />
              <Text style={styles.headerTitle}>{t('appName', language)}</Text>
            </View>
          )}

          {/* Main content */}
          <View style={styles.content}>
            <Navigator />
          </View>

          {/* Bottom tab bar - only show on tab screens */}
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
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#046f98',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#046f98',
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
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
});
