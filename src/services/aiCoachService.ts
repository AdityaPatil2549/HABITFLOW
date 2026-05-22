/**
 * AI Habit Coach — Client-Side Rule-Based Coaching Engine
 * Generates personalized insights without any API calls.
 */
import { db } from '@/db';
import type { AIInsight } from '@/types';
import { format, subDays, subWeeks } from 'date-fns';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function uid(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

async function generateWeeklySummary(): Promise<AIInsight> {
  const today = new Date();
  const habits = await db.habits.filter(h => !h.archived).toArray();
  const logs = await db.habitLogs.toArray();
  const logSet = new Set(logs.map(l => `${l.habitId}|${l.date}`));

  let totalPossible = 0;
  let totalCompleted = 0;
  const habitStats: { name: string; completed: number; total: number; icon: string }[] = [];

  for (const habit of habits) {
    let completed = 0;
    let total = 0;
    for (let i = 0; i < 7; i++) {
      const d = format(subDays(today, i), 'yyyy-MM-dd');
      total++;
      if (logSet.has(`${habit.id}|${d}`)) completed++;
    }
    totalPossible += total;
    totalCompleted += completed;
    habitStats.push({ name: habit.name, completed, total, icon: habit.icon });
  }

  const pct = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
  const best = [...habitStats].sort((a, b) => (b.completed / b.total) - (a.completed / a.total))[0];
  const worst = [...habitStats].sort((a, b) => (a.completed / a.total) - (b.completed / b.total))[0];

  let body: string;
  if (pct >= 80) {
    body = `🔥 Incredible week! You completed ${pct}% of your habits. `;
  } else if (pct >= 50) {
    body = `👍 Solid week! You completed ${pct}% of your habits. `;
  } else {
    body = `💪 Tough week — you completed ${pct}% of your habits. Don't worry, every new day is a fresh start. `;
  }

  if (best && best.completed > 0) {
    body += `${best.icon} ${best.name} was your strongest (${best.completed}/${best.total}). `;
  }
  if (worst && worst.completed < worst.total && worst.name !== best?.name) {
    body += `${worst.icon} ${worst.name} needs attention (${worst.completed}/${worst.total}). Try linking it to an existing habit for consistency.`;
  }

  const insight: AIInsight = {
    id: uid(),
    type: 'weekly_summary',
    title: 'Weekly Review',
    body,
    icon: '📊',
    created_at: now(),
    read: false,
  };

  await db.ai_insights.add(insight);
  return insight;
}

async function generateDailyTip(): Promise<AIInsight> {
  const today = new Date();
  const hour = today.getHours();
  const todayStr = format(today, 'yyyy-MM-dd');
  const habits = await db.habits.filter(h => !h.archived).toArray();
  const logs = await db.habitLogs.toArray();
  const logSet = new Set(logs.map(l => `${l.habitId}|${l.date}`));

  const completedToday = habits.filter(h => logSet.has(`${h.id}|${todayStr}`)).length;
  const totalToday = habits.length;
  const pct = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  // Find streaks at risk (completed yesterday but not today)
  const yesterday = format(subDays(today, 1), 'yyyy-MM-dd');
  const atRisk = habits.filter(h =>
    logSet.has(`${h.id}|${yesterday}`) && !logSet.has(`${h.id}|${todayStr}`)
  );

  let title: string;
  let body: string;
  let icon: string;

  if (hour < 12) {
    // Morning tips
    if (pct === 0) {
      title = 'Fresh Start';
      body = `Good morning! You have ${totalToday} habits waiting. Start with the easiest one to build momentum.`;
      icon = '☀️';
    } else {
      title = 'Morning Check-in';
      body = `Great start! ${completedToday}/${totalToday} done already. Keep it up!`;
      icon = '🌅';
    }
  } else if (hour < 18) {
    // Afternoon tips
    if (atRisk.length > 0) {
      title = 'Streak Alert';
      body = `${atRisk[0].icon} ${atRisk[0].name} streak is at risk! You still have time.`;
      icon = '⚡';
    } else if (pct >= 80) {
      title = 'Almost There!';
      body = `You're at ${pct}% completion today. Just ${totalToday - completedToday} more to go for a perfect day!`;
      icon = '🎯';
    } else {
      title = 'Afternoon Boost';
      body = `${completedToday}/${totalToday} habits done. The afternoon is your second chance to win the day!`;
      icon = '💫';
    }
  } else {
    // Evening tips
    if (pct === 100) {
      title = 'Perfect Day!';
      body = 'You completed every single habit today. That\'s what consistency looks like! 🏆';
      icon = '✨';
    } else if (atRisk.length > 0) {
      title = 'Last Chance';
      body = `Don't let your ${atRisk[0].name} streak break! Quick — knock it out before bed.`;
      icon = '🌙';
    } else {
      title = 'Evening Reflection';
      body = `You completed ${pct}% today. Rest well and come back stronger tomorrow.`;
      icon = '🌙';
    }
  }

  const insight: AIInsight = {
    id: uid(),
    type: 'tip',
    title,
    body,
    icon,
    created_at: now(),
    read: false,
  };

  await db.ai_insights.add(insight);
  return insight;
}

async function detectPatterns(): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];
  const today = new Date();
  const habits = await db.habits.filter(h => !h.archived).toArray();
  const logs = await db.habitLogs.toArray();
  const logSet = new Set(logs.map(l => `${l.habitId}|${l.date}`));

  // Pattern 1: Weekend vs weekday performance
  let weekdayDone = 0, weekdayTotal = 0, weekendDone = 0, weekendTotal = 0;
  for (let i = 0; i < 30; i++) {
    const date = subDays(today, i);
    const d = format(date, 'yyyy-MM-dd');
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    for (const habit of habits) {
      if (isWeekend) {
        weekendTotal++;
        if (logSet.has(`${habit.id}|${d}`)) weekendDone++;
      } else {
        weekdayTotal++;
        if (logSet.has(`${habit.id}|${d}`)) weekdayDone++;
      }
    }
  }

  const weekdayRate = weekdayTotal > 0 ? weekdayDone / weekdayTotal : 0;
  const weekendRate = weekendTotal > 0 ? weekendDone / weekendTotal : 0;
  if (weekdayRate - weekendRate > 0.2) {
    insights.push({
      id: uid(),
      type: 'warning',
      title: 'Weekend Slump',
      body: `You complete ${Math.round(weekdayRate * 100)}% of habits on weekdays but only ${Math.round(weekendRate * 100)}% on weekends. Try scheduling weekend habits at a specific time.`,
      icon: '📉',
      created_at: now(),
      read: false,
    });
  } else if (weekendRate - weekdayRate > 0.2) {
    insights.push({
      id: uid(),
      type: 'tip',
      title: 'Weekday Challenge',
      body: `Interestingly, you perform better on weekends (${Math.round(weekendRate * 100)}%) than weekdays (${Math.round(weekdayRate * 100)}%). Consider simplifying your weekday routine.`,
      icon: '📈',
      created_at: now(),
      read: false,
    });
  }

  // Pattern 2: Most productive day
  const dayCounts = Array(7).fill(0);
  const dayTotals = Array(7).fill(0);
  for (let i = 0; i < 30; i++) {
    const date = subDays(today, i);
    const d = format(date, 'yyyy-MM-dd');
    const dow = date.getDay();
    for (const habit of habits) {
      dayTotals[dow]++;
      if (logSet.has(`${habit.id}|${d}`)) dayCounts[dow]++;
    }
  }
  const dayRates = dayCounts.map((c, i) => dayTotals[i] > 0 ? c / dayTotals[i] : 0);
  const bestDayIdx = dayRates.indexOf(Math.max(...dayRates));
  const bestDayRate = Math.round(dayRates[bestDayIdx] * 100);
  if (bestDayRate > 60) {
    insights.push({
      id: uid(),
      type: 'tip',
      title: 'Power Day',
      body: `${DAY_NAMES[bestDayIdx]} is your most productive day with ${bestDayRate}% completion. Schedule your hardest habits on this day!`,
      icon: '⚡',
      created_at: now(),
      read: false,
    });
  }

  // Pattern 3: Consecutive day analysis (strong-strong-skip pattern)
  for (const habit of habits) {
    let pattern = '';
    for (let i = 14; i >= 0; i--) {
      const d = format(subDays(today, i), 'yyyy-MM-dd');
      pattern += logSet.has(`${habit.id}|${d}`) ? '1' : '0';
    }
    const skipAfterTwo = (pattern.match(/110/g) || []).length;
    if (skipAfterTwo >= 3) {
      insights.push({
        id: uid(),
        type: 'warning',
        title: 'Two-Day Cycle',
        body: `${habit.icon} ${habit.name} shows a pattern: you do it for 2 days then skip. Try adding a small reward on day 3 to break the cycle.`,
        icon: '🔄',
        created_at: now(),
        read: false,
      });
    }
  }

  for (const insight of insights) {
    await db.ai_insights.add(insight);
  }

  return insights;
}

async function getCoachInsights(): Promise<AIInsight[]> {
  // Check if we already generated insights in the last 12 hours
  const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  const recent = await db.ai_insights
    .where('created_at')
    .above(cutoff)
    .toArray();

  if (recent.length > 0) {
    return recent.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  // Generate fresh insights
  const [tip, patterns] = await Promise.all([
    generateDailyTip(),
    detectPatterns(),
  ]);

  return [tip, ...patterns];
}

async function getRecentInsights(limit = 10): Promise<AIInsight[]> {
  const all = await db.ai_insights.toArray();
  return all.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit);
}

export const aiCoachService = {
  generateWeeklySummary,
  generateDailyTip,
  detectPatterns,
  getCoachInsights,
  getRecentInsights,
};
