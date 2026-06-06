import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

// Hold the subscription reference outside the store so we can unsubscribe on re-init
let authSubscription: { unsubscribe: () => void } | null = null;

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  session: null,
  loading: true,
  isGuest: false,

  initialize: async () => {
    try {
      // Clean up any previous listener
      if (authSubscription) {
        authSubscription.unsubscribe();
        authSubscription = null;
      }

      // Restore existing session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      set({
        session,
        user: session?.user ?? null,
        isGuest: !session,
        loading: false,
      });

      // Listen for future auth changes (sign-in, sign-out, token refresh)
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
          isGuest: !session,
          loading: false,
        });
      });

      authSubscription = subscription;
    } catch (error) {
      console.error('Auth initialization failed:', error);
      set({ loading: false, isGuest: true });
    }
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        scopes: 'https://www.googleapis.com/auth/calendar.events',
      },
    });

    if (error) {
      console.error('Google sign-in failed:', error.message);
      throw error;
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign-out failed:', error.message);
      throw error;
    }
    set({
      user: null,
      session: null,
      isGuest: true,
    });
  },
}));
