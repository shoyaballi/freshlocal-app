import React, { useState, useEffect } from 'react';
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
import { BottomSheet, Button, Input } from '@/components/ui';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';

interface ProfileEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
}

interface ProfileForm {
  name: string;
  phone: string;
  postcode: string;
}

export function ProfileEditSheet({
  isOpen,
  onClose,
  onProfileUpdated,
}: ProfileEditSheetProps) {
  const { user, updateProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    name: '',
    phone: '',
    postcode: '',
  });

  // Pre-fill form when opening
  useEffect(() => {
    if (user && isOpen) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        postcode: user.postcode || '',
      });
    }
  }, [user, isOpen]);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        postcode: form.postcode.trim().toUpperCase() || undefined,
      });

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully!');
      onProfileUpdated?.();
      onClose();
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isVisible={isOpen}
      onClose={onClose}
      snapPoints={[0.7]}
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

          {/* Avatar preview */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {form.name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          </View>

          {/* Personal Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <Input
              label="Full Name"
              placeholder="e.g., Fatima Khan"
              value={form.name}
              onChangeText={(text) => setForm((p) => ({ ...p, name: text }))}
              maxLength={60}
              autoCapitalize="words"
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

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <Input
              label="Postcode"
              placeholder="e.g., B11 1QR"
              value={form.postcode}
              onChangeText={(text) => setForm((p) => ({ ...p, postcode: text }))}
              autoCapitalize="characters"
              maxLength={10}
            />
            <Text style={styles.hint}>
              Your postcode helps us show nearby vendors and delivery options.
            </Text>
          </View>

          {/* Read-only info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Info</Text>
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyLabel}>Email</Text>
              <Text style={styles.readOnlyValue}>{user?.email || '-'}</Text>
            </View>
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyLabel}>Member Since</Text>
              <Text style={styles.readOnlyValue}>
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-GB', {
                      month: 'long',
                      year: 'numeric',
                    })
                  : '-'}
              </Text>
            </View>
            <Text style={styles.readOnlyHint}>
              Contact support to change your email address.
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes['3xl'],
    color: colors.backgroundWhite,
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
    marginTop: spacing.xs,
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
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: spacing.md,
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

export default ProfileEditSheet;
