import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable, Platform } from 'react-native';
import { colors, borderRadius, shadows, spacing } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  padding?: keyof typeof spacing | number;
  noPadding?: boolean;
}

export function Card({
  children,
  style,
  onPress,
  padding = 'lg',
  noPadding = false,
}: CardProps) {
  const paddingValue = noPadding
    ? 0
    : typeof padding === 'number'
    ? padding
    : spacing[padding];

  const cardStyle = [
    styles.card,
    { padding: paddingValue },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed, hovered }: any) => [
          cardStyle,
          pressed && styles.pressed,
          Platform.OS === 'web' && styles.interactive,
          Platform.OS === 'web' && hovered && styles.hovered,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  interactive: {
    cursor: 'pointer' as any,
    // @ts-ignore web transition
    transitionProperty: 'transform, box-shadow',
    transitionDuration: '150ms',
  },
  hovered: {
    transform: [{ scale: 1.01 }, { translateY: -2 }],
    ...shadows.lg,
  },
});

export default Card;
