import React, { useState } from 'react';
import { View, Pressable, Text, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SHADOW, RADIUS, SPACING, FONT_SIZE } from '@/constants';
import { useThemeColors } from '@/hooks/useTheme';
import { useNavigationStore } from '@/stores/navigationStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/i18n/strings';

export default function FAB() {
  const navigate = useNavigationStore(s => s.navigate);
  const language = useSettingsStore(s => s.language);
  const colors = useThemeColors();
  const [showMenu, setShowMenu] = useState(false);

  const handleQuickAdd = () => {
    setShowMenu(false);
    navigate('CreatePrompt');
  };

  const handleAIAdd = () => {
    setShowMenu(false);
    navigate('AIAssistant');
  };

  return (
    <>
      <Pressable
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setShowMenu(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowMenu(false)}>
          <View style={styles.menuContainer}>
            <Pressable
              style={[styles.menuItem, { backgroundColor: colors.card }]}
              onPress={handleAIAdd}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="sparkles" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{t('aiAssistedAdd', language)}</Text>
            </Pressable>

            <Pressable
              style={[styles.menuItem, { backgroundColor: colors.card }]}
              onPress={handleQuickAdd}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="create" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{t('quickAdd', language)}</Text>
            </Pressable>

            <Pressable
              style={[styles.fabClose, { backgroundColor: colors.danger }]}
              onPress={() => setShowMenu(false)}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 70,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.elevated,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  menuContainer: {
    alignItems: 'flex-end',
    paddingRight: 20,
    paddingBottom: 70,
    gap: SPACING.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOW.elevated,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  fabClose: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.elevated,
  },
});
