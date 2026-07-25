import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PLATFORMS, RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants';
import { useThemeColors } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/settingsStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { t } from '@/i18n/strings';
import type { PlatformItem } from '@/constants/platforms';

export default function ManagePlatformsScreen() {
  const goBack = useNavigationStore(s => s.goBack);
  const language = useSettingsStore(s => s.language);
  const isRTL = useSettingsStore(s => s.isRTL);
  const customPlatforms = useSettingsStore(s => s.customPlatforms);
  const addCustomPlatform = useSettingsStore(s => s.addCustomPlatform);
  const removeCustomPlatform = useSettingsStore(s => s.removeCustomPlatform);
  const colors = useThemeColors();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('ellipsis-horizontal');
  const [color, setColor] = useState('#6B7280');

  const handleAdd = () => {
    if (!name.trim()) return;
    const value = name.trim().toLowerCase().replace(/\s+/g, '_');
    if ([...PLATFORMS, ...customPlatforms].some(p => p.value === value)) {
      Alert.alert('Error', 'Platform already exists');
      return;
    }
    addCustomPlatform({
      value: value as any,
      label: name.trim(),
      icon,
      color,
    });
    setName('');
    setIcon('ellipsis-horizontal');
    setColor('#6B7280');
    setShowForm(false);
  };

  const handleDelete = (value: string) => {
    Alert.alert(
      t('delete', language),
      t('deleteItemConfirm', language),
      [
        { text: t('cancel', language), style: 'cancel' },
        { text: t('delete', language), style: 'destructive', onPress: () => removeCustomPlatform(value) },
      ]
    );
  };

  const renderPlatformItem = (plat: PlatformItem, isCustom: boolean) => (
    <View key={plat.value} style={[styles.item, { borderBottomColor: colors.border }]}>
      <View style={[styles.iconCircle, { backgroundColor: plat.color + '20' }]}>
        <Ionicons name={plat.icon as any} size={18} color={plat.color} />
      </View>
      <Text style={[styles.itemTitle, { color: colors.text, flex: 1 }]}>{plat.label}</Text>
      {isCustom && (
        <Pressable onPress={() => handleDelete(plat.value)} hitSlop={8}>
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }, isRTL && styles.headerRTL]}>
        <Pressable onPress={goBack} hitSlop={8}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('managePlatforms', language)}</Text>
        <Pressable onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'close' : 'add-circle'} size={28} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView style={styles.body}>
        {showForm && (
          <View style={[styles.form, { backgroundColor: colors.card }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>{t('addPlatform', language)}</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              value={name}
              onChangeText={setName}
              placeholder={t('platformName', language)}
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              value={icon}
              onChangeText={setIcon}
              placeholder={t('iconName', language) + ' (e.g. logo-github, globe)'}
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              value={color}
              onChangeText={setColor}
              placeholder={t('colorHex', language) + ' (e.g. #FF5722)'}
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.previewRow}>
              <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon as any} size={18} color={color} />
              </View>
              <Text style={{ color: colors.text }}>{name || 'Preview'}</Text>
            </View>
            <Pressable
              style={[styles.addBtn, { backgroundColor: colors.primary }, !name.trim() && { opacity: 0.5 }]}
              onPress={handleAdd}
              disabled={!name.trim()}
            >
              <Text style={styles.addBtnText}>{t('save', language)}</Text>
            </Pressable>
          </View>
        )}

        {customPlatforms.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('customItems', language)}</Text>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              {customPlatforms.map(p => renderPlatformItem(p, true))}
            </View>
          </>
        )}

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('defaultItems', language)}</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {PLATFORMS.map(p => renderPlatformItem(p, false))}
        </View>

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
  body: { flex: 1, padding: SPACING.lg },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xl,
    marginLeft: SPACING.xs,
  },
  card: { borderRadius: RADIUS.lg, overflow: 'hidden', ...SHADOW.card },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600' },
  form: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
    ...SHADOW.card,
  },
  formTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.sm },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  addBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.md },
});
