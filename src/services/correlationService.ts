/**
 * Habit Correlation Engine
 * Analyzes patterns between habits, mood, and day-of-week
 */
import { db } from '@/db';
import type { CorrelationResult } from '@/types';
import { format, subDays } from 'date-fns';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 5) return 0; // Not enough data
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0,
    denX = 0,
    denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

async function analyzeHabitMoodCorrelation(): Promise<CorrelationResult[]> {
  const results: CorrelationResult[] = [];
  const today = new Date();
  const habits = await db.habits.filter(h => !h.archived).toArray();
  const moods = await db.moods.toArray();

  if (moods.length < 5 || habits.length === 0) return results;

  const moodMap = new Map<string, number>();
  for (const m of moods) moodMap.set(m.date, m.score);

  const logs = await db.habitLogs.toArray();
  const logSet = new Set(logs.map(l => `${l.habitId}|${l.date}`));

  for (const habit of habits) {
    const completions: number[] = [];
    const moodScores: number[] = [];

    for (let i = 0; i < 90; i++) {
      const d = format(subDays(today, i), 'yyyy-MM-dd');
      const mood = moodMap.get(d);
      if (mood === undefined) continue;
      completions.push(logSet.has(`${habit.id}|${d}`) ? 1 : 0);
      moodScores.push(mood);
    }

    if (completions.length < 7) continue;

    const corr = pearsonCorrelation(completions, moodScores);
    if (Math.abs(corr) < 0.15) continue;

    const direction = corr > 0 ? 'more' : 'less';
    const strength = Math.abs(corr) > 0.5 ? 'strongly' : 'somewhat';

    results.push({
      habitA: habit.id,
      habitAName: habit.name,
      factorB: 'Mood Score',
      factorBType: 'mood',
      correlation: Math.round(corr * 100) / 100,
      description: `Your mood is ${strength} correlated with ${habit.name}. Higher mood = ${direction} likely to complete it.`,
      sampleSize: completions.length,
    });
  }

  return results;
}

async function analyzeHabitDayOfWeek(): Promise<CorrelationResult[]> {
  const results: CorrelationResult[] = [];
  const today = new Date();
  const habits = await db.habits.filter(h => !h.archived).toArray();
  const logs = await db.habitLogs.toArray();
  const logSet = new Set(logs.map(l => `${l.habitId}|${l.date}`));

  for (const habit of habits) {
    const dayCompletions = Array(7).fill(0);
    const dayTotals = Array(7).fill(0);

    for (let i = 0; i < 90; i++) {
      const date = subDays(today, i);
      const d = format(date, 'yyyy-MM-dd');
      const dow = date.getDay();
      dayTotals[dow]++;
      if (logSet.has(`${habit.id}|${d}`)) dayCompletions[dow]++;
    }

    const rates = dayCompletions.map((c, i) => (dayTotals[i] > 0 ? c / dayTotals[i] : 0));
    const bestDay = rates.indexOf(Math.max(...rates));
    const worstDay = rates.indexOf(Math.min(...rates));
    const bestRate = Math.round(rates[bestDay] * 100);
    const worstRate = Math.round(rates[worstDay] * 100);

    if (bestRate - worstRate < 20) continue; // Not significant enough

    results.push({
      habitA: habit.id,
      habitAName: habit.name,
      factorB: `${DAY_NAMES[worstDay]}s`,
      factorBType: 'day',
      correlation: -(bestRate - worstRate) / 100,
      description: `You complete ${habit.name} ${bestRate}% on ${DAY_NAMES[bestDay]}s but only ${worstRate}% on ${DAY_NAMES[worstDay]}s.`,
      sampleSize: 90,
    });
  }

  return results;
}

async function analyzeHabitPairCorrelation(): Promise<CorrelationResult[]> {
  const results: CorrelationResult[] = [];
  const today = new Date();
  const habits = await db.habits.filter(h => !h.archived).toArray();
  if (habits.length < 2) return results;

  const logs = await db.habitLogs.toArray();
  const logSet = new Set(logs.map(l => `${l.habitId}|${l.date}`));

  // Build completion arrays for each habit over 90 days
  const dates: string[] = [];
  for (let i = 0; i < 90; i++) dates.push(format(subDays(today, i), 'yyyy-MM-dd'));

  const habitVectors = new Map<string, number[]>();
  for (const habit of habits) {
    habitVectors.set(
      habit.id,
      dates.map(d => (logSet.has(`${habit.id}|${d}`) ? 1 : 0))
    );
  }

  // Compare each pair
  for (let i = 0; i < habits.length; i++) {
    for (let j = i + 1; j < habits.length; j++) {
      const vecA = habitVectors.get(habits[i].id)!;
      const vecB = habitVectors.get(habits[j].id)!;
      const corr = pearsonCorrelation(vecA, vecB);

      if (Math.abs(corr) < 0.2) continue;

      const direction = corr > 0 ? 'tend to complete together' : 'tend to compete with each other';

      results.push({
        habitA: habits[i].id,
        habitAName: habits[i].name,
        factorB: habits[j].name,
        factorBType: 'habit',
        correlation: Math.round(corr * 100) / 100,
        description: `${habits[i].name} and ${habits[j].name} ${direction} (${Math.round(Math.abs(corr) * 100)}% correlation).`,
        sampleSize: 90,
      });
    }
  }

  return results;
}

async function getAllCorrelations(): Promise<CorrelationResult[]> {
  const [mood, day, pairs] = await Promise.all([
    analyzeHabitMoodCorrelation(),
    analyzeHabitDayOfWeek(),
    analyzeHabitPairCorrelation(),
  ]);

  const all = [...mood, ...day, ...pairs];
  all.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  return all.slice(0, 10);
}

export const correlationService = {
  analyzeHabitMoodCorrelation,
  analyzeHabitDayOfWeek,
  analyzeHabitPairCorrelation,
  getAllCorrelations,
};
