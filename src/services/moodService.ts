import { db } from '@/db';
import type { Mood, MoodScore } from '@/types';
import { nanoid } from 'nanoid';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

export const moodService = {
  async getAllMoods(): Promise<Mood[]> {
    return db.moods.orderBy('date').reverse().toArray();
  },

  async getMoodByDate(dateStr: string): Promise<Mood | undefined> {
    return db.moods.where('date').equals(dateStr).first();
  },

  async getMoodsInRange(startDate: Date, endDate: Date): Promise<Mood[]> {
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');
    return db.moods.where('date').between(startStr, endStr, true, true).toArray();
  },

  async logMood(score: MoodScore, note?: string): Promise<Mood> {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const existing = await this.getMoodByDate(todayStr);

    if (existing) {
      existing.score = score;
      if (note !== undefined) existing.note = note;
      existing.createdAt = new Date().toISOString(); // update timestamp
      await db.moods.put(existing);
      return existing;
    }

    const newMood: Mood = {
      id: nanoid(),
      date: todayStr,
      score,
      note,
      createdAt: new Date().toISOString(),
    };
    await db.moods.add(newMood);
    return newMood;
  },

  async deleteMood(id: string): Promise<void> {
    await db.moods.delete(id);
  },
};
