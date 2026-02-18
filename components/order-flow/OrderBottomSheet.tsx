import React, { useEffect } from 'react';
import { BottomSheet } from '@/components/ui';
import { OrderFlowProvider, useOrderFlow } from './OrderFlowContext';
import {
  MealDetailStep,
  AddressStep,
  TimeSlotStep,
  ReviewStep,
  ConfirmationStep,
} from './steps';
import type { Meal, Vendor } from '@/types';

interface OrderBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  meal: Meal | null;
  vendor: Vendor | null;
}

function OrderFlowContent({ onClose }: { onClose: () => void }) {
  const { state } = useOrderFlow();

  switch (state.step) {
    case 'detail':
      return <MealDetailStep />;
    case 'address':
      return <AddressStep />;
    case 'timeslot':
      return <TimeSlotStep />;
    case 'review':
      return <ReviewStep />;
    case 'confirmation':
      return <ConfirmationStep onClose={onClose} />;
    default:
      return null;
  }
}

export function OrderBottomSheet({
  isVisible,
  onClose,
  meal,
  vendor,
}: OrderBottomSheetProps) {
  // Don't render if no meal/vendor
  if (!meal || !vendor) {
    return null;
  }

  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={onClose}
      snapPoints={[0.85]}
    >
      <OrderFlowProvider initialMeal={meal} initialVendor={vendor}>
        <OrderFlowContent onClose={onClose} />
      </OrderFlowProvider>
    </BottomSheet>
  );
}

export default OrderBottomSheet;
