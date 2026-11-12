import { create } from 'zustand';
import { getAuthInstance, isFirebaseConfigured } from '@/lib/firebase';
import type { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  session: { access_token: string } | null;
  loading: boolean;
  isGuest: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

// Hold the subscription reference outside the store so we can unsubscribe on re-init
let authSubscription: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  isGuest: false,

  initialize: async () => {
    try {
      // Clean up any previous listener
      if (authSubscription) {
        authSubscription();
        authSubscription = null;
      }

      if (!isFirebaseConfigured()) {
        set({ user: null, session: null, isGuest: true, loading: false });
        return;
      }

      const [auth, { onAuthStateChanged }] = await Promise.all([
        getAuthInstance(),
        import('firebase/auth'),
      ]);

      if (!auth) {
        set({ user: null, session: null, isGuest: true, loading: false });
        return;
      }

      // Listen for future auth changes (sign-in, sign-out, token refresh)
      authSubscription = onAuthStateChanged(auth, async (user) => {
        if (user) {
          const token = await user.getIdToken();
          set({
            user,
            session: { access_token: token },
            isGuest: false,
            loading: false,
          });
        } else {
          set({
            user: null,
            session: null,
            isGuest: true,
            loading: false,
          });
        }
      });
    } catch (error) {
      console.error('Auth initialization failed:', error);
      set({ loading: false, isGuest: true });
    }
  },

  signInWithGoogle: async () => {
    try {
      const [auth, { GoogleAuthProvider, signInWithPopup }] = await Promise.all([
        getAuthInstance(),
        import('firebase/auth'),
      ]);
      if (!auth) throw new Error('Firebase authentication is not configured.');

      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/calendar.events');
      provider.setCustomParameters({ prompt: 'consent' });
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (token) {
        localStorage.setItem('google_calendar_token', token);
      }
      if (result.user) {
         // Token logic is handled by onAuthStateChanged
      }
    } catch (error: unknown) {
      console.error('Google sign-in failed:', error instanceof Error ? error.message : error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      const auth = await getAuthInstance();
      if (auth) {
        const { signOut: firebaseSignOut } = await import('firebase/auth');
        await firebaseSignOut(auth);
      }
      set({
        user: null,
        session: null,
        isGuest: true,
      });
    } catch (error: unknown) {
      console.error('Sign-out failed:', error instanceof Error ? error.message : error);
      throw error;
    }
  },
}));
