import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { StarRating } from './StarRating';
import { useReviews } from '@/hooks/useReviews';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';

interface ReviewSheetProps {
  /** Whether the sheet is visible */
  isVisible: boolean;
  /** The order being reviewed */
  orderId: string;
  /** The vendor being reviewed */
  vendorId: string;
  /** Called when the sheet is closed */
  onClose: () => void;
  /** Called after a review is successfully submitted */
  onReviewSubmitted?: () => void;
}

export function ReviewSheet({
  isVisible,
  orderId,
  vendorId,
  onClose,
  onReviewSubmitted,
}: ReviewSheetProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createReview } = useReviews({ vendorId });

  const resetForm = useCallback(() => {
    setRating(0);
    setComment('');
    setIsSubmitting(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(async () => {
    if (rating === 0) {
      Alert.alert('Rating required', 'Please select a star rating before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);

      await createReview({
        vendorId,
        orderId,
        rating,
        comment: comment.trim() || undefined,
      });

      resetForm();
      onClose();
      onReviewSubmitted?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      Alert.alert('Could not submit review', message);
    } finally {
      setIsSubmitting(false);
    }
  }, [rating, comment, vendorId, orderId, createReview, resetForm, onClose, onReviewSubmitted]);

  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={handleClose}
      snapPoints={[0.55]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Text style={styles.title}>Leave a Review</Text>
          <Text style={styles.subtitle}>
            How was your experience? Your feedback helps the community.
          </Text>

          {/* Star selector */}
          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>
              {rating === 0
                ? 'Tap a star to rate'
                : rating === 1
                ? 'Poor'
                : rating === 2
                ? 'Below average'
                : rating === 3
                ? 'Average'
                : rating === 4
                ? 'Good'
                : 'Excellent'}
            </Text>
            <StarRating
              rating={rating}
              size={36}
              interactive
              onRatingChange={setRating}
              style={styles.starSelector}
            />
          </View>

          {/* Comment */}
          <View style={styles.commentSection}>
            <Text style={styles.commentLabel}>Comment (optional)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Tell others about your experience..."
              placeholderTextColor={colors.grey400}
              multiline
              numberOfLines={4}
              maxLength={500}
              value={comment}
              onChangeText={setComment}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{comment.length}/500</Text>
          </View>

          {/* Submit */}
          <Button
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={rating === 0}
            fullWidth
            size="lg"
            style={styles.submitButton}
          >
            Submit Review
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  ratingLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  starSelector: {
    gap: spacing.sm,
  },
  commentSection: {
    marginBottom: spacing.xl,
  },
  commentLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  commentInput: {
    backgroundColor: colors.backgroundWhite,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    padding: spacing.lg,
    minHeight: 100,
  },
  charCount: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  submitButton: {
    marginBottom: spacing['2xl'],
  },
});

export default ReviewSheet;
