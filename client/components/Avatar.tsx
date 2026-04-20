import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';

interface AvatarProps {
  uri?: string;
  displayName?: string;
  size?: number;
  isOnline?: boolean;
  style?: ViewStyle;
}

export default function Avatar({ uri, displayName = '?', size = 44, isOnline, style }: AvatarProps) {
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={[styles.wrapper, { width: size, height: size }, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { width: size, height: size, borderRadius: size / 2, backgroundColor: COLORS.bgElevated },
          ]}
        >
          <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials}</Text>
        </View>
      )}
      {isOnline !== undefined && (
        <View
          style={[
            styles.onlineDot,
            {
              width: size * 0.27,
              height: size * 0.27,
              borderRadius: size * 0.135,
              backgroundColor: isOnline ? COLORS.online : COLORS.offline,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative' },
  placeholder: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  initials: { color: COLORS.textSecondary, fontWeight: '700' },
  onlineDot: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
});
