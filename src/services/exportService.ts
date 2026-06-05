import { db } from '../db';
import { format } from 'date-fns';

/**
 * Export all app data as a formatted JSON file.
 */
async function exportToJSON(): Promise<void> {
  const habits = await db.habits.toArray();
  const habitLogs = await db.habitLogs.toArray();
  const tasks = await db.tasks.toArray();
  const projects = await db.projects.toArray();
  const moods = await db.moods.toArray();
  const userXP = await db.userXP.toArray();
  const settings = await db.settings.toArray();

  const data = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    app: 'HabitFlow',
    data: {
      habits,
      habitLogs,
      tasks,
      projects,
      moods,
      userXP: userXP[0] ?? null,
      settings: settings[0] ?? null,
    },
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `habitflow-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export habit logs as a CSV spreadsheet.
 */
async function exportToCSV(): Promise<void> {
  const habits = await db.habits.toArray();
  const habitLogs = await db.habitLogs.toArray();

  const habitMap = new Map(habits.map(h => [h.id, h]));

  const header = 'Date,Habit,Category,Type,Value,Target,Note,Mood,Timestamp\n';
  const rows = habitLogs
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(log => {
      const habit = habitMap.get(log.habitId);
      const name = habit ? `"${habit.name}"` : 'Unknown';
      const category = habit?.category ?? '';
      const type = habit?.type ?? '';
      const target = habit?.targetValue ?? '';
      const note = log.note ? `"${log.note.replace(/"/g, '""')}"` : '';
      const mood = log.mood ?? '';
      return `${log.date},${name},${category},${type},${log.value},${target},${note},${mood},${log.timeStamp}`;
    })
    .join('\n');

  const csv = header + rows;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `habitflow-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import data from a HabitFlow JSON backup file.
 */
async function importFromJSON(file: File): Promise<{ imported: number; errors: string[] }> {
  const errors: string[] = [];
  let imported = 0;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (!parsed.data || parsed.app !== 'HabitFlow') {
      return { imported: 0, errors: ['Invalid HabitFlow backup file.'] };
    }

    const { data } = parsed;

    // Import habits
    if (Array.isArray(data.habits) && data.habits.length > 0) {
      await db.habits.bulkPut(data.habits);
      imported += data.habits.length;
    }

    // Import habit logs
    if (Array.isArray(data.habitLogs) && data.habitLogs.length > 0) {
      await db.habitLogs.bulkPut(data.habitLogs);
      imported += data.habitLogs.length;
    }

    // Import tasks
    if (Array.isArray(data.tasks) && data.tasks.length > 0) {
      await db.tasks.bulkPut(data.tasks);
      imported += data.tasks.length;
    }

    // Import projects
    if (Array.isArray(data.projects) && data.projects.length > 0) {
      await db.projects.bulkPut(data.projects);
      imported += data.projects.length;
    }

    // Import moods
    if (Array.isArray(data.moods) && data.moods.length > 0) {
      await db.moods.bulkPut(data.moods);
      imported += data.moods.length;
    }

    // Import userXP
    if (data.userXP) {
      await db.userXP.put(data.userXP);
      imported += 1;
    }

    // Import settings
    if (data.settings) {
      await db.settings.put(data.settings);
      imported += 1;
    }
  } catch (err) {
    errors.push(`Failed to parse backup: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { imported, errors };
}

export const exportService = {
  exportToJSON,
  exportToCSV,
  importFromJSON,
};
