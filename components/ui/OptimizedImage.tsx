import React, { useState, useCallback } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, borderRadius } from '@/constants/theme';
import { imageService } from '@/services/imageService';

type ImageSize = 'thumbnail' | 'card' | 'full';

interface OptimizedImageProps {
  uri?: string | null;
  fallbackEmoji?: string;
  size?: ImageSize;
  style?: object;
  borderRadiusSize?: keyof typeof borderRadius;
}

const SIZE_CONFIGS: Record<ImageSize, { width: number; height: number }> = {
  thumbnail: { width: 80, height: 60 },
  card: { width: 200, height: 150 },
  full: { width: 400, height: 300 },
};

export function OptimizedImage({
  uri,
  fallbackEmoji = '🍽️',
  size = 'card',
  style,
  borderRadiusSize = 'md',
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  // Get optimized URL based on size
  const optimizedUrl = uri
    ? size === 'thumbnail'
      ? imageService.getThumbnailUrl(uri)
      : size === 'full'
      ? imageService.getFullSizeUrl(uri)
      : imageService.getOptimizedUrl(uri, SIZE_CONFIGS[size])
    : null;

  // Show emoji fallback if no image or error
  if (!uri || hasError) {
    return (
      <View
        style={[
          styles.container,
          styles.fallbackContainer,
          { borderRadius: borderRadius[borderRadiusSize] },
          style,
        ]}
      >
        <Animated.Text entering={FadeIn} style={styles.fallbackEmoji}>
          {fallbackEmoji}
        </Animated.Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { borderRadius: borderRadius[borderRadiusSize] },
        style,
      ]}
    >
      {isLoading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      <Animated.View entering={FadeIn} style={StyleSheet.absoluteFill}>
        <Image
          source={{ uri: optimizedUrl || uri }}
          style={styles.image}
          resizeMode="cover"
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: colors.grey100,
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentPale,
  },
  fallbackEmoji: {
    fontSize: 48,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.grey100,
  },
});

export default OptimizedImage;
