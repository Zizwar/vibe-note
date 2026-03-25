import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants';
import { useThemeColors } from '@/hooks/useTheme';
import { useSettingsStore, AIProviderConfig } from '@/stores/settingsStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { testAIConnection } from '@/engine/aiService';
import { t } from '@/i18n/strings';

const PROVIDER_INFO: Record<string, { desc: string; keyUrl: string; icon: string; color: string }> = {
  gemini: {
    desc: 'geminiDesc',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    icon: 'diamond',
    color: '#4285F4',
  },
  openrouter: {
    desc: 'openrouterDesc',
    keyUrl: 'https://openrouter.ai/keys',
    icon: 'git-network',
    color: '#6366F1',
  },
  openai: {
    desc: 'openaiDesc',
    keyUrl: 'https://platform.openai.com/api-keys',
    icon: 'flash',
    color: '#10A37F',
  },
};

export default function AISettingsScreen() {
  const goBack = useNavigationStore(s => s.goBack);
  const language = useSettingsStore(s => s.language);
  const isRTL = useSettingsStore(s => s.isRTL);
  const aiProviders = useSettingsStore(s => s.aiProviders);
  const activeAIProvider = useSettingsStore(s => s.activeAIProvider);
  const updateAIProvider = useSettingsStore(s => s.updateAIProvider);
  const setActiveAIProvider = useSettingsStore(s => s.setActiveAIProvider);
  const colors = useThemeColors();

  const [testing, setTesting] = useState(false);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  const handleTest = async () => {
    setTesting(true);
    try {
      const success = await testAIConnection();
      Alert.alert(
        success ? t('connectionSuccess', language) : t('connectionFailed', language)
      );
    } catch {
      Alert.alert(t('connectionFailed', language));
    }
    setTesting(false);
  };

  const handleActivate = (id: string) => {
    const provider = aiProviders.find(p => p.id === id);
    if (!provider?.apiKey) {
      Alert.alert('Error', 'Please enter an API key first');
      return;
    }
    setActiveAIProvider(activeAIProvider === id ? null : id);
  };

  const renderProvider = (provider: AIProviderConfig) => {
    const info = PROVIDER_INFO[provider.id];
    const isExpanded = expandedProvider === provider.id;
    const isActive = activeAIProvider === provider.id;

    return (
      <View key={provider.id} style={[styles.providerCard, { backgroundColor: colors.card }]}>
        <Pressable
          style={styles.providerHeader}
          onPress={() => setExpandedProvider(isExpanded ? null : provider.id)}
        >
          <View style={[styles.providerIcon, { backgroundColor: (info?.color || '#888') + '20' }]}>
            <Ionicons name={(info?.icon || 'flash') as any} size={20} color={info?.color || '#888'} />
          </View>
          <View style={styles.providerInfo}>
            <Text style={[styles.providerName, { color: colors.text }]}>{provider.name}</Text>
            <Text style={[styles.providerDesc, { color: colors.textMuted }]}>
              {info ? t(info.desc as any, language) : provider.name}
            </Text>
          </View>
          {isActive && (
            <View style={[styles.activeBadge, { backgroundColor: colors.success + '20' }]}>
              <Text style={[styles.activeBadgeText, { color: colors.success }]}>Active</Text>
            </View>
          )}
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
        </Pressable>

        {isExpanded && (
          <View style={[styles.providerBody, { borderTopColor: colors.border }]}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('apiKey', language)}</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              value={provider.apiKey}
              onChangeText={(text) => updateAIProvider(provider.id, { apiKey: text })}
              placeholder="sk-... or AIza..."
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('model', language)}</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              value={provider.model}
              onChangeText={(text) => updateAIProvider(provider.id, { model: text })}
              placeholder="Model name"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />

            <View style={styles.providerActions}>
              {info && (
                <Pressable
                  style={[styles.linkBtn, { borderColor: colors.primary }]}
                  onPress={() => Linking.openURL(info.keyUrl)}
                >
                  <Ionicons name="key-outline" size={16} color={colors.primary} />
                  <Text style={[styles.linkBtnText, { color: colors.primary }]}>{t('getApiKey', language)}</Text>
                </Pressable>
              )}

              <Pressable
                style={[
                  styles.activateBtn,
                  { backgroundColor: isActive ? colors.success : colors.primary },
                ]}
                onPress={() => handleActivate(provider.id)}
              >
                <Ionicons name={isActive ? 'checkmark-circle' : 'power'} size={16} color="#fff" />
                <Text style={styles.activateBtnText}>
                  {isActive ? 'Active' : 'Activate'}
                </Text>
              </Pressable>
            </View>

            {isActive && (
              <Pressable
                style={[styles.testBtn, { borderColor: colors.primary }]}
                onPress={handleTest}
                disabled={testing}
              >
                <Ionicons name="flash-outline" size={16} color={colors.primary} />
                <Text style={[styles.testBtnText, { color: colors.primary }]}>
                  {testing ? '...' : t('testConnection', language)}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }, isRTL && styles.headerRTL]}>
        <Pressable onPress={goBack} hitSlop={8}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('aiSettings', language)}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* Info card */}
        <View style={[styles.infoCard, { backgroundColor: colors.primary + '10' }]}>
          <Ionicons name="information-circle" size={22} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {language === 'ar'
              ? 'اختر مزود ذكاء اصطناعي وأدخل مفتاح API لتفعيل الميزات الذكية. Gemini مجاني ويُنصح به للبدء.'
              : 'Choose an AI provider and enter your API key to unlock smart features. Gemini is free and recommended to start.'
            }
          </Text>
        </View>

        {/* Providers */}
        {aiProviders.map(renderProvider)}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRTL: { flexDirection: 'row-reverse' },
  headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700' },
  body: { flex: 1 },
  bodyContent: { padding: SPACING.lg, gap: SPACING.md },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
  infoText: { flex: 1, fontSize: FONT_SIZE.sm, lineHeight: 20 },
  providerCard: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  providerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerInfo: { flex: 1 },
  providerName: { fontSize: FONT_SIZE.lg, fontWeight: '700' },
  providerDesc: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  activeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  activeBadgeText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  providerBody: {
    padding: SPACING.lg,
    paddingTop: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  fieldLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginTop: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
  },
  providerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  linkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  linkBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  activateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  activateBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: '#fff' },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: SPACING.sm,
  },
  testBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
});
