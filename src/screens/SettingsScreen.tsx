import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Switch, StyleSheet, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants';
import { useThemeColors } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePromptStore } from '@/stores/promptStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { getDatabase } from '@/database/connection';
import { exportAllPrompts, importPrompts } from '@/database/queries';
import { shareExport, pickAndReadFile, parseImportJson } from '@/engine/importExport';
import { t } from '@/i18n/strings';
import type { ProomyNote } from '@/types';
import { generateId } from '@/utils/id';

export default function SettingsScreen() {
  const language = useSettingsStore(s => s.language);
  const setLanguage = useSettingsStore(s => s.setLanguage);
  const isRTL = useSettingsStore(s => s.isRTL);
  const isDarkMode = useSettingsStore(s => s.isDarkMode);
  const toggleDarkMode = useSettingsStore(s => s.toggleDarkMode);
  const prompts = usePromptStore(s => s.prompts);
  const loadPrompts = usePromptStore(s => s.loadPrompts);
  const navigate = useNavigationStore(s => s.navigate);
  const colors = useThemeColors();
  const [showImportModal, setShowImportModal] = useState(false);

  const handleExport = async () => {
    try {
      const db = getDatabase();
      const all = exportAllPrompts(db);
      await shareExport(all);
    } catch (e) {
      Alert.alert('Error', 'Failed to export prompts');
    }
  };

  const handleImport = async (mode: 'merge' | 'replace') => {
    setShowImportModal(false);
    try {
      const fileResult = await pickAndReadFile();
      if (!fileResult) return;

      const parsed = parseImportJson(fileResult.content);
      const db = getDatabase();

      // Ensure each prompt has an id and timestamps
      const promptsToImport: ProomyNote[] = parsed.prompts.map((p: any) => ({
        id: p.id || generateId(),
        title: p.title || 'Imported Prompt',
        content: p.content || '',
        description: p.description,
        category: p.category || 'other',
        platform: p.platform || 'chatgpt',
        tags: p.tags || [],
        variables: p.variables || [],
        isFavorite: p.isFavorite || false,
        isPinned: p.isPinned || false,
        usageCount: p.usageCount || 0,
        lastUsedAt: p.lastUsedAt,
        createdAt: p.createdAt || Date.now(),
        updatedAt: p.updatedAt || Date.now(),
        audioBase64: p.audioBase64,
      }));

      const count = importPrompts(db, promptsToImport, mode);
      loadPrompts();
      Alert.alert(
        t('importSuccess', language),
        `${count} ${t('importedCount', language)}`
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to import');
    }
  };

  const MenuItem = ({ icon, label, onPress, rightElement }: { icon: string; label: string; onPress?: () => void; rightElement?: React.ReactNode }) => (
    <Pressable style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={onPress}>
      <Ionicons name={icon as any} size={22} color={colors.primary} />
      <Text style={[styles.menuText, { color: colors.text }]}>{label}</Text>
      {rightElement || <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
    </Pressable>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Appearance */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }, isRTL && styles.textRTL]}>
        {t('appearance', language)}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.menuItem}>
          <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={22} color={colors.primary} />
          <View style={styles.menuContent}>
            <Text style={[styles.menuText, { color: colors.text }]}>{t('darkMode', language)}</Text>
            <Text style={[styles.menuDesc, { color: colors.textMuted }]}>{t('darkModeDesc', language)}</Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: colors.border, true: colors.primary + '60' }}
            thumbColor={isDarkMode ? colors.primary : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Language */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }, isRTL && styles.textRTL]}>
        {t('language', language)}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Pressable
          style={[styles.langOption, language === 'en' && { backgroundColor: colors.primary + '08' }]}
          onPress={() => setLanguage('en')}
        >
          <Text style={[styles.langText, { color: colors.text }, language === 'en' && { fontWeight: '600', color: colors.primary }]}>
            {t('english', language)}
          </Text>
          {language === 'en' && (
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          )}
        </Pressable>
        <View style={[styles.separator, { backgroundColor: colors.border }]} />
        <Pressable
          style={[styles.langOption, language === 'ar' && { backgroundColor: colors.primary + '08' }]}
          onPress={() => setLanguage('ar')}
        >
          <Text style={[styles.langText, { color: colors.text }, language === 'ar' && { fontWeight: '600', color: colors.primary }]}>
            {t('arabic', language)}
          </Text>
          {language === 'ar' && (
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          )}
        </Pressable>
      </View>

      {/* Customize */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }, isRTL && styles.textRTL]}>
        {t('customize', language)}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <MenuItem icon="grid-outline" label={t('manageCategories', language)} onPress={() => navigate('ManageCategories')} />
        <MenuItem icon="layers-outline" label={t('managePlatforms', language)} onPress={() => navigate('ManagePlatforms')} />
      </View>

      {/* AI */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }, isRTL && styles.textRTL]}>
        {t('aiAssistant', language)}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <MenuItem icon="sparkles-outline" label={t('aiSettings', language)} onPress={() => navigate('AISettings')} />
      </View>

      {/* Data - Export & Import */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }, isRTL && styles.textRTL]}>
        {t('backupRestore', language)}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <MenuItem icon="cloud-upload-outline" label={t('exportPrompts', language)} onPress={handleExport} />
        <View style={[styles.separator, { backgroundColor: colors.border }]} />
        <MenuItem icon="cloud-download-outline" label={t('importBackup', language)} onPress={() => setShowImportModal(true)} />
      </View>

      {/* Stats */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }, isRTL && styles.textRTL]}>
        {t('about', language)}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: colors.text }]}>{t('totalPrompts', language)}</Text>
          <Text style={[styles.statValue, { color: colors.textSecondary }]}>{prompts.length}</Text>
        </View>
        <View style={[styles.separator, { backgroundColor: colors.border }]} />
        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: colors.text }]}>{t('version', language)}</Text>
          <Text style={[styles.statValue, { color: colors.textSecondary }]}>2.0.0</Text>
        </View>
      </View>

      {/* Branding */}
      <Text style={[styles.branding, { color: colors.primary }]}>Proomy Note</Text>
      <Text style={[styles.brandingSub, { color: colors.textMuted }]}>Your smart prompt library</Text>

      {/* Import Modal */}
      <Modal visible={showImportModal} transparent animationType="fade" onRequestClose={() => setShowImportModal(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('importBackup', language)}</Text>
            <Text style={[styles.modalDesc, { color: colors.textMuted }]}>{t('importBackupDesc', language)}</Text>

            <Pressable style={[styles.importOption, { backgroundColor: colors.primary }]} onPress={() => handleImport('merge')}>
              <Ionicons name="git-merge-outline" size={20} color="#fff" />
              <View style={{ flex: 1 }}>
                <Text style={styles.importOptionTitle}>{t('mergeImport', language)}</Text>
                <Text style={styles.importOptionDesc}>{t('importMergeDesc', language)}</Text>
              </View>
            </Pressable>

            <Pressable style={[styles.importOption, { backgroundColor: colors.warning }]} onPress={() => handleImport('replace')}>
              <Ionicons name="swap-horizontal-outline" size={20} color="#fff" />
              <View style={{ flex: 1 }}>
                <Text style={styles.importOptionTitle}>{t('replaceImport', language)}</Text>
                <Text style={styles.importOptionDesc}>{t('importReplaceDesc', language)}</Text>
              </View>
            </Pressable>

            <Pressable style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setShowImportModal(false)}>
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>{t('cancel', language)}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 40 },
  sectionTitle: {
    fontSize: FONT_SIZE.sm, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: SPACING.sm, marginTop: SPACING.xl, marginLeft: SPACING.xs,
  },
  textRTL: { textAlign: 'right' },
  card: { borderRadius: RADIUS.lg, overflow: 'hidden', ...SHADOW.card },
  langOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg },
  langText: { fontSize: FONT_SIZE.lg },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: SPACING.lg },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, gap: SPACING.md },
  menuContent: { flex: 1 },
  menuText: { flex: 1, fontSize: FONT_SIZE.lg },
  menuDesc: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  statRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg },
  statLabel: { fontSize: FONT_SIZE.lg },
  statValue: { fontSize: FONT_SIZE.lg, fontWeight: '600' },
  branding: { textAlign: 'center', fontSize: FONT_SIZE.lg, fontWeight: '700', marginTop: SPACING.xxxl },
  brandingSub: { textAlign: 'center', fontSize: FONT_SIZE.sm, marginTop: SPACING.xs },
  // Import modal
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  modalCard: { width: '100%', borderRadius: RADIUS.xl, padding: SPACING.xl, ...SHADOW.elevated },
  modalTitle: { fontSize: FONT_SIZE.xxl, fontWeight: '700', marginBottom: SPACING.sm },
  modalDesc: { fontSize: FONT_SIZE.md, marginBottom: SPACING.xl, lineHeight: 22 },
  importOption: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    padding: SPACING.lg, borderRadius: RADIUS.lg, marginBottom: SPACING.md,
  },
  importOptionTitle: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.lg },
  importOptionDesc: { color: 'rgba(255,255,255,0.8)', fontSize: FONT_SIZE.xs, marginTop: 2 },
  cancelBtn: {
    alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.md,
    borderWidth: 1, marginTop: SPACING.sm,
  },
  cancelBtnText: { fontSize: FONT_SIZE.md, fontWeight: '600' },
});
