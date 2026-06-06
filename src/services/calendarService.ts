// ============================================================
// HabitFlow — Google Calendar Integration Service
// ============================================================
// Uses the Google Calendar REST API with the OAuth access token
// obtained via Supabase Auth (Google provider).  All calls
// degrade gracefully when the token is missing / expired.
// ============================================================

import type { Habit } from '@/types';

// ─── Constants ───────────────────────────────────────────────
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const EVENT_MAP_KEY = 'habitflow_calendar_events';

/** Map numeric day (0 = Sun … 6 = Sat) to RFC-5545 day abbreviation. */
const DAY_MAP: Record<number, string> = {
  0: 'SU',
  1: 'MO',
  2: 'TU',
  3: 'WE',
  4: 'TH',
  5: 'FR',
  6: 'SA',
};

// ─── Helpers ─────────────────────────────────────────────────

import { useAuthStore } from '../store/authStore';

/**
 * Retrieve the Google OAuth access token that Supabase obtained.
 */
function getGoogleToken(): string | null {
  try {
    const session = useAuthStore.getState().session;
    const token = session?.provider_token;
    return typeof token === 'string' && token.length > 0 ? token : null;
  } catch {
    console.warn('[calendarService] Failed to read Google token from auth store');
    return null;
  }
}

/** Build common headers for every Google Calendar API call. */
function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/** Read the habitId → calendarEventId map from localStorage. */
function getEventMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(EVENT_MAP_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/** Persist the habitId → calendarEventId map. */
function saveEventMap(map: Record<string, string>): void {
  localStorage.setItem(EVENT_MAP_KEY, JSON.stringify(map));
}

/**
 * Build an RRULE string matching the habit's frequency settings.
 *
 * - daily   → RRULE:FREQ=DAILY
 * - weekly  → RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR  (from frequencyDays)
 * - custom  → RRULE:FREQ=DAILY;INTERVAL=N
 */
function buildRRule(habit: Habit): string {
  switch (habit.frequency) {
    case 'daily':
      return 'RRULE:FREQ=DAILY';

    case 'weekly': {
      const days =
        habit.frequencyDays && habit.frequencyDays.length > 0
          ? habit.frequencyDays.map(d => DAY_MAP[d] ?? 'MO').join(',')
          : 'MO,TU,WE,TH,FR,SA,SU';
      return `RRULE:FREQ=WEEKLY;BYDAY=${days}`;
    }

    case 'custom': {
      const interval = habit.frequencyInterval ?? 1;
      return `RRULE:FREQ=DAILY;INTERVAL=${interval}`;
    }

    default:
      return 'RRULE:FREQ=DAILY';
  }
}

/** Get the user's IANA timezone or fall back to UTC. */
function getTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Create a recurring Google Calendar event that mirrors the habit's
 * schedule and reminder time.
 *
 * @returns The Google Calendar event ID, or `null` on failure.
 */
async function syncHabitToCalendar(habit: Habit): Promise<string | null> {
  const token = getGoogleToken();
  if (!token) {
    console.warn('[calendarService] No Google token — skipping calendar sync');
    return null;
  }

  const timeZone = getTimeZone();
  const startTime = habit.reminderTime ?? '09:00';

  // Build start / end DateTimes (30-minute event)
  const startDate = new Date(`${habit.startDate}T${startTime}:00`);
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

  // Format to RFC-3339 local datetime (no Z — we provide timeZone separately)
  const fmt = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const event = {
    summary: `${habit.icon} ${habit.name}`,
    description: `HabitFlow habit: ${habit.category}`,
    start: { dateTime: fmt(startDate), timeZone },
    end: { dateTime: fmt(endDate), timeZone },
    recurrence: [buildRRule(habit)],
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: 10 }],
    },
    colorId: habitColorToCalendarColorId(habit.color),
  };

  try {
    const res = await fetch(`${CALENDAR_API}/calendars/primary/events`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(event),
    });

    if (!res.ok) {
      console.warn(`[calendarService] Failed to create event (${res.status}):`, await res.text());
      return null;
    }

    const data = (await res.json()) as { id: string };
    const eventId = data.id;

    // Persist mapping
    const map = getEventMap();
    map[habit.id] = eventId;
    saveEventMap(map);

    return eventId;
  } catch (err) {
    console.warn('[calendarService] Error creating calendar event:', err);
    return null;
  }
}

/**
 * Create a single all-day event to mark a habit as completed on a
 * given date.
 */
async function markHabitDoneInCalendar(
  habitName: string,
  habitIcon: string,
  date: string // YYYY-MM-DD
): Promise<void> {
  const token = getGoogleToken();
  if (!token) {
    console.warn('[calendarService] No Google token — skipping completion event');
    return;
  }

  const event = {
    summary: `✅ ${habitIcon} ${habitName}`,
    start: { date },
    end: { date },
    transparency: 'transparent', // doesn't block the calendar
  };

  try {
    const res = await fetch(`${CALENDAR_API}/calendars/primary/events`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(event),
    });

    if (!res.ok) {
      console.warn(
        `[calendarService] Failed to create completion event (${res.status}):`,
        await res.text()
      );
    }
  } catch (err) {
    console.warn('[calendarService] Error creating completion event:', err);
  }
}

/**
 * Delete the Google Calendar event associated with a habit.
 */
async function removeCalendarEvent(habitId: string): Promise<void> {
  const token = getGoogleToken();
  if (!token) {
    console.warn('[calendarService] No Google token — skipping event removal');
    return;
  }

  const map = getEventMap();
  const eventId = map[habitId];
  if (!eventId) {
    console.warn(`[calendarService] No calendar event found for habit ${habitId}`);
    return;
  }

  try {
    const res = await fetch(
      `${CALENDAR_API}/calendars/primary/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: authHeaders(token),
      }
    );

    if (!res.ok && res.status !== 410 /* already gone */) {
      console.warn(`[calendarService] Failed to delete event (${res.status}):`, await res.text());
    }

    // Remove from local map regardless
    delete map[habitId];
    saveEventMap(map);
  } catch (err) {
    console.warn('[calendarService] Error deleting calendar event:', err);
  }
}

/**
 * Fetch Google Calendar events within a date range.  Useful for
 * suggesting habit imports from existing calendar entries.
 */
async function getCalendarEvents(
  startDate: string, // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
): Promise<GoogleCalendarEvent[]> {
  const token = getGoogleToken();
  if (!token) {
    console.warn('[calendarService] No Google token — cannot fetch events');
    return [];
  }

  const timeMin = `${startDate}T00:00:00Z`;
  const timeMax = `${endDate}T23:59:59Z`;
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '100',
  });

  try {
    const res = await fetch(`${CALENDAR_API}/calendars/primary/events?${params.toString()}`, {
      method: 'GET',
      headers: authHeaders(token),
    });

    if (!res.ok) {
      console.warn(`[calendarService] Failed to fetch events (${res.status}):`, await res.text());
      return [];
    }

    const data = (await res.json()) as { items?: GoogleCalendarEvent[] };
    return data.items ?? [];
  } catch (err) {
    console.warn('[calendarService] Error fetching calendar events:', err);
    return [];
  }
}

/**
 * Returns `true` when a Google OAuth token is available, indicating
 * the calendar integration *should* work.  Does not validate the
 * token against Google's servers.
 */
function isCalendarConnected(): boolean {
  return getGoogleToken() !== null;
}

// ─── Color Mapping ───────────────────────────────────────────
// Google Calendar API uses a fixed set of color IDs (1–11).
// We do a best-effort mapping from common hex / Tailwind-ish
// color names to the closest Google Calendar color.

const COLOR_KEYWORD_MAP: Record<string, string> = {
  blue: '9',
  indigo: '9',
  violet: '3',
  purple: '3',
  red: '11',
  rose: '4',
  pink: '4',
  orange: '6',
  amber: '5',
  yellow: '5',
  green: '10',
  emerald: '10',
  teal: '2',
  cyan: '7',
  sky: '9',
  slate: '8',
  gray: '8',
  grey: '8',
};

function habitColorToCalendarColorId(color: string): string | undefined {
  if (!color) return undefined;
  const lower = color.toLowerCase();
  // Check keyword matches first
  for (const [keyword, id] of Object.entries(COLOR_KEYWORD_MAP)) {
    if (lower.includes(keyword)) return id;
  }
  // Default — let Google pick
  return undefined;
}

// ─── Types ───────────────────────────────────────────────────

/** Lightweight representation of a Google Calendar event. */
export interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  recurrence?: string[];
  status?: string;
}

// ─── Export ──────────────────────────────────────────────────

export const calendarService = {
  getGoogleToken,
  syncHabitToCalendar,
  markHabitDoneInCalendar,
  removeCalendarEvent,
  getCalendarEvents,
  isCalendarConnected,
};
