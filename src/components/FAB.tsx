import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW } from '@/constants';
import { useNavigationStore } from '@/stores/navigationStore';

export default function FAB() {
  const navigate = useNavigationStore(s => s.navigate);

  return (
    <Pressable
      style={styles.fab}
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
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.elevated,
  },
});
