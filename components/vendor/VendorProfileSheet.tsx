import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { BottomSheet, Button, Input, ImagePickerButton } from '@/components/ui';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';
import type { ImagePickerResult } from '@/services/imageService';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Vendor } from '@/types';

interface VendorProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor;
  onProfileUpdated: () => void;
}

interface ProfileForm {
  businessName: string;
  description: string;
  postcode: string;
  phone: string;
}

const AVATAR_BUCKET = 'meal-images'; // Reuse existing bucket with a vendor-avatars/ prefix

export function VendorProfileSheet({
  isOpen,
  onClose,
  vendor,
  onProfileUpdated,
}: VendorProfileSheetProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImagePickerResult | null>(null);
  const [avatarPreviewUri, setAvatarPreviewUri] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    businessName: '',
    description: '',
    postcode: '',
    phone: '',
  });

  // Pre-fill form when opening
  useEffect(() => {
    if (vendor && isOpen) {
      setForm({
        businessName: vendor.businessName || '',
        description: vendor.description || '',
        postcode: vendor.postcode || '',
        phone: vendor.phone || '',
      });
      // If the avatar looks like a URL (not an emoji), show it as a preview
      const isUrl = vendor.avatar && (vendor.avatar.startsWith('http') || vendor.avatar.startsWith('/'));
      setAvatarPreviewUri(isUrl ? vendor.avatar : null);
      setSelectedImage(null);
    }
  }, [vendor, isOpen]);

  const handleImageSelected = useCallback((image: ImagePickerResult) => {
    setSelectedImage(image);
    setAvatarPreviewUri(image.uri);
  }, []);

  const handleSubmit = async () => {
    if (!form.businessName.trim()) {
      Alert.alert('Error', 'Please enter your business name');
      return;
    }
    if (!form.postcode.trim()) {
      Alert.alert('Error', 'Please enter your postcode');
      return;
    }

    setIsSubmitting(true);

    try {
      let avatarUrl: string | null = vendor.avatar || null;

      // Upload new avatar if one was selected
      if (selectedImage && user) {
        const timestamp = Date.now();
        const filename = `vendor-avatars/${vendor.id}_${timestamp}.jpg`;

        if (!selectedImage.base64) {
          throw new Error('No image data available');
        }

        const { decode } = await import('base64-arraybuffer');
        const arrayBuffer = decode(selectedImage.base64);

        const { error: uploadError } = await supabase.storage
          .from(AVATAR_BUCKET)
          .upload(filename, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from(AVATAR_BUCKET)
          .getPublicUrl(filename);

        avatarUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('vendors')
        .update({
          business_name: form.businessName.trim(),
          description: form.description.trim(),
          postcode: form.postcode.trim().toUpperCase(),
          phone: form.phone.trim(),
          avatar: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vendor.id);

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully!');
      onProfileUpdated();
      onClose();
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine what to show as the current avatar
  const isEmojiAvatar = vendor.avatar && !vendor.avatar.startsWith('http') && !vendor.avatar.startsWith('/');

  return (
    <BottomSheet
      isVisible={isOpen}
      onClose={onClose}
      snapPoints={[0.85]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Text style={styles.sheetTitle}>Edit Profile</Text>

          {/* Avatar Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business Logo</Text>

            {/* Current emoji avatar display */}
            {isEmojiAvatar && !avatarPreviewUri && (
              <View style={styles.currentEmojiContainer}>
                <Text style={styles.currentEmoji}>{vendor.avatar}</Text>
                <Text style={styles.emojiHint}>
                  Upload an image to replace your emoji avatar
                </Text>
              </View>
            )}

            <ImagePickerButton
              value={avatarPreviewUri}
              onImageSelected={handleImageSelected}
              placeholder="Upload your business logo"
              disabled={isSubmitting}
            />
            <Text style={styles.hint}>
              A professional logo helps customers recognise your brand
            </Text>
          </View>

          {/* Business Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business Details</Text>
            <Input
              label="Business Name"
              placeholder="e.g., Amina's Kitchen"
              value={form.businessName}
              onChangeText={(text) => setForm((p) => ({ ...p, businessName: text }))}
              maxLength={60}
            />
            <Input
              label="Description"
              placeholder="Tell customers about your food..."
              value={form.description}
              onChangeText={(text) => setForm((p) => ({ ...p, description: text }))}
              multiline
              numberOfLines={4}
              maxLength={300}
              style={styles.textArea}
            />
          </View>

          {/* Contact & Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact & Location</Text>
            <Input
              label="Postcode"
              placeholder="e.g., B11 1QR"
              value={form.postcode}
              onChangeText={(text) => setForm((p) => ({ ...p, postcode: text }))}
              autoCapitalize="characters"
              maxLength={10}
            />
            <Input
              label="Phone Number"
              placeholder="e.g., 07123 456789"
              value={form.phone}
              onChangeText={(text) => setForm((p) => ({ ...p, phone: text }))}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>

          {/* Read-only info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Info</Text>
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyLabel}>Handle</Text>
              <Text style={styles.readOnlyValue}>@{vendor.handle}</Text>
            </View>
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyLabel}>Business Type</Text>
              <Text style={styles.readOnlyValue}>
                {vendor.businessType === 'home_kitchen'
                  ? 'Home Kitchen'
                  : vendor.businessType === 'shop'
                  ? 'Shop'
                  : 'Pop-up'}
              </Text>
            </View>
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyLabel}>Verified</Text>
              <Text style={styles.readOnlyValue}>
                {vendor.isVerified ? 'Yes' : 'Not yet'}
              </Text>
            </View>
            <Text style={styles.readOnlyHint}>
              Contact support to change your handle or business type.
            </Text>
          </View>

          {/* Submit Button */}
          <View style={styles.submitSection}>
            <Button
              onPress={handleSubmit}
              disabled={isSubmitting}
              loading={isSubmitting}
              fullWidth
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>

            <Pressable
              onPress={onClose}
              disabled={isSubmitting}
              style={styles.cancelButton}
            >
              <Text style={[
                styles.cancelText,
                isSubmitting && styles.cancelTextDisabled,
              ]}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  sheetTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  currentEmojiContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primaryPale,
    borderRadius: borderRadius.md,
  },
  currentEmoji: {
    fontSize: 48,
    marginBottom: spacing.xs,
  },
  emojiHint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  readOnlyLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  readOnlyValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  readOnlyHint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textLight,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  submitSection: {
    marginTop: spacing.lg,
    gap: spacing.lg,
    alignItems: 'center',
  },
  cancelButton: {
    paddingVertical: spacing.md,
  },
  cancelText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  cancelTextDisabled: {
    opacity: 0.5,
  },
});

export default VendorProfileSheet;
