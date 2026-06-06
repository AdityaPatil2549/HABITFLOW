import { format, addHours } from 'date-fns';
import type { Habit } from '../types';
import type { Task } from '../types';

function generateIcsString(
  title: string,
  description: string,
  startDate: Date,
  endDate: Date
): string {
  const formatDate = (date: Date) => format(date, "yyyyMMdd'T'HHmmss");

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HabitFlow//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `DTSTAMP:${formatDate(new Date())}`,
    `UID:${crypto.randomUUID()}@habitflow.app`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\n');
}

function downloadIcs(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportHabitToCalendar(habit: Habit) {
  // Assume user wants to do this habit right now for 1 hour
  const start = new Date();
  const end = addHours(start, 1);
  const streakInfo = (habit as any).streak?.current ?? 0;

  const ics = generateIcsString(
    `Habit: ${habit.name}`,
    `HabitFlow reminder to complete your habit: ${habit.name}\\nStreak: ${streakInfo} days`,
    start,
    end
  );

  downloadIcs(`habit-${habit.id}`, ics);
}

export function exportTaskToCalendar(task: Task) {
  const start = task.dueDate ? new Date(task.dueDate) : new Date();
  // If there's a due date, assume it's due at that time, default to 1 hour duration
  const end = addHours(start, 1);
  const statusLabel = task.completed ? 'Completed' : 'Pending';

  const ics = generateIcsString(
    `Task: ${task.title}`,
    `HabitFlow Task Deadline: ${task.title}\\nStatus: ${statusLabel}`,
    start,
    end
  );

  downloadIcs(`task-${task.id}`, ics);
}
