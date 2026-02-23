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
import { imageService, ImagePickerResult } from '@/services/imageService';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { DietaryBadge, SpiceLevel, FulfilmentType, Meal } from '@/types';

interface AddMealSheetProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: string;
  onMealAdded: () => void;
  /** Pass a meal to enter edit mode */
  meal?: Meal | null;
  /** Called after successful delete */
  onMealDeleted?: () => void;
}

interface MealForm {
  name: string;
  description: string;
  emoji: string;
  price: string;
  stock: string;
  prepTime: string;
  dietary: DietaryBadge[];
  spiceLevel: SpiceLevel;
  fulfilmentType: FulfilmentType;
}

const DIETARY_OPTIONS: { value: DietaryBadge; label: string; emoji: string }[] = [
  { value: 'halal', label: 'Halal', emoji: '🥩' },
  { value: 'vegetarian', label: 'Vegetarian', emoji: '🥬' },
  { value: 'vegan', label: 'Vegan', emoji: '🌱' },
  { value: 'gluten_free', label: 'Gluten Free', emoji: '🌾' },
];

const SPICE_OPTIONS: { value: SpiceLevel; label: string }[] = [
  { value: 0, label: 'No Spice' },
  { value: 1, label: 'Mild 🌶️' },
  { value: 2, label: 'Medium 🌶️🌶️' },
  { value: 3, label: 'Hot 🌶️🌶️🌶️' },
];

const FULFILMENT_OPTIONS: { value: FulfilmentType; label: string }[] = [
  { value: 'collection', label: '📍 Collection' },
  { value: 'delivery', label: '🚗 Delivery' },
  { value: 'both', label: '📍🚗 Both' },
];

const INITIAL_FORM: MealForm = {
  name: '',
  description: '',
  emoji: '🍽️',
  price: '',
  stock: '10',
  prepTime: '30',
  dietary: ['halal'],
  spiceLevel: 1,
  fulfilmentType: 'collection',
};

export function AddMealSheet({
  isOpen,
  onClose,
  vendorId,
  onMealAdded,
  meal,
  onMealDeleted,
}: AddMealSheetProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImagePickerResult | null>(null);
  const [imagePreviewUri, setImagePreviewUri] = useState<string | null>(null);
  const [form, setForm] = useState<MealForm>(INITIAL_FORM);

  const isEditMode = !!meal;

  // Pre-fill form when editing
  useEffect(() => {
    if (meal && isOpen) {
      setForm({
        name: meal.name,
        description: meal.description,
        emoji: meal.emoji,
        price: meal.price.toFixed(2),
        stock: String(meal.stock),
        prepTime: String(meal.prepTime),
        dietary: [...meal.dietary],
        spiceLevel: meal.spiceLevel,
        fulfilmentType: meal.fulfilmentType,
      });
      setImagePreviewUri(meal.imageUrl || null);
      setSelectedImage(null);
    } else if (!meal && isOpen) {
      resetForm();
    }
  }, [meal, isOpen]);

  const handleImageSelected = useCallback((image: ImagePickerResult) => {
    setSelectedImage(image);
    setImagePreviewUri(image.uri);
  }, []);

  const toggleDietary = (badge: DietaryBadge) => {
    setForm((prev) => ({
      ...prev,
      dietary: prev.dietary.includes(badge)
        ? prev.dietary.filter((d) => d !== badge)
        : [...prev.dietary, badge],
    }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Please enter a meal name');
      return;
    }
    if (!form.description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (!form.price || parseFloat(form.price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl: string | null = isEditMode ? (meal.imageUrl || null) : null;

      // Upload image if a new one was selected
      if (selectedImage && user) {
        const uploadResult = await imageService.uploadImage(
          selectedImage,
          user.id
        );
        imageUrl = uploadResult.url;
      }

      const mealData = {
        vendor_id: vendorId,
        name: form.name.trim(),
        description: form.description.trim(),
        emoji: form.emoji,
        image_url: imageUrl,
        price: parseFloat(form.price),
        dietary: form.dietary,
        spice_level: form.spiceLevel,
        stock: parseInt(form.stock) || 10,
        max_stock: parseInt(form.stock) || 10,
        fulfilment_type: form.fulfilmentType,
        prep_time: parseInt(form.prepTime) || 30,
        is_active: true,
      };

      if (isEditMode) {
        // Update existing meal
        const { error } = await supabase
          .from('meals')
          .update(mealData)
          .eq('id', meal.id);

        if (error) throw error;
        Alert.alert('Success', 'Meal updated successfully!');
      } else {
        // Get tomorrow's date as default available date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const availableDate = tomorrow.toISOString().split('T')[0];

        const { error } = await supabase.from('meals').insert({
          ...mealData,
          available_date: availableDate,
        });

        if (error) throw error;
        Alert.alert('Success', 'Meal added successfully!');
      }

      onMealAdded();
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving meal:', error);
      Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'add'} meal. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!meal) return;

    Alert.alert(
      'Delete Meal',
      `Are you sure you want to delete "${meal.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const { error } = await supabase
                .from('meals')
                .delete()
                .eq('id', meal.id);

              if (error) throw error;

              Alert.alert('Deleted', 'Meal has been removed.');
              onMealDeleted?.();
              onMealAdded();
              resetForm();
              onClose();
            } catch (error) {
              console.error('Error deleting meal:', error);
              Alert.alert('Error', 'Failed to delete meal. It may have existing orders.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setSelectedImage(null);
    setImagePreviewUri(null);
  };

  return (
    <BottomSheet
      isVisible={isOpen}
      onClose={onClose}
      snapPoints={[0.9]}
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
          <Text style={styles.sheetTitle}>
            {isEditMode ? 'Edit Meal' : 'Add New Meal'}
          </Text>

          {/* Image Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meal Photo</Text>
            <ImagePickerButton
              value={imagePreviewUri}
              onImageSelected={handleImageSelected}
              placeholder="Add a photo of your meal"
              disabled={isSubmitting}
            />
            <Text style={styles.hint}>
              A great photo helps customers see what they're ordering
            </Text>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Info</Text>
            <Input
              label="Meal Name"
              placeholder="e.g., Chicken Biryani"
              value={form.name}
              onChangeText={(text) => setForm((p) => ({ ...p, name: text }))}
              maxLength={50}
            />
            <Input
              label="Description"
              placeholder="Describe your meal..."
              value={form.description}
              onChangeText={(text) => setForm((p) => ({ ...p, description: text }))}
              multiline
              numberOfLines={3}
              maxLength={200}
              style={styles.textArea}
            />
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="Price (£)"
                  placeholder="0.00"
                  value={form.price}
                  onChangeText={(text) => setForm((p) => ({ ...p, price: text }))}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  label="Stock"
                  placeholder="10"
                  value={form.stock}
                  onChangeText={(text) => setForm((p) => ({ ...p, stock: text }))}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>

          {/* Dietary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dietary</Text>
            <View style={styles.optionGrid}>
              {DIETARY_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={form.dietary.includes(option.value) ? 'primary' : 'outline'}
                  size="sm"
                  onPress={() => toggleDietary(option.value)}
                  style={styles.optionButton}
                >
                  {option.emoji} {option.label}
                </Button>
              ))}
            </View>
          </View>

          {/* Spice Level */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spice Level</Text>
            <View style={styles.optionGrid}>
              {SPICE_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={form.spiceLevel === option.value ? 'primary' : 'outline'}
                  size="sm"
                  onPress={() => setForm((p) => ({ ...p, spiceLevel: option.value }))}
                  style={styles.optionButton}
                >
                  {option.label}
                </Button>
              ))}
            </View>
          </View>

          {/* Fulfilment */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fulfilment</Text>
            <View style={styles.optionGrid}>
              {FULFILMENT_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={form.fulfilmentType === option.value ? 'primary' : 'outline'}
                  size="sm"
                  onPress={() => setForm((p) => ({ ...p, fulfilmentType: option.value }))}
                  style={styles.optionButton}
                >
                  {option.label}
                </Button>
              ))}
            </View>
          </View>

          {/* Prep Time */}
          <View style={styles.section}>
            <Input
              label="Prep Time (minutes)"
              placeholder="30"
              value={form.prepTime}
              onChangeText={(text) => setForm((p) => ({ ...p, prepTime: text }))}
              keyboardType="number-pad"
            />
          </View>

          {/* Submit Button */}
          <View style={styles.submitSection}>
            <Button
              onPress={handleSubmit}
              disabled={isSubmitting || isDeleting}
              fullWidth
            >
              {isSubmitting
                ? (isEditMode ? 'Saving...' : 'Adding Meal...')
                : (isEditMode ? 'Save Changes' : 'Add Meal')
              }
            </Button>

            {isEditMode && (
              <Pressable
                onPress={handleDelete}
                disabled={isDeleting || isSubmitting}
                style={styles.deleteButton}
              >
                <Text style={[
                  styles.deleteText,
                  (isDeleting || isSubmitting) && styles.deleteTextDisabled,
                ]}>
                  {isDeleting ? 'Deleting...' : 'Delete Meal'}
                </Text>
              </Pressable>
            )}
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
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionButton: {
    minWidth: 100,
  },
  submitSection: {
    marginTop: spacing.lg,
    gap: spacing.lg,
    alignItems: 'center',
  },
  deleteButton: {
    paddingVertical: spacing.md,
  },
  deleteText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.error,
  },
  deleteTextDisabled: {
    opacity: 0.5,
  },
});

export default AddMealSheet;
