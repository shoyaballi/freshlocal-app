import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { DietaryBadge, User } from '@/types';

interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // App state
  isVendor: boolean;
  hasOnboarded: boolean;
  postcode: string | null;
  favourites: string[];
  dietaryFilters: DietaryBadge[];
  notificationCount: number;

  // Actions
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsVendor: (isVendor: boolean) => void;
  setHasOnboarded: (hasOnboarded: boolean) => void;
  setPostcode: (postcode: string | null) => void;
  addFavourite: (mealId: string) => void;
  removeFavourite: (mealId: string) => void;
  toggleFavourite: (mealId: string) => void;
  setDietaryFilters: (filters: DietaryBadge[]) => void;
  toggleDietaryFilter: (filter: DietaryBadge) => void;
  setNotificationCount: (count: number) => void;
  clearNotifications: () => void;
  reset: () => void;
}

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isVendor: false,
  hasOnboarded: false,
  postcode: null,
  favourites: [],
  dietaryFilters: [],
  notificationCount: 0,
};

// Simple in-memory storage fallback for when AsyncStorage isn't available
const memoryStorage: { [key: string]: string } = {};
const fallbackStorage = {
  getItem: (name: string) => {
    return memoryStorage[name] ?? null;
  },
  setItem: (name: string, value: string) => {
    memoryStorage[name] = value;
  },
  removeItem: (name: string) => {
    delete memoryStorage[name];
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setIsVendor: (isVendor) => set({ isVendor }),
      setHasOnboarded: (hasOnboarded) => set({ hasOnboarded }),
      setPostcode: (postcode) => set({ postcode }),

      addFavourite: (mealId) => {
        const { favourites } = get();
        if (!favourites.includes(mealId)) {
          set({ favourites: [...favourites, mealId] });
        }
      },

      removeFavourite: (mealId) => {
        const { favourites } = get();
        set({ favourites: favourites.filter((id) => id !== mealId) });
      },

      toggleFavourite: (mealId) => {
        const { favourites } = get();
        if (favourites.includes(mealId)) {
          set({ favourites: favourites.filter((id) => id !== mealId) });
        } else {
          set({ favourites: [...favourites, mealId] });
        }
      },

      setDietaryFilters: (filters) => set({ dietaryFilters: filters }),

      toggleDietaryFilter: (filter) => {
        const { dietaryFilters } = get();
        if (dietaryFilters.includes(filter)) {
          set({ dietaryFilters: dietaryFilters.filter((f) => f !== filter) });
        } else {
          set({ dietaryFilters: [...dietaryFilters, filter] });
        }
      },

      setNotificationCount: (count) => set({ notificationCount: count }),
      clearNotifications: () => set({ notificationCount: 0 }),

      reset: () => set(initialState),
    }),
    {
      name: 'freshlocal-app-storage',
      storage: createJSONStorage(() => fallbackStorage),
      partialize: (state) => ({
        hasOnboarded: state.hasOnboarded,
        postcode: state.postcode,
        favourites: state.favourites,
        dietaryFilters: state.dietaryFilters,
      }),
    }
  )
);

export default useAppStore;
