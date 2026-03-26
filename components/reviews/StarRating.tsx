import React from 'react';
import { View, Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, fontSizes, spacing } from '@/constants/theme';

interface StarRatingProps {
  /** Current rating value (1-5) */
  rating: number;
  /** Maximum number of stars */
  maxStars?: number;
  /** Star size in pixels */
  size?: number;
  /** Whether stars are tappable */
  interactive?: boolean;
  /** Called when a star is tapped (only when interactive) */
  onRatingChange?: (rating: number) => void;
  /** Container style override */
  style?: ViewStyle;
  /** Show the numeric rating beside the stars */
  showValue?: boolean;
}

export function StarRating({
  rating,
  maxStars = 5,
  size = 20,
  interactive = false,
  onRatingChange,
  style,
  showValue = false,
}: StarRatingProps) {
  const handlePress = (starIndex: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starIndex + 1);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: maxStars }).map((_, index) => {
        const filled = index < Math.round(rating);
        const starChar = filled ? '\u2605' : '\u2606';

        if (interactive) {
          return (
            <Pressable
              key={index}
              onPress={() => handlePress(index)}
              hitSlop={4}
              style={styles.starPressable}
            >
              <Text
                style={[
                  styles.star,
                  { fontSize: size },
                  filled ? styles.starFilled : styles.starEmpty,
                ]}
              >
                {starChar}
              </Text>
            </Pressable>
          );
        }

        return (
          <Text
            key={index}
            style={[
              styles.star,
              { fontSize: size },
              filled ? styles.starFilled : styles.starEmpty,
            ]}
          >
            {starChar}
          </Text>
        );
      })}

      {showValue && rating > 0 && (
        <Text style={[styles.ratingValue, { fontSize: size * 0.7 }]}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starPressable: {
    padding: spacing.xs,
  },
  star: {
    lineHeight: undefined,
  },
  starFilled: {
    color: colors.accent,
  },
  starEmpty: {
    color: colors.grey300,
  },
  ratingValue: {
    color: colors.textPrimary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
});

export default StarRating;
