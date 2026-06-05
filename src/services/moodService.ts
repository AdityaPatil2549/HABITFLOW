import { db } from '@/db';
import type { Mood, MoodScore } from '@/types';
import { nanoid } from 'nanoid';
import { format } from 'date-fns';
import { syncService } from './syncService';

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
      existing.updated_at = new Date().toISOString(); // update timestamp
      await db.moods.put(existing);
      syncService.queuePush('moods', existing, 'upsert').catch(console.error);
      return existing;
    }

    const newMood: Mood = {
      id: nanoid(),
      date: todayStr,
      score,
      note,
      createdAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await db.moods.add(newMood);
    syncService.queuePush('moods', newMood, 'upsert').catch(console.error);
    return newMood;
  },

  async deleteMood(id: string): Promise<void> {
    await db.moods.delete(id);
    syncService.queuePush('moods', { id }, 'delete').catch(console.error);
  },
};
