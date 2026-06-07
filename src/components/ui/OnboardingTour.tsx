import React, { useEffect, useState } from 'react';
import { Joyride, STATUS, Step } from 'react-joyride';
import { useLocation } from 'react-router-dom';

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
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Welcome to HabitFlow! 👋</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">Let's take a quick tour to help you level up your life.</p>
        </div>
      ),
      placement: 'center',
    },
    {
      target: '[data-tour="habits-widget"]',
      content: (
        <div className="text-left">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Your Habits</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">This is where you'll log your daily habits. Completing habits earns you XP and Coins!</p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-tour="tasks-widget"]',
      content: (
        <div className="text-left">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Daily Tasks</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">Manage your to-dos here. Stay organized and boost your productivity.</p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-tour="stats-widget"]',
      content: (
        <div className="text-left">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Level Up! 📈</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">Track your level, XP, and streaks. Keep the momentum going!</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="sidebar-nav"]',
      content: (
        <div className="text-left">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Explore More</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">Use the navigation to check out Deep Analytics, join Squads, or spend your coins in the Shop.</p>
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
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        // @ts-ignore
        options: {
          zIndex: 10000,
          primaryColor: '#6366f1',
          textColor: 'inherit',
          backgroundColor: 'var(--color-slate-900)',
          arrowColor: 'var(--color-slate-900)',
        },
        tooltip: {
          background: 'var(--bg-glass)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid var(--border-glass)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          color: 'var(--text-primary)',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: '#6366f1',
          borderRadius: '8px',
          padding: '8px 16px',
          fontWeight: 'bold',
          color: '#ffffff',
        },
        buttonBack: {
          color: 'var(--text-secondary)',
          marginRight: '12px',
          fontWeight: 'bold',
        },
        buttonSkip: {
          color: 'var(--text-secondary)',
          fontWeight: 'bold',
        }
      }}
    />
  );
}
