import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PLATFORMS, RADIUS, SPACING, FONT_SIZE } from '@/constants';
import type { AIPlatform } from '@/types';

interface Props {
  platform: AIPlatform;
  size?: 'sm' | 'md';
}

export default function PlatformBadge({ platform, size = 'sm' }: Props) {
  const info = PLATFORMS.find(p => p.value === platform) || PLATFORMS[PLATFORMS.length - 1];
  const isMd = size === 'md';

  return (
    <View style={[styles.badge, { backgroundColor: info.color + '18' }]}>
      <Ionicons
        name={info.icon as any}
        size={isMd ? 14 : 12}
        color={info.color}
      />
      <Text style={[styles.text, { color: info.color }, isMd && styles.textMd]}>
        {info.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  text: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  textMd: {
    fontSize: FONT_SIZE.sm,
  },
});
