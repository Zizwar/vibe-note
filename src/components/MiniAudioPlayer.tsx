import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as LegacyFS from 'expo-file-system/legacy';
import { RADIUS, SPACING, FONT_SIZE } from '@/constants';
import { useThemeColors } from '@/hooks/useTheme';

interface Props {
  audioBase64: string;
}

export default function MiniAudioPlayer({ audioBase64 }: Props) {
  const colors = useThemeColors();
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(true);

  const player = useAudioPlayer(audioUri ? { uri: audioUri } : null);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    let cancelled = false;
    const prepare = async () => {
      try {
        const uri = (LegacyFS.cacheDirectory || '') + 'proomy_audio_note.m4a';
        await LegacyFS.writeAsStringAsync(uri, audioBase64, {
          encoding: LegacyFS.EncodingType.Base64,
        });
        if (!cancelled) {
          setAudioUri(uri);
          setPreparing(false);
        }
      } catch {
        if (!cancelled) setPreparing(false);
      }
    };
    prepare();
    return () => { cancelled = true; };
  }, [audioBase64]);

  useEffect(() => {
    if (audioUri) {
      player.replace({ uri: audioUri });
    }
  }, [audioUri]);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const duration = status?.duration ?? 0;
  const current = status?.currentTime ?? 0;
  const progress = duration > 0 ? current / duration : 0;

  const handleToggle = () => {
    if (status?.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const handleSeek = (ratio: number) => {
    if (duration > 0) {
      player.seekTo(ratio * duration);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.warning + '12', borderColor: colors.warning + '30' }]}>
      <Ionicons name="mic" size={14} color={colors.warning} />

      {preparing ? (
        <ActivityIndicator size="small" color={colors.warning} style={{ marginHorizontal: SPACING.sm }} />
      ) : (
        <Pressable onPress={handleToggle} hitSlop={8}>
          <Ionicons
            name={status?.playing ? 'pause-circle' : 'play-circle'}
            size={28}
            color={colors.warning}
          />
        </Pressable>
      )}

      {/* Progress bar */}
      <View style={styles.progressWrapper}>
        <Pressable
          style={[styles.progressBg, { backgroundColor: colors.warning + '25' }]}
          onPress={(e) => {
            // simple tap-to-seek on progress bar
          }}
        >
          <View style={[styles.progressFill, { backgroundColor: colors.warning, width: `${progress * 100}%` as any }]} />
        </Pressable>
        <Text style={[styles.timeText, { color: colors.warning }]}>
          {formatTime(current)} / {formatTime(duration)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  progressWrapper: {
    flex: 1,
    gap: 4,
  },
  progressBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
});
