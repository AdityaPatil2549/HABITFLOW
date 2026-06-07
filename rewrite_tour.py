import re

with open("src/components/ui/OnboardingTour.tsx", "r", encoding="utf-8") as f:
    content = f.read()

new_content = """import React, { useEffect, useState } from 'react';
import Joyride, { STATUS, Step, TooltipRenderProps } from 'react-joyride';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

function CustomTooltip({
  continuous,
  index,
  step,
  isLastStep,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
}: TooltipRenderProps) {
  return (
    <div
      {...tooltipProps}
      className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-slate-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl p-6"
    >
      {/* 3D Background Glow Effects */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-brand-500/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-purple-500/30 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10">
        <div className="mb-4">{step.content}</div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-6">
          <button
            {...skipProps}
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            SKIP TOUR
          </button>

          <div className="flex gap-2">
            {index > 0 && (
              <button
                {...backProps}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all"
              >
                Back
              </button>
            )}
            <button
              {...primaryProps}
              className="px-6 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-lg active:scale-95 button-3d"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                border: '1px solid rgba(139, 92, 246, 0.5)',
              }}
            >
              {continuous && !isLastStep ? 'Next' : 'Finish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OnboardingTour() {
  const [run, setRun] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Only run the tour if they haven't seen it, and only on the dashboard route
    const hasSeenTour = localStorage.getItem('habitflow_tour_completed');
    if (!hasSeenTour && (location.pathname === '/' || location.pathname === '/dashboard')) {
      // Small delay to ensure elements are rendered
      const timer = setTimeout(() => {
        setRun(true);
        // Eagerly set to true so it doesn't show again on next refresh even if they don't finish it
        localStorage.setItem('habitflow_tour_completed', 'true');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [location]);

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('habitflow_tour_completed', 'true');
    }
  };

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="text-left">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-12 h-12 bg-gradient-to-tr from-brand-500 to-purple-500 rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-lg shadow-brand-500/20"
          >
            👋
          </motion.div>
          <h3 className="text-xl font-black text-white mb-2 tracking-tight">Welcome to HabitFlow!</h3>
          <p className="text-sm text-slate-300 font-medium">Let's take a quick 3D tour to help you level up your life.</p>
        </div>
      ),
      placement: 'center',
    },
    {
      target: '[data-tour="habits-widget"]',
      content: (
        <div className="text-left">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-10 h-10 bg-brand-500/20 border border-brand-500/30 rounded-xl flex items-center justify-center text-xl mb-3"
          >
            🔥
          </motion.div>
          <h3 className="text-lg font-black text-white mb-1">Your Habits</h3>
          <p className="text-sm text-slate-300">This is where you'll log your daily habits. Completing habits earns you <span className="text-brand-400 font-bold">XP and Coins!</span></p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-tour="tasks-widget"]',
      content: (
        <div className="text-left">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center text-xl mb-3"
          >
            ✅
          </motion.div>
          <h3 className="text-lg font-black text-white mb-1">Daily Tasks</h3>
          <p className="text-sm text-slate-300">Manage your to-dos here. Stay organized and boost your daily productivity.</p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-tour="stats-widget"]',
      content: (
        <div className="text-left">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-10 h-10 bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center text-xl mb-3"
          >
            📈
          </motion.div>
          <h3 className="text-lg font-black text-white mb-1">Level Up!</h3>
          <p className="text-sm text-slate-300">Track your level, XP, and streaks. Keep the momentum going to unlock new tiers!</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="sidebar-nav"]',
      content: (
        <div className="text-left">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-10 h-10 bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center text-xl mb-3"
          >
            🧭
          </motion.div>
          <h3 className="text-lg font-black text-white mb-1">Explore More</h3>
          <p className="text-sm text-slate-300">Use the navigation to check out <span className="text-brand-300">Deep Analytics</span>, join <span className="text-brand-300">Squads</span>, or spend your coins in the <span className="text-brand-300">Shop</span>.</p>
        </div>
      ),
      placement: 'right',
    }
  ];

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress={false}
      showSkipButton
      steps={steps}
      tooltipComponent={CustomTooltip}
      styles={{
        options: {
          zIndex: 10000,
          arrowColor: 'rgba(15, 23, 42, 0.95)',
        },
      }}
    />
  );
}
"""

with open("src/components/ui/OnboardingTour.tsx", "w", encoding="utf-8") as f:
    f.write(new_content)

print("Successfully replaced OnboardingTour.tsx")
