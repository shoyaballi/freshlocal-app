import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button, Input, Card, Badge } from '@/components/ui';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';
import { useAppStore } from '@/stores/appStore';
import type { BusinessType, FoodTag } from '@/types';

const BUSINESS_TYPES: { value: BusinessType; label: string; emoji: string }[] = [
  { value: 'home_kitchen', label: 'Home Kitchen', emoji: '🏠' },
  { value: 'shop', label: 'Shop', emoji: '🏪' },
  { value: 'popup', label: 'Pop-up', emoji: '⛺' },
];

const FOOD_TAGS: { value: FoodTag; label: string }[] = [
  { value: 'halal', label: 'Halal' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'pakistani', label: 'Pakistani' },
  { value: 'bangladeshi', label: 'Bangladeshi' },
  { value: 'indian', label: 'Indian' },
  { value: 'middle_eastern', label: 'Middle Eastern' },
  { value: 'grill', label: 'Grill' },
  { value: 'street_food', label: 'Street Food' },
  { value: 'bakery', label: 'Bakery' },
];

export default function VendorSignupScreen() {
  const [step, setStep] = useState(1);
  const { setIsVendor } = useAppStore();

  // Step 1 fields
  const [businessName, setBusinessName] = useState('');
  const [handle, setHandle] = useState('');
  const [description, setDescription] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [selectedTags, setSelectedTags] = useState<FoodTag[]>([]);

  // Step 2 fields
  const [phone, setPhone] = useState('');
  const [postcode, setPostcode] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleTag = (tag: FoodTag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    if (!handle.trim()) {
      newErrors.handle = 'Instagram handle is required';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!businessType) {
      newErrors.businessType = 'Please select a business type';
    }

    if (selectedTags.length === 0) {
      newErrors.tags = 'Please select at least one food tag';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!postcode.trim()) {
      newErrors.postcode = 'Postcode is required';
    }

    if (!acceptedTerms) {
      newErrors.terms = 'You must accept the terms to continue';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = () => {
    if (validateStep2()) {
      // TODO: Submit to backend
      setIsVendor(true);
      router.replace('/dashboard');
    }
  };

  const renderStep1 = () => (
    <>
      <Text style={styles.stepTitle}>Tell us about your business</Text>

      <Input
        label="Business Name"
        placeholder="e.g. Ammi's Kitchen"
        value={businessName}
        onChangeText={setBusinessName}
        error={errors.businessName}
      />

      <Input
        label="Instagram Handle"
        placeholder="@yourbusiness"
        value={handle}
        onChangeText={(text) => setHandle(text.replace('@', ''))}
        error={errors.handle}
        leftIcon={<Text style={styles.atSymbol}>@</Text>}
      />

      <Input
        label="Description"
        placeholder="Tell customers about your food and what makes it special..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        error={errors.description}
        inputStyle={styles.textArea}
      />

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Business Type</Text>
        <View style={styles.businessTypes}>
          {BUSINESS_TYPES.map((type) => (
            <Pressable
              key={type.value}
              onPress={() => setBusinessType(type.value)}
              style={[
                styles.businessTypeCard,
                businessType === type.value && styles.businessTypeCardActive,
              ]}
            >
              <Text style={styles.businessTypeEmoji}>{type.emoji}</Text>
              <Text
                style={[
                  styles.businessTypeLabel,
                  businessType === type.value && styles.businessTypeLabelActive,
                ]}
              >
                {type.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {errors.businessType && (
          <Text style={styles.errorText}>{errors.businessType}</Text>
        )}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Food Tags</Text>
        <Text style={styles.hint}>Select all that apply to your food</Text>
        <View style={styles.tagGrid}>
          {FOOD_TAGS.map((tag) => (
            <Pressable
              key={tag.value}
              onPress={() => toggleTag(tag.value)}
              style={[
                styles.tagChip,
                selectedTags.includes(tag.value) && styles.tagChipActive,
              ]}
            >
              <Text
                style={[
                  styles.tagChipText,
                  selectedTags.includes(tag.value) && styles.tagChipTextActive,
                ]}
              >
                {tag.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {errors.tags && <Text style={styles.errorText}>{errors.tags}</Text>}
      </View>

      <Button onPress={handleNextStep} fullWidth size="lg">
        Continue
      </Button>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.stepTitle}>Contact & Legal</Text>

      <Input
        label="Phone Number"
        placeholder="+44 7700 900000"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        error={errors.phone}
      />

      <Input
        label="Postcode"
        placeholder="BB1 1AA"
        value={postcode}
        onChangeText={setPostcode}
        autoCapitalize="characters"
        error={errors.postcode}
      />

      <Card style={styles.infoCard}>
        <Text style={styles.infoEmoji}>📋</Text>
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Food Registration</Text>
          <Text style={styles.infoText}>
            To sell food in the UK, you must register with your local council.
            We'll help guide you through this process after signup.
          </Text>
        </View>
      </Card>

      <Card style={styles.commissionCard}>
        <Text style={styles.commissionTitle}>Commission Structure</Text>
        <View style={styles.commissionRow}>
          <Text style={styles.commissionLabel}>Platform fee</Text>
          <Text style={styles.commissionValue}>12%</Text>
        </View>
        <View style={styles.commissionRow}>
          <Text style={styles.commissionLabel}>Customer service fee</Text>
          <Text style={styles.commissionValue}>5% (paid by customer)</Text>
        </View>
        <View style={styles.commissionRow}>
          <Text style={styles.commissionLabel}>Stripe processing</Text>
          <Text style={styles.commissionValue}>1.4% + 20p</Text>
        </View>
        <Text style={styles.commissionNote}>
          You receive your payout minus platform and Stripe fees every Tuesday.
        </Text>
      </Card>

      <View style={styles.termsRow}>
        <Switch
          value={acceptedTerms}
          onValueChange={setAcceptedTerms}
          trackColor={{ false: colors.grey300, true: colors.primaryLight }}
          thumbColor={acceptedTerms ? colors.primary : colors.grey100}
        />
        <Text style={styles.termsText}>
          I agree to the{' '}
          <Text style={styles.termsLink}>Vendor Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Food Safety Guidelines</Text>
        </Text>
      </View>
      {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}

      <View style={styles.buttonRow}>
        <Button variant="outline" onPress={() => setStep(1)} style={styles.backBtn}>
          Back
        </Button>
        <Button onPress={handleSubmit} style={styles.submitBtn}>
          Start Selling
        </Button>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.logo}>FreshLocal</Text>
          <Text style={styles.subtitle}>Become a Vendor</Text>
        </View>

        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
          <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
        </View>

        <View style={styles.form}>
          {step === 1 ? renderStep1() : renderStep2()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: spacing.sm,
  },
  closeText: {
    fontSize: fontSizes.xl,
    color: colors.grey400,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  logo: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['2xl'],
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.grey300,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: colors.grey300,
    marginHorizontal: spacing.sm,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  form: {
    gap: spacing.lg,
  },
  stepTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  atSymbol: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
    color: colors.grey400,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  businessTypes: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  businessTypeCard: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  businessTypeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.accentPale,
  },
  businessTypeEmoji: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  businessTypeLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  businessTypeLabelActive: {
    color: colors.primary,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tagChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  tagChipTextActive: {
    color: colors.backgroundWhite,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.accentPale,
  },
  infoEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  commissionCard: {
    backgroundColor: colors.cardBackground,
  },
  commissionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  commissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  commissionLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  commissionValue: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  commissionNote: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textLight,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  termsText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary,
    fontFamily: fonts.bodyMedium,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  backBtn: {
    flex: 1,
  },
  submitBtn: {
    flex: 2,
  },
});
