import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Alert, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';
import { imageService, ImagePickerResult } from '@/services/imageService';

interface ImagePickerButtonProps {
  value?: string | null;
  onImageSelected: (image: ImagePickerResult) => void;
  placeholder?: string;
  aspectRatio?: [number, number];
  disabled?: boolean;
}

export function ImagePickerButton({
  value,
  onImageSelected,
  placeholder = 'Add Photo',
  disabled = false,
}: ImagePickerButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const showImageSourcePicker = () => {
    Alert.alert(
      'Add Photo',
      'Choose how to add your meal photo',
      [
        {
          text: 'Take Photo',
          onPress: handleTakePhoto,
        },
        {
          text: 'Choose from Library',
          onPress: handleChooseFromLibrary,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleTakePhoto = async () => {
    try {
      setIsLoading(true);
      const image = await imageService.pickFromCamera();
      if (image) {
        onImageSelected(image);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please check camera permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChooseFromLibrary = async () => {
    try {
      setIsLoading(true);
      const image = await imageService.pickFromLibrary();
      if (image) {
        onImageSelected(image);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select photo. Please check photo library permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Pressable
      onPress={showImageSourcePicker}
      disabled={disabled || isLoading}
      style={[styles.container, disabled && styles.containerDisabled]}
    >
      {value ? (
        <Animated.View entering={FadeIn} style={styles.imageContainer}>
          <Image source={{ uri: value }} style={styles.image} resizeMode="cover" />
          <View style={styles.editOverlay}>
            <Text style={styles.editText}>Tap to change</Text>
          </View>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn} style={styles.placeholder}>
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <>
              <Text style={styles.placeholderIcon}>📷</Text>
              <Text style={styles.placeholderText}>{placeholder}</Text>
              <Text style={styles.placeholderHint}>Tap to add a photo</Text>
            </>
          )}
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.grey100,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  containerDisabled: {
    opacity: 0.5,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  editText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.backgroundWhite,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  placeholderText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  placeholderHint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
});

export default ImagePickerButton;
