import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/appStore';
import type { User } from '@/types';

interface Profile {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  avatar: string | null;
  postcode: string | null;
  is_vendor: boolean;
  created_at: string;
  updated_at: string;
}

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    hasOnboarded,
    setUser,
    setIsAuthenticated,
    setIsLoading,
    setIsVendor,
    setHasOnboarded,
    reset,
  } = useAppStore();

  // Fetch or create profile from database
  const fetchOrCreateProfile = useCallback(async (authUser: {
    id: string;
    email?: string;
    phone?: string;
    user_metadata?: Record<string, unknown>;
  }): Promise<User | null> => {
    try {
      // First try to fetch existing profile
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile && !fetchError) {
        // Profile exists, check if user is a vendor
        const { data: vendor } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', authUser.id)
          .single();

        const userData: User = {
          id: profile.id,
          email: profile.email,
          phone: profile.phone,
          name: profile.name,
          avatar: profile.avatar,
          postcode: profile.postcode,
          isVendor: profile.is_vendor || !!vendor,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
        };

        return userData;
      }

      // Profile doesn't exist, create one
      const newProfile = {
        id: authUser.id,
        email: authUser.email || '',
        phone: authUser.phone || null,
        name: (authUser.user_metadata?.name as string) || '',
        avatar: null,
        postcode: null,
        is_vendor: false,
      };

      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
        // If profile creation fails (maybe trigger already created it), try fetching again
        const { data: retryProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (retryProfile) {
          return {
            id: retryProfile.id,
            email: retryProfile.email,
            phone: retryProfile.phone,
            name: retryProfile.name,
            avatar: retryProfile.avatar,
            postcode: retryProfile.postcode,
            isVendor: retryProfile.is_vendor,
            createdAt: retryProfile.created_at,
            updatedAt: retryProfile.updated_at,
          };
        }
        return null;
      }

      return {
        id: createdProfile.id,
        email: createdProfile.email,
        phone: createdProfile.phone,
        name: createdProfile.name,
        avatar: createdProfile.avatar,
        postcode: createdProfile.postcode,
        isVendor: false,
        createdAt: createdProfile.created_at,
        updatedAt: createdProfile.updated_at,
      };
    } catch (error) {
      console.error('Error in fetchOrCreateProfile:', error);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (mounted && session?.user) {
          const userData = await fetchOrCreateProfile(session.user);

          if (userData) {
            setUser(userData);
            setIsVendor(userData.isVendor);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          const userData = await fetchOrCreateProfile(session.user);

          if (userData) {
            setUser(userData);
            setIsVendor(userData.isVendor);
            setIsAuthenticated(true);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsVendor(false);
          setIsAuthenticated(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setIsVendor, setIsLoading, setIsAuthenticated, fetchOrCreateProfile]);

  // Sign in with email and password
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Fetch profile after successful sign in
      if (data.user) {
        const userData = await fetchOrCreateProfile(data.user);
        if (userData) {
          setUser(userData);
          setIsVendor(userData.isVendor);
          setIsAuthenticated(true);
        }
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setUser, setIsVendor, setIsAuthenticated, fetchOrCreateProfile]);

  // Sign in with phone OTP
  const signInWithPhone = useCallback(async (phone: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading]);

  // Verify OTP
  const verifyOtp = useCallback(async (phone: string, token: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });

      if (error) throw error;

      // Fetch profile after successful verification
      if (data.user) {
        const userData = await fetchOrCreateProfile(data.user);
        if (userData) {
          setUser(userData);
          setIsVendor(userData.isVendor);
          setIsAuthenticated(true);
        }
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setUser, setIsVendor, setIsAuthenticated, fetchOrCreateProfile]);

  // Sign up with email
  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata?: { name?: string; phone?: string }
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) throw error;

      // For email signup, user might need to confirm email
      // If session exists, fetch profile
      if (data.user && data.session) {
        const userData = await fetchOrCreateProfile({
          ...data.user,
          user_metadata: metadata,
        });
        if (userData) {
          setUser(userData);
          setIsVendor(userData.isVendor);
          setIsAuthenticated(true);
        }
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setUser, setIsVendor, setIsAuthenticated, fetchOrCreateProfile]);

  // Sign out
  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      reset();
      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, reset]);

  // Update user profile in database
  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };

    try {
      // Update profile in database
      const dbUpdates: Partial<Profile> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
      if (updates.postcode !== undefined) dbUpdates.postcode = updates.postcode;

      const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }, [user, setUser]);

  // Check if user needs onboarding
  const checkOnboardingStatus = useCallback(() => {
    return !hasOnboarded;
  }, [hasOnboarded]);

  // Complete onboarding
  const completeOnboarding = useCallback(() => {
    setHasOnboarded(true);
  }, [setHasOnboarded]);

  // Get redirect path after auth
  const getPostAuthRedirect = useCallback((): string => {
    if (!hasOnboarded) {
      return '/onboarding';
    }
    return '/(tabs)';
  }, [hasOnboarded]);

  return {
    user,
    isAuthenticated,
    isLoading,
    hasOnboarded,
    signInWithEmail,
    signInWithPhone,
    verifyOtp,
    signUp,
    signOut,
    updateProfile,
    checkOnboardingStatus,
    completeOnboarding,
    getPostAuthRedirect,
  };
}

export default useAuth;
