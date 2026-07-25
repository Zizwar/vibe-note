import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES, RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants';
import { useThemeColors } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/settingsStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { t } from '@/i18n/strings';
import type { CategoryItem } from '@/constants/categories';

export default function ManageCategoriesScreen() {
  const goBack = useNavigationStore(s => s.goBack);
  const language = useSettingsStore(s => s.language);
  const isRTL = useSettingsStore(s => s.isRTL);
  const customCategories = useSettingsStore(s => s.customCategories);
  const addCustomCategory = useSettingsStore(s => s.addCustomCategory);
  const removeCustomCategory = useSettingsStore(s => s.removeCustomCategory);
  const colors = useThemeColors();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [icon, setIcon] = useState('apps');
  const [color, setColor] = useState('#607D8B');

  const handleAdd = () => {
    if (!name.trim()) return;
    const value = name.trim().toLowerCase().replace(/\s+/g, '_');
    if ([...CATEGORIES, ...customCategories].some(c => c.value === value)) {
      Alert.alert('Error', 'Category already exists');
      return;
    }
    addCustomCategory({
      value: value as any,
      label: name.trim(),
      labelAr: nameAr.trim() || name.trim(),
      icon,
      color,
    });
    setName('');
    setNameAr('');
    setIcon('apps');
    setColor('#607D8B');
    setShowForm(false);
  };

  const handleDelete = (value: string) => {
    Alert.alert(
      t('delete', language),
      t('deleteItemConfirm', language),
      [
        { text: t('cancel', language), style: 'cancel' },
        { text: t('delete', language), style: 'destructive', onPress: () => removeCustomCategory(value) },
      ]
    );
  };

  const renderCategoryItem = (cat: CategoryItem, isCustom: boolean) => (
    <View key={cat.value} style={[styles.item, { borderBottomColor: colors.border }]}>
      <View style={[styles.iconCircle, { backgroundColor: cat.color + '20' }]}>
        <Ionicons name={cat.icon as any} size={18} color={cat.color} />
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, { color: colors.text }]}>{cat.label}</Text>
        <Text style={[styles.itemSub, { color: colors.textMuted }]}>{cat.labelAr}</Text>
      </View>
      {isCustom && (
        <Pressable onPress={() => handleDelete(cat.value)} hitSlop={8}>
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }, isRTL && styles.headerRTL]}>
        <Pressable onPress={goBack} hitSlop={8}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('manageCategories', language)}</Text>
        <Pressable onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'close' : 'add-circle'} size={28} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView style={styles.body}>
        {/* Add form */}
        {showForm && (
          <View style={[styles.form, { backgroundColor: colors.card }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>{t('addCategory', language)}</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              value={name}
              onChangeText={setName}
              placeholder={t('categoryName', language)}
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              value={nameAr}
              onChangeText={setNameAr}
              placeholder={t('categoryNameAr', language)}
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              value={icon}
              onChangeText={setIcon}
              placeholder={t('iconName', language) + ' (e.g. star, globe, leaf)'}
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

        {/* Custom categories */}
        {customCategories.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('customItems', language)}</Text>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              {customCategories.map(cat => renderCategoryItem(cat, true))}
            </View>
          </>
        )}

        {/* Default categories */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('defaultItems', language)}</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {CATEGORIES.map(cat => renderCategoryItem(cat, false))}
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
  itemContent: { flex: 1 },
  itemTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600' },
  itemSub: { fontSize: FONT_SIZE.xs, marginTop: 2 },
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
