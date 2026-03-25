import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SHADOW } from '@/constants';
import { useThemeColors } from '@/hooks/useTheme';
import { useNavigationStore } from '@/stores/navigationStore';

export default function FAB() {
  const navigate = useNavigationStore(s => s.navigate);
  const colors = useThemeColors();

  return (
    <Pressable
      style={[styles.fab, { backgroundColor: colors.primary }]}
      onPress={() => navigate('CreatePrompt')}
    >
      <Ionicons name="add" size={28} color="#fff" />
    </Pressable>
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
});
