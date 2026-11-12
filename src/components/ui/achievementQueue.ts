import { useState, useEffect } from 'react';

export interface QueuedAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'milestone' | 'badge' | 'level_up';
}

const achievementQueue: QueuedAchievement[] = [];
let showCallback: ((a: QueuedAchievement | null) => void) | null = null;

export function queueAchievement(achievement: Omit<QueuedAchievement, 'id'>) {
  const item = { ...achievement, id: crypto.randomUUID() };
  achievementQueue.push(item);
  if (achievementQueue.length === 1 && showCallback) {
    showCallback(item);
  }
}

function showNext() {
  achievementQueue.shift();
  if (achievementQueue.length > 0 && showCallback) {
    setTimeout(() => showCallback!(achievementQueue[0]), 250);
  } else if (showCallback) {
    showCallback(null);
  }
}

export function useAchievementToast() {
  const [current, setCurrent] = useState<QueuedAchievement | null>(null);

  useEffect(() => {
    showCallback = setCurrent;
    if (achievementQueue.length > 0) {
      setTimeout(() => setCurrent(achievementQueue[0]), 0);
    }
    return () => {
      showCallback = null;
    };
  }, []);

  const dismiss = () => {
    setCurrent(null);
    showNext();
  };

  return { current, dismiss };
}

export const STREAK_MILESTONES = [
  {
    days: 7,
    icon: '🔥',
    title: '1 Week Streak!',
    description: "You've shown up for 7 days straight. The habit is forming!",
  },
  {
    days: 14,
    icon: '⚡',
    title: '2 Week Warrior!',
    description: "14 days of consistency. You're building real momentum.",
  },
  {
    days: 21,
    icon: '💪',
    title: '21 Day Breakthrough!',
    description: 'They say it takes 21 days to form a habit. You just did it!',
  },
  {
    days: 30,
    icon: '🏅',
    title: '30 Day Champion!',
    description: "A full month of dedication. You're in the top 1% of habit builders.",
  },
  {
    days: 60,
    icon: '💎',
    title: '60 Day Diamond!',
    description: 'Two months of pure discipline. This habit is part of who you are.',
  },
  {
    days: 90,
    icon: '👑',
    title: '90 Day Legend!',
    description: 'A quarter of a year. Your consistency is legendary.',
  },
  {
    days: 180,
    icon: '🌟',
    title: 'Half Year Hero!',
    description: "6 months! You've proven this isn't a phase — it's a lifestyle.",
  },
  {
    days: 365,
    icon: '🏆',
    title: 'ONE YEAR!',
    description: '365 days. An entire year. You are extraordinary.',
  },
];

export function checkStreakMilestone(streak: number): (typeof STREAK_MILESTONES)[0] | null {
  return STREAK_MILESTONES.find(m => m.days === streak) ?? null;
}

