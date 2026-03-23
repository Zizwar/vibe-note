import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants';
import { useThemeColors } from '@/hooks/useTheme';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export default function ConfirmDialog({
  visible, title, message, confirmText = 'Delete', cancelText = 'Cancel',
  onConfirm, onCancel, destructive = true,
}: Props) {
  const colors = useThemeColors();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.dialog, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
          <View style={styles.actions}>
            <Pressable style={[styles.cancelBtn, { backgroundColor: colors.background }]} onPress={onCancel}>
              <Text style={[styles.cancelText, { color: colors.text }]}>{cancelText}</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmBtn, { backgroundColor: colors.primary }, destructive && { backgroundColor: colors.danger }]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxxl,
  },
  dialog: {
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    width: '100%',
    ...SHADOW.elevated,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  message: {
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  cancelText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  confirmText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#fff',
  },
});
