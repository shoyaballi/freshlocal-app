import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NotificationType = 'system' | 'promo' | 'order';

interface NotificationTypeOption {
  value: NotificationType;
  label: string;
  emoji: string;
  description: string;
}

const NOTIFICATION_TYPES: NotificationTypeOption[] = [
  {
    value: 'system',
    label: 'Info',
    emoji: '📢',
    description: 'General information or announcement',
  },
  {
    value: 'promo',
    label: 'Promo',
    emoji: '🎉',
    description: 'Promotional offer or deal',
  },
  {
    value: 'order',
    label: 'Alert',
    emoji: '🔔',
    description: 'Important alert or update',
  },
];

// ---------------------------------------------------------------------------
// Send Notification Screen
// ---------------------------------------------------------------------------

export default function SendNotificationScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<NotificationType>('system');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  const isValid = title.trim().length > 0 && body.trim().length > 0;

  const handleSend = useCallback(async () => {
    if (!isValid) return;

    Alert.alert(
      'Send Notification',
      `Send "${title}" to all users?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setSending(true);
            try {
              // Fetch all user IDs
              const { data: profiles, error: profilesErr } = await supabase
                .from('profiles')
                .select('id');

              if (profilesErr) throw profilesErr;

              if (!profiles || profiles.length === 0) {
                Alert.alert('No Users', 'There are no users to send notifications to.');
                setSending(false);
                return;
              }

              // Create notification records for all users
              const notifications = profiles.map((profile) => ({
                user_id: profile.id,
                title: title.trim(),
                body: body.trim(),
                type,
                is_read: false,
              }));

              // Insert in batches of 100 to avoid payload limits
              const batchSize = 100;
              let totalInserted = 0;

              for (let i = 0; i < notifications.length; i += batchSize) {
                const batch = notifications.slice(i, i + batchSize);
                const { error: insertErr } = await supabase
                  .from('notifications')
                  .insert(batch);

                if (insertErr) throw insertErr;
                totalInserted += batch.length;
              }

              setSentCount(totalInserted);
              setSent(true);
            } catch (err: any) {
              console.error('Send notification error:', err);
              Alert.alert('Error', err.message || 'Failed to send notifications');
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  }, [isValid, title, body, type]);

  const handleReset = useCallback(() => {
    setTitle('');
    setBody('');
    setType('system');
    setSent(false);
    setSentCount(0);
  }, []);

  // Success state
  if (sent) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header
          title="Send Notification"
          leftIcon={<Text style={styles.backArrow}>{'<'}</Text>}
          onLeftPress={() => router.back()}
        />
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>✅</Text>
          <Text style={styles.successTitle}>Notification Sent!</Text>
          <Text style={styles.successText}>
            Successfully sent to {sentCount} user{sentCount !== 1 ? 's' : ''}.
          </Text>

          <View style={styles.sentPreview}>
            <Text style={styles.sentPreviewTitle}>{title}</Text>
            <Text style={styles.sentPreviewBody}>{body}</Text>
          </View>

          <Button onPress={handleReset} style={styles.sendAnotherButton} fullWidth>
            Send Another
          </Button>
          <Button
            variant="ghost"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            Back to Dashboard
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Send Notification"
        leftIcon={<Text style={styles.backArrow}>{'<'}</Text>}
        onLeftPress={() => router.back()}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title Input */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Notification title..."
              placeholderTextColor={colors.grey400}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            <Text style={styles.charCount}>{title.length}/100</Text>
          </View>

          {/* Body Input */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Body</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Notification message..."
              placeholderTextColor={colors.grey400}
              value={body}
              onChangeText={setBody}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.charCount}>{body.length}/500</Text>
          </View>

          {/* Type Selector */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typeGrid}>
              {NOTIFICATION_TYPES.map((opt) => {
                const isSelected = type === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setType(opt.value)}
                    style={[
                      styles.typeCard,
                      isSelected && styles.typeCardSelected,
                    ]}
                  >
                    <Text style={styles.typeEmoji}>{opt.emoji}</Text>
                    <Text
                      style={[
                        styles.typeLabel,
                        isSelected && styles.typeLabelSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Text style={styles.typeDescription}>{opt.description}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Preview */}
          {title.trim() || body.trim() ? (
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Preview</Text>
              <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewEmoji}>
                    {NOTIFICATION_TYPES.find((t) => t.value === type)?.emoji}
                  </Text>
                  <Text style={styles.previewTitle} numberOfLines={1}>
                    {title || 'Notification title'}
                  </Text>
                </View>
                <Text style={styles.previewBody} numberOfLines={3}>
                  {body || 'Notification message will appear here...'}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Send Button */}
          <Button
            onPress={handleSend}
            disabled={!isValid || sending}
            loading={sending}
            fullWidth
            size="lg"
            style={styles.sendButton}
          >
            Send to All Users
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  backArrow: {
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    fontFamily: fonts.bodySemiBold,
  },

  // Fields
  fieldContainer: {
    marginBottom: spacing['2xl'],
  },
  fieldLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    minHeight: 48,
  },
  textArea: {
    minHeight: 120,
    paddingTop: spacing.md,
  },
  charCount: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: spacing.xs,
  },

  // Type Selector
  typeGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  typeCard: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  typeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryPale,
  },
  typeEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  typeLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  typeLabelSelected: {
    color: colors.primary,
  },
  typeDescription: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Preview
  previewCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  previewEmoji: {
    fontSize: fontSizes.lg,
    marginRight: spacing.sm,
  },
  previewTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    flex: 1,
  },
  previewBody: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Send Button
  sendButton: {
    marginTop: spacing.md,
  },

  // Success State
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3xl'],
  },
  successEmoji: {
    fontSize: 56,
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  successText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  sentPreview: {
    backgroundColor: colors.successPale,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing['2xl'],
  },
  sentPreviewTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sentPreviewBody: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  sendAnotherButton: {
    marginBottom: spacing.md,
  },
  backButton: {
    marginTop: spacing.xs,
  },
});
