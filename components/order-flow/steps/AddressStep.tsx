import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Button, Input } from '@/components/ui';
import { AddressCard } from '../components';
import { useOrderFlow } from '../OrderFlowContext';
import { useAddresses } from '@/hooks';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';
import type { Address } from '@/types';

export function AddressStep() {
  const { state, dispatch } = useOrderFlow();
  const { addresses, isLoading, createAddress } = useAddresses();
  const [showAddForm, setShowAddForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [label, setLabel] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('Blackburn');
  const [postcode, setPostcode] = useState('');
  const [formError, setFormError] = useState('');

  const handleSelectAddress = (address: Address) => {
    dispatch({ type: 'SET_ADDRESS', payload: address });
  };

  const handleAddAddress = async () => {
    // Validate
    if (!label.trim() || !line1.trim() || !city.trim() || !postcode.trim()) {
      setFormError('Please fill in all required fields');
      return;
    }

    setFormError('');
    setIsCreating(true);

    try {
      const newAddress = await createAddress({
        label: label.trim(),
        line1: line1.trim(),
        line2: line2.trim() || undefined,
        city: city.trim(),
        postcode: postcode.trim().toUpperCase(),
        isDefault: addresses.length === 0,
      });

      if (newAddress) {
        dispatch({ type: 'SET_ADDRESS', payload: newAddress });
        setShowAddForm(false);
        // Reset form
        setLabel('');
        setLine1('');
        setLine2('');
        setPostcode('');
      }
    } catch (error) {
      setFormError('Failed to save address. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleContinue = () => {
    dispatch({ type: 'NEXT_STEP' });
  };

  const handleBack = () => {
    dispatch({ type: 'PREV_STEP' });
  };

  const canContinue = state.selectedAddress !== null;

  if (showAddForm) {
    return (
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => setShowAddForm(false)} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Back to addresses</Text>
        </Pressable>

        <Text style={styles.title}>Add new address</Text>

        <View style={styles.form}>
          <Input
            label="Label"
            placeholder="e.g. Home, Work"
            value={label}
            onChangeText={setLabel}
            autoCapitalize="words"
          />

          <Input
            label="Address Line 1"
            placeholder="Street address"
            value={line1}
            onChangeText={setLine1}
          />

          <Input
            label="Address Line 2 (optional)"
            placeholder="Apartment, suite, etc."
            value={line2}
            onChangeText={setLine2}
          />

          <Input
            label="City"
            placeholder="City"
            value={city}
            onChangeText={setCity}
          />

          <Input
            label="Postcode"
            placeholder="BB1 1AA"
            value={postcode}
            onChangeText={setPostcode}
            autoCapitalize="characters"
          />

          {formError ? <Text style={styles.error}>{formError}</Text> : null}

          <Button
            onPress={handleAddAddress}
            loading={isCreating}
            fullWidth
            style={styles.addButton}
          >
            Save Address
          </Button>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <Pressable onPress={handleBack} style={styles.backLink}>
        <Text style={styles.backLinkText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Delivery address</Text>
      <Text style={styles.subtitle}>
        Select an address or add a new one
      </Text>

      {isLoading ? (
        <Text style={styles.loadingText}>Loading addresses...</Text>
      ) : (
        <View style={styles.addressList}>
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              selected={state.selectedAddress?.id === address.id}
              onPress={() => handleSelectAddress(address)}
            />
          ))}

          <Pressable
            onPress={() => setShowAddForm(true)}
            style={styles.addNewButton}
          >
            <Text style={styles.addNewText}>+ Add new address</Text>
          </Pressable>
        </View>
      )}

      <Button
        onPress={handleContinue}
        disabled={!canContinue}
        fullWidth
        style={styles.continueButton}
      >
        Continue
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing['3xl'],
  },
  backLink: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  backLinkText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
    color: colors.primary,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  addressList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  addNewButton: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    alignItems: 'center',
  },
  addNewText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.primary,
  },
  continueButton: {
    marginTop: 'auto',
  },
  form: {
    gap: spacing.sm,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.error,
    textAlign: 'center',
  },
  addButton: {
    marginTop: spacing.md,
  },
});

export default AddressStep;
