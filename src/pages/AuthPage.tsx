import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Sparkles } from 'lucide-react';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.07l3.66-2.98z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// Floating orb positions & colors for the animated background
export function AuthPage() {
  const navigate = useNavigate();
  const signInWithGoogle = useAuthStore(s => s.signInWithGoogle);
  const user = useAuthStore(s => s.user);
  const loading = useAuthStore(s => s.loading);

  // Detect if we're in an OAuth callback (URL has ?code= param)
  const isOAuthCallback = window.location.search.includes('code=');

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch {
      // Error is already logged in the store
    }
  };

  const handleGuestMode = () => {
    navigate('/dashboard');
  };

  // Show a loading screen while processing OAuth callback
  if ((loading && isOAuthCallback) || (user && isOAuthCallback)) {
    return (
      <div className="relative min-h-screen w-screen flex items-center justify-center overflow-hidden px-4 bg-[var(--sf-base)]">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 bg-[var(--accent)] text-[var(--accent-fg)]"
          >
            <Sparkles className="w-8 h-8" />
          </motion.div>
          <h2 className="text-xl font-bold text-[var(--tx-primary)] mt-4">Signing you in...</h2>
          <p className="text-[var(--tx-muted)] mt-2">Connecting to your Google account</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative md:h-screen md:overflow-hidden w-full bg-[var(--sf-base)] text-[var(--tx-primary)]">
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.14 }}
          className="mx-auto space-y-6 sm:w-[400px] card-raised p-8 rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[var(--sf-overlay)] border border-[var(--border-default)]">
              <Sparkles className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-[var(--tx-primary)]">
              Habit<span className="text-[var(--accent)]">Flow</span>
            </p>
          </div>
          
          <div className="flex flex-col space-y-2">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-[var(--tx-primary)]">
              Sign In or Join Now
            </h1>
            <p className="text-[var(--tx-secondary)] text-base leading-relaxed">
              Login to sync your habits across devices, or continue as a guest to store data locally.
            </p>
          </div>
          
          <div className="space-y-3 pt-4">
            <button 
              type="button" 
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl btn-primary font-semibold text-[15px]"
            >
              <GoogleIcon className="size-5" />
              Continue with Google
            </button>
            
            <button 
              type="button" 
              onClick={handleGuestMode}
              className="btn-secondary w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl font-semibold text-[15px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Continue as Guest
            </button>
          </div>
          
          <p className="text-[var(--tx-muted)] mt-8 text-sm text-center pt-4">
            By clicking continue, you agree to our{' '}
            <a href="/terms" className="hover:text-[var(--accent)] underline underline-offset-4 transition-colors duration-150">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="hover:text-[var(--accent)] underline underline-offset-4 transition-colors duration-150">
              Privacy Policy
            </a>
            .
          </p>
        </motion.div>
      </div>
    </div>
  );
}
