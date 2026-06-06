/**
 * Natural Language Parser for Habit Creation
 * Parses text like "Read 20 pages every night at 9 PM" into structured habit data.
 */
import type { ParsedHabitIntent } from '@/types';

const DAY_MAP: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  thur: 4,
  thurs: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  health: [
    'exercise',
    'walk',
    'run',
    'gym',
    'sleep',
    'water',
    'stretch',
    'workout',
    'pushup',
    'push-up',
    'squat',
    'plank',
    'swim',
    'bike',
    'cycling',
    'jog',
    'cardio',
    'weight',
    'eat',
    'diet',
    'vitamin',
    'hydrate',
    'drink',
  ],
  mindfulness: [
    'meditate',
    'meditation',
    'journal',
    'breathe',
    'breathing',
    'yoga',
    'pray',
    'prayer',
    'gratitude',
    'reflect',
    'mindful',
    'calm',
  ],
  learning: [
    'read',
    'study',
    'learn',
    'practice',
    'code',
    'coding',
    'program',
    'write',
    'draw',
    'paint',
    'language',
    'lesson',
    'course',
    'book',
    'page',
    'chapter',
  ],
  productivity: [
    'work',
    'clean',
    'organize',
    'plan',
    'review',
    'inbox',
    'email',
    'declutter',
    'tidy',
    'budget',
    'save',
    'invest',
    'task',
  ],
  social: [
    'call',
    'meet',
    'connect',
    'friend',
    'family',
    'text',
    'message',
    'chat',
    'visit',
    'network',
  ],
};

const TIME_WORDS: Record<string, string> = {
  morning: '08:00',
  dawn: '06:00',
  sunrise: '06:30',
  afternoon: '14:00',
  evening: '19:00',
  night: '21:00',
  bedtime: '22:00',
  noon: '12:00',
  midnight: '00:00',
  'before bed': '22:00',
  'after work': '18:00',
  lunch: '12:30',
};

const DURATION_UNITS = ['minute', 'minutes', 'min', 'mins', 'hour', 'hours', 'hr', 'hrs'];
const COUNT_UNITS = [
  'page',
  'pages',
  'step',
  'steps',
  'glass',
  'glasses',
  'cup',
  'cups',
  'rep',
  'reps',
  'set',
  'sets',
  'time',
  'times',
  'chapter',
  'chapters',
  'word',
  'words',
  'mile',
  'miles',
  'km',
  'kilometer',
  'kilometers',
  'liter',
  'liters',
  'pushup',
  'pushups',
  'push-up',
  'push-ups',
  'squat',
  'squats',
  'situp',
  'situps',
  'sit-up',
  'sit-ups',
  'calorie',
  'calories',
];

function parseHabitIntent(input: string): ParsedHabitIntent {
  const text = input.trim().toLowerCase();
  let confidence = 1.0;

  // ── Frequency ────────────────────────────────────────────────
  let frequency: ParsedHabitIntent['frequency'] = 'daily';
  let frequencyDays: number[] | undefined;
  let frequencyInterval: number | undefined;
  let frequencyParsed = false;

  // "every other day" / "every 3 days"
  const everyNMatch = text.match(/every\s+(\d+)\s+days?/);
  const everyOther = text.match(/every\s+other\s+day/);
  if (everyNMatch) {
    frequency = 'custom';
    frequencyInterval = parseInt(everyNMatch[1]);
    frequencyParsed = true;
  } else if (everyOther) {
    frequency = 'custom';
    frequencyInterval = 2;
    frequencyParsed = true;
  }

  // "on mondays and fridays" / "every monday"
  if (!frequencyParsed) {
    const dayPattern = Object.keys(DAY_MAP).join('|');
    const dayRegex = new RegExp(
      `(?:on|every)\\s+((?:(?:${dayPattern})(?:\\s*(?:,|and|&)\\s*)?)+)`,
      'i'
    );
    const dayMatch = text.match(dayRegex);
    if (dayMatch) {
      const matched = dayMatch[1].toLowerCase();
      const foundDays: number[] = [];
      for (const [name, num] of Object.entries(DAY_MAP)) {
        if (matched.includes(name)) foundDays.push(num);
      }
      if (foundDays.length > 0) {
        frequency = 'weekly';
        frequencyDays = [...new Set(foundDays)].sort();
        frequencyParsed = true;
      }
    }
  }

  // "weekly"
  if (!frequencyParsed && /\bweekly\b/.test(text)) {
    frequency = 'weekly';
    frequencyParsed = true;
  }

  // "daily" / "every day" / "each day"
  if (!frequencyParsed && /\b(?:daily|every\s+day|each\s+day)\b/.test(text)) {
    frequency = 'daily';
    frequencyParsed = true;
  }

  if (!frequencyParsed) confidence -= 0.15;

  // ── Time ─────────────────────────────────────────────────────
  let reminderTime: string | undefined;
  let timeParsed = false;

  // "at 9 PM" / "at 9:30am" / "at 21:00"
  const timeMatch = text.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const mins = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const meridiem = timeMatch[3]?.toLowerCase();
    if (meridiem === 'pm' && hours < 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;
    reminderTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    timeParsed = true;
  }

  // Time words: "morning", "evening", etc.
  if (!timeParsed) {
    for (const [word, time] of Object.entries(TIME_WORDS)) {
      if (text.includes(word)) {
        reminderTime = time;
        timeParsed = true;
        break;
      }
    }
  }

  if (!timeParsed) confidence -= 0.15;

  // ── Target / Quantity ────────────────────────────────────────
  let type: ParsedHabitIntent['type'] = 'boolean';
  let targetValue = 1;
  let unit: string | undefined;
  let quantityParsed = false;

  // "for 30 minutes" / "30 min" / "1 hour"
  const durationRegex = new RegExp(`(\\d+)\\s*(?:${DURATION_UNITS.join('|')})`, 'i');
  const durationMatch = text.match(durationRegex);
  if (durationMatch) {
    type = 'duration';
    targetValue = parseInt(durationMatch[1]);
    const matchedUnit = durationMatch[0]
      .replace(/\d+\s*/, '')
      .trim()
      .toLowerCase();
    if (['hour', 'hours', 'hr', 'hrs'].includes(matchedUnit)) {
      targetValue *= 60;
    }
    unit = 'minutes';
    quantityParsed = true;
  }

  // "20 pages" / "10000 steps" / "8 glasses"
  if (!quantityParsed) {
    const countRegex = new RegExp(`(\\d+)\\s*(${COUNT_UNITS.join('|')})`, 'i');
    const countMatch = text.match(countRegex);
    if (countMatch) {
      type = 'count';
      targetValue = parseInt(countMatch[1]);
      unit = countMatch[2].toLowerCase();
      // Normalize plural
      if (!unit.endsWith('s') && targetValue > 1) unit += 's';
      quantityParsed = true;
    }
  }

  if (!quantityParsed) confidence -= 0.15;

  // ── Category ─────────────────────────────────────────────────
  let category = 'general';
  let categoryParsed = false;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) {
      category = cat;
      categoryParsed = true;
      break;
    }
  }
  if (!categoryParsed) confidence -= 0.1;

  // ── Name extraction ──────────────────────────────────────────
  let name = input.trim();

  // Remove frequency phrases
  name = name.replace(
    /\b(?:every\s+(?:other\s+)?(?:day|\d+\s*days?)|daily|weekly|each\s+day)\b/gi,
    ''
  );
  // Remove day names with on/every
  const dayNames = Object.keys(DAY_MAP).join('|');
  name = name.replace(
    new RegExp(`\\b(?:on|every)\\s+(?:(?:${dayNames})(?:\\s*(?:,|and|&)\\s*)?)+`, 'gi'),
    ''
  );
  // Remove time phrases
  name = name.replace(/\bat\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi, '');
  for (const word of Object.keys(TIME_WORDS)) {
    name = name.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  }
  // Remove quantity + unit
  if (quantityParsed) {
    name = name.replace(
      new RegExp(`\\b\\d+\\s*(?:${[...DURATION_UNITS, ...COUNT_UNITS].join('|')})\\b`, 'gi'),
      ''
    );
    name = name.replace(/\bfor\s+\b/gi, '');
    name = name.replace(/\bof\s+\b/gi, '');
  }
  // Clean up
  name = name
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.-]+|[\s,.-]+$/g, '')
    .trim();
  // Capitalize first letter
  if (name.length > 0) name = name[0].toUpperCase() + name.slice(1);
  if (!name) {
    name = 'New Habit';
    confidence -= 0.25;
  }

  // Floor confidence
  confidence = Math.max(0.1, Math.round(confidence * 100) / 100);

  return {
    name,
    frequency,
    frequencyDays,
    frequencyInterval,
    reminderTime,
    category,
    type,
    targetValue,
    unit,
    confidence,
  };
}

export const nlpParserService = { parseHabitIntent };
