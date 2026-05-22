import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Sparkles, RefreshCw, Calendar, CloudUpload } from 'lucide-react';

const features = [
  { icon: RefreshCw, label: 'Cross-device sync' },
  { icon: Calendar, label: 'Google Calendar integration' },
  { icon: CloudUpload, label: 'Cloud backup & restore' },
];

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
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
const orbs = [
  { x: '10%', y: '20%', size: 320, color: 'rgba(99, 102, 241, 0.15)', delay: 0 },
  { x: '75%', y: '15%', size: 260, color: 'rgba(139, 92, 246, 0.12)', delay: 2 },
  { x: '60%', y: '70%', size: 380, color: 'rgba(79, 70, 229, 0.10)', delay: 4 },
  { x: '20%', y: '75%', size: 200, color: 'rgba(167, 139, 250, 0.12)', delay: 1 },
  { x: '85%', y: '50%', size: 160, color: 'rgba(99, 102, 241, 0.08)', delay: 3 },
];

export function AuthPage() {
  const navigate = useNavigate();
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);

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

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center overflow-hidden px-4">
      {/* ── Animated background orbs ────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {orbs.map((orb, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: orb.x,
              top: orb.y,
              width: orb.size,
              height: orb.size,
              background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
              filter: 'blur(40px)',
            }}
            animate={{
              x: [0, 30, -20, 10, 0],
              y: [0, -25, 15, -10, 0],
              scale: [1, 1.1, 0.95, 1.05, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              delay: orb.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* ── Main card ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card rounded-2xl p-8 sm:p-10 w-[90%] max-w-[440px] relative z-10"
      >
        {/* ── Logo / Branding ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))' }}
          >
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <h1 className="font-h1 text-white mb-2">
            Habit<span className="text-brand-active">Flow</span>
          </h1>
          <p className="text-slate-400 text-body-md leading-relaxed">
            Build better habits. Track your progress.
            <br />
            Level up your life.
          </p>
        </motion.div>

        {/* ── Google sign-in button ───────────────────────────────── */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl text-white font-semibold text-[15px] cursor-pointer transition-shadow hover:shadow-lg"
          style={{
            background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))',
            boxShadow: '0 8px 24px -4px rgba(var(--brand-500-rgb), 0.35)',
          }}
        >
          <GoogleIcon />
          Continue with Google
        </motion.button>

        {/* ── Features list ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8 space-y-3"
        >
          {features.map((feat, i) => (
            <motion.div
              key={feat.label}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 + i * 0.1, duration: 0.4 }}
              className="flex items-center gap-3 text-slate-400 text-sm"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5">
                <feat.icon className="w-4 h-4 text-brand-active" />
              </div>
              {feat.label}
            </motion.div>
          ))}
        </motion.div>

        {/* ── Divider ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="flex items-center gap-3 my-6"
        >
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </motion.div>

        {/* ── Guest mode link ─────────────────────────────────────── */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleGuestMode}
          className="w-full py-3 rounded-xl text-slate-400 hover:text-white text-sm font-medium cursor-pointer transition-colors bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10"
        >
          Continue as Guest
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.4 }}
          className="text-center text-slate-500 text-xs mt-4"
        >
          Guest data stays on this device only
        </motion.p>
      </motion.div>
    </div>
  );
}
