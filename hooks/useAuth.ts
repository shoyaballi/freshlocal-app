import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/appStore';
import type { User } from '@/types';

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    setUser,
    setIsAuthenticated,
    setIsLoading,
    setIsVendor,
    reset,
  } = useAppStore();

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (mounted && session?.user) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            phone: session.user.phone,
            name: session.user.user_metadata?.name || 'User',
            avatar: session.user.user_metadata?.avatar,
            postcode: session.user.user_metadata?.postcode,
            isVendor: session.user.user_metadata?.isVendor || false,
            createdAt: session.user.created_at,
            updatedAt: session.user.updated_at || session.user.created_at,
          };

          setUser(userData);
          setIsVendor(userData.isVendor);
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

        if (event === 'SIGNED_IN' && session?.user) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            phone: session.user.phone,
            name: session.user.user_metadata?.name || 'User',
            avatar: session.user.user_metadata?.avatar,
            postcode: session.user.user_metadata?.postcode,
            isVendor: session.user.user_metadata?.isVendor || false,
            createdAt: session.user.created_at,
            updatedAt: session.user.updated_at || session.user.created_at,
          };

          setUser(userData);
          setIsVendor(userData.isVendor);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsVendor(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setIsVendor, setIsLoading]);

  // Sign in with email and password
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading]);

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
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading]);

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
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading]);

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

  // Update user profile
  const updateProfile = useCallback(async (updates: Partial<User>) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) throw error;

      if (user) {
        setUser({ ...user, ...updates });
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }, [user, setUser]);

  return {
    user,
    isAuthenticated,
    isLoading,
    signInWithEmail,
    signInWithPhone,
    verifyOtp,
    signUp,
    signOut,
    updateProfile,
  };
}

export default useAuth;
