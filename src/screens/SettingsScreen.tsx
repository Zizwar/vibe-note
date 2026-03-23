import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePromptStore } from '@/stores/promptStore';
import { getDatabase } from '@/database/connection';
import { exportAllPrompts } from '@/database/queries';
import { shareExport } from '@/engine/importExport';
import { t } from '@/i18n/strings';

export default function SettingsScreen() {
  const language = useSettingsStore(s => s.language);
  const setLanguage = useSettingsStore(s => s.setLanguage);
  const isRTL = useSettingsStore(s => s.isRTL);
  const prompts = usePromptStore(s => s.prompts);

  const handleExport = async () => {
    try {
      const db = getDatabase();
      const all = exportAllPrompts(db);
      await shareExport(all);
    } catch (e) {
      Alert.alert('Error', 'Failed to export prompts');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Language */}
      <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
        {t('language', language)}
      </Text>
      <View style={styles.card}>
        <Pressable
          style={[styles.langOption, language === 'en' && styles.langOptionActive]}
          onPress={() => setLanguage('en')}
        >
          <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>
            {t('english', language)}
          </Text>
          {language === 'en' && (
            <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
          )}
        </Pressable>
        <View style={styles.separator} />
        <Pressable
          style={[styles.langOption, language === 'ar' && styles.langOptionActive]}
          onPress={() => setLanguage('ar')}
        >
          <Text style={[styles.langText, language === 'ar' && styles.langTextActive]}>
            {t('arabic', language)}
          </Text>
          {language === 'ar' && (
            <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
          )}
        </Pressable>
      </View>

      {/* Data */}
      <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
        Data
      </Text>
      <View style={styles.card}>
        <Pressable style={styles.menuItem} onPress={handleExport}>
          <Ionicons name="download-outline" size={22} color={COLORS.primary} />
          <Text style={styles.menuText}>{t('exportPrompts', language)}</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </Pressable>
      </View>

      {/* Stats */}
      <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
        {t('about', language)}
      </Text>
      <View style={styles.card}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>{t('totalPrompts', language)}</Text>
          <Text style={styles.statValue}>{prompts.length}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>{t('version', language)}</Text>
          <Text style={styles.statValue}>1.0.0</Text>
        </View>
      </View>

      {/* Branding */}
      <Text style={styles.branding}>Proomy Note</Text>
      <Text style={styles.brandingSub}>Your smart prompt library</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xl,
    marginLeft: SPACING.xs,
  },
  textRTL: {
    textAlign: 'right',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  langOptionActive: {
    backgroundColor: COLORS.primary + '08',
  },
  langText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
  },
  langTextActive: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginLeft: SPACING.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  menuText: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  statLabel: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
  },
  statValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  branding: {
    textAlign: 'center',
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: SPACING.xxxl,
  },
  brandingSub: {
    textAlign: 'center',
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
});
