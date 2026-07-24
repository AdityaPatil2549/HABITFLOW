import type { ParsedHabitIntent } from '../types';

/**
 * NLP parser service for natural language habit creation.
 * Parses plain text like "Run 30 minutes every morning at 7am" into structured habit data.
 */

const FREQUENCY_PATTERNS: { regex: RegExp; frequency: ParsedHabitIntent['frequency'] }[] = [
  { regex: /every\s+day|daily|each\s+day/i, frequency: 'daily' },
  { regex: /every\s+week|weekly|once\s+a\s+week/i, frequency: 'weekly' },
];

const TIME_PATTERN = /\bat\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i;
const DURATION_PATTERN = /(\d+)\s*(minute|min|hour|hr|second|sec)/i;
const COUNT_PATTERN = /(\d+)\s*(time|rep|set|page|glass|cup|km|mile|step)/i;

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  health: ['run', 'walk', 'gym', 'workout', 'exercise', 'water', 'sleep', 'diet', 'eat', 'drink'],
  mindfulness: ['meditat', 'breath', 'journal', 'reflect', 'gratitude', 'mindful', 'calm'],
  learning: ['read', 'study', 'learn', 'practice', 'code', 'course', 'book', 'language'],
  productivity: ['work', 'task', 'plan', 'review', 'focus', 'deep work', 'email'],
  social: ['call', 'friend', 'family', 'connect', 'reach out'],
};

const ICON_MAP: Record<string, string> = {
  health: '💪',
  mindfulness: '🧘',
  learning: '📚',
  productivity: '⚡',
  social: '👋',
  general: '✨',
};

export const nlpParserService = {
  parseHabitIntent(input: string): ParsedHabitIntent {
    const lower = input.toLowerCase();

    // Detect category
    let category = 'general';
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(kw => lower.includes(kw))) {
        category = cat;
        break;
      }
    }

    // Detect frequency
    let frequency: ParsedHabitIntent['frequency'] = 'daily';
    for (const { regex, frequency: freq } of FREQUENCY_PATTERNS) {
      if (regex.test(lower)) {
        frequency = freq;
        break;
      }
    }

    // Detect reminder time
    const timeMatch = TIME_PATTERN.exec(input);
    const reminderTime = timeMatch ? timeMatch[1].trim() : undefined;

    // Detect target value and type
    let targetValue = 1;
    let type: ParsedHabitIntent['type'] = 'boolean';
    let unit: string | undefined;

    const durationMatch = DURATION_PATTERN.exec(lower);
    const countMatch = COUNT_PATTERN.exec(lower);

    if (durationMatch) {
      targetValue = parseInt(durationMatch[1]);
      type = 'duration';
      unit = durationMatch[2].startsWith('hour') || durationMatch[2].startsWith('hr') ? 'hr' : 'min';
    } else if (countMatch) {
      targetValue = parseInt(countMatch[1]);
      type = 'count';
      unit = countMatch[2];
    }

    // Extract habit name — strip time/frequency/count phrases
    let name = input
      .replace(TIME_PATTERN, '')
      .replace(/every\s+\w+/gi, '')
      .replace(/\d+\s*(minute|min|hour|hr|time|rep|page|glass|cup|km|mile|step)s?/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Capitalize
    name = name.charAt(0).toUpperCase() + name.slice(1);
    if (!name || name.length < 2) name = input.trim();

    // Confidence based on how much we detected
    let confidence = 0.3;
    if (category !== 'general') confidence += 0.2;
    if (frequency !== 'daily') confidence += 0.1;
    if (reminderTime) confidence += 0.2;
    if (type !== 'boolean') confidence += 0.2;
    confidence = Math.min(confidence, 1.0);

    return {
      name,
      category,
      frequency,
      frequencyDays: frequency === 'weekly' ? [1] : undefined,
      frequencyInterval: undefined,
      type,
      targetValue,
      unit,
      reminderTime,
      icon: ICON_MAP[category] ?? '✨',
      confidence,
    };
  },
};
