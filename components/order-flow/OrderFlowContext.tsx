import React, { createContext, useContext, useReducer, useMemo } from 'react';
import type { Meal, Vendor, Address, Order, FulfilmentType } from '@/types';

// Flow steps
export type OrderStep = 'detail' | 'address' | 'timeslot' | 'review' | 'confirmation';

// State interface
export interface OrderFlowState {
  step: OrderStep;
  meal: Meal | null;
  vendor: Vendor | null;
  fulfilmentType: FulfilmentType | null;
  quantity: number;
  selectedAddress: Address | null;
  selectedTimeSlot: string | null;
  notes: string;
  promoCodeId: string | null;
  discountAmount: number;
  createdOrder: Order | null;
  isSubmitting: boolean;
  error: string | null;
}

// Computed values
export interface OrderFlowComputed {
  subtotal: number;
  serviceFee: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;
}

// Actions
type OrderFlowAction =
  | { type: 'SET_MEAL'; payload: { meal: Meal; vendor: Vendor } }
  | { type: 'SET_FULFILMENT_TYPE'; payload: FulfilmentType }
  | { type: 'SET_QUANTITY'; payload: number }
  | { type: 'SET_ADDRESS'; payload: Address }
  | { type: 'SET_TIME_SLOT'; payload: string }
  | { type: 'SET_NOTES'; payload: string }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; payload: OrderStep }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS'; payload: Order }
  | { type: 'SUBMIT_ERROR'; payload: string }
  | { type: 'SET_PROMO'; payload: { promoCodeId: string; discountAmount: number } }
  | { type: 'REMOVE_PROMO' }
  | { type: 'RESET' };

// Initial state
const initialState: OrderFlowState = {
  step: 'detail',
  meal: null,
  vendor: null,
  fulfilmentType: null,
  quantity: 1,
  selectedAddress: null,
  selectedTimeSlot: null,
  notes: '',
  promoCodeId: null,
  discountAmount: 0,
  createdOrder: null,
  isSubmitting: false,
  error: null,
};

// Step order for navigation
const stepOrder: OrderStep[] = ['detail', 'address', 'timeslot', 'review', 'confirmation'];

// Reducer
function orderFlowReducer(state: OrderFlowState, action: OrderFlowAction): OrderFlowState {
  switch (action.type) {
    case 'SET_MEAL': {
      const { meal, vendor } = action.payload;
      // Determine default fulfilment type based on meal
      let defaultFulfilment: FulfilmentType | null = null;
      if (meal.fulfilmentType === 'collection') {
        defaultFulfilment = 'collection';
      } else if (meal.fulfilmentType === 'delivery') {
        defaultFulfilment = 'delivery';
      }
      return {
        ...initialState,
        meal,
        vendor,
        fulfilmentType: defaultFulfilment,
      };
    }

    case 'SET_FULFILMENT_TYPE':
      return { ...state, fulfilmentType: action.payload };

    case 'SET_QUANTITY':
      return { ...state, quantity: Math.max(1, action.payload) };

    case 'SET_ADDRESS':
      return { ...state, selectedAddress: action.payload };

    case 'SET_TIME_SLOT':
      return { ...state, selectedTimeSlot: action.payload };

    case 'SET_NOTES':
      return { ...state, notes: action.payload };

    case 'NEXT_STEP': {
      const currentIndex = stepOrder.indexOf(state.step);
      let nextIndex = currentIndex + 1;

      // Skip address step if collection
      if (stepOrder[nextIndex] === 'address' && state.fulfilmentType === 'collection') {
        nextIndex++;
      }

      if (nextIndex < stepOrder.length) {
        return { ...state, step: stepOrder[nextIndex] };
      }
      return state;
    }

    case 'PREV_STEP': {
      const currentIndex = stepOrder.indexOf(state.step);
      let prevIndex = currentIndex - 1;

      // Skip address step if collection
      if (stepOrder[prevIndex] === 'address' && state.fulfilmentType === 'collection') {
        prevIndex--;
      }

      if (prevIndex >= 0) {
        return { ...state, step: stepOrder[prevIndex] };
      }
      return state;
    }

    case 'GO_TO_STEP':
      return { ...state, step: action.payload };

    case 'SUBMIT_START':
      return { ...state, isSubmitting: true, error: null };

    case 'SUBMIT_SUCCESS':
      return {
        ...state,
        isSubmitting: false,
        createdOrder: action.payload,
        step: 'confirmation',
      };

    case 'SUBMIT_ERROR':
      return { ...state, isSubmitting: false, error: action.payload };

    case 'SET_PROMO':
      return {
        ...state,
        promoCodeId: action.payload.promoCodeId,
        discountAmount: action.payload.discountAmount,
      };

    case 'REMOVE_PROMO':
      return { ...state, promoCodeId: null, discountAmount: 0 };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// Context
interface OrderFlowContextValue {
  state: OrderFlowState;
  computed: OrderFlowComputed;
  dispatch: React.Dispatch<OrderFlowAction>;
}

const OrderFlowContext = createContext<OrderFlowContextValue | null>(null);

// Provider
interface OrderFlowProviderProps {
  children: React.ReactNode;
  initialMeal?: Meal;
  initialVendor?: Vendor;
}

export function OrderFlowProvider({
  children,
  initialMeal,
  initialVendor,
}: OrderFlowProviderProps) {
  const [state, dispatch] = useReducer(orderFlowReducer, initialState, (init) => {
    if (initialMeal && initialVendor) {
      let defaultFulfilment: FulfilmentType | null = null;
      if (initialMeal.fulfilmentType === 'collection') {
        defaultFulfilment = 'collection';
      } else if (initialMeal.fulfilmentType === 'delivery') {
        defaultFulfilment = 'delivery';
      }
      return {
        ...init,
        meal: initialMeal,
        vendor: initialVendor,
        fulfilmentType: defaultFulfilment,
      };
    }
    return init;
  });

  // Compute derived values
  const computed = useMemo<OrderFlowComputed>(() => {
    const mealPrice = state.meal?.price ?? 0;
    const subtotal = mealPrice * state.quantity;
    const serviceFee = subtotal * 0.05;
    const deliveryFee = state.fulfilmentType === 'delivery' ? 2.5 : 0;
    const discount = state.discountAmount;
    const total = subtotal + serviceFee + deliveryFee - discount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      serviceFee: Math.round(serviceFee * 100) / 100,
      deliveryFee,
      discountAmount: discount,
      total: Math.round(Math.max(0, total) * 100) / 100,
    };
  }, [state.meal?.price, state.quantity, state.fulfilmentType, state.discountAmount]);

  const value = useMemo(
    () => ({ state, computed, dispatch }),
    [state, computed]
  );

  return (
    <OrderFlowContext.Provider value={value}>
      {children}
    </OrderFlowContext.Provider>
  );
}

// Hook
export function useOrderFlow() {
  const context = useContext(OrderFlowContext);
  if (!context) {
    throw new Error('useOrderFlow must be used within OrderFlowProvider');
  }
  return context;
}

export default OrderFlowContext;
