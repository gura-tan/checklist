// ────────────────────────────────────────────────────────────
// Value types for checklist items
// Extensible: add new types here without breaking existing data
// ────────────────────────────────────────────────────────────
export type ItemValueType =
  | 'static'      // Always the same value
  | 'blank'       // Empty – user fills in each time
  | 'by-weekday'; // Different value per day of week
  // Future: | 'by-date' | 'formula'

export interface WeekdayValues {
  0: string; // Sunday
  1: string; // Monday
  2: string; // Tuesday
  3: string; // Wednesday
  4: string; // Thursday
  5: string; // Friday
  6: string; // Saturday
}

export const EMPTY_WEEKDAY_VALUES: WeekdayValues = { 0: '', 1: '', 2: '', 3: '', 4: '', 5: '', 6: '' };

export interface TemplateItem {
  id: string;
  key: string;
  valueType: ItemValueType;
  staticValue: string;
  weekdayValues: WeekdayValues;
}

// ────────────────────────────────────────────────────────────
// Schedule types
// ────────────────────────────────────────────────────────────
export type ScheduleType = 'daily' | 'weekdays' | 'custom' | 'interval';

export interface ChecklistTemplate {
  id: string;
  userId: string;
  title: string;
  color: string;
  items: TemplateItem[];
  scheduleType: ScheduleType;
  scheduleDays: number[];          // Used by 'custom'
  scheduleIntervalDays: number;    // Used by 'interval' (e.g. every 3 days)
  scheduleStartDate: string;       // Used by 'interval' (YYYY-MM-DD baseline)
  notificationTime: string | null; // "HH:MM" or null
  createdAt: number;
  updatedAt: number;
}

// ────────────────────────────────────────────────────────────
// Occurrences (one per checklist per scheduled date)
// ────────────────────────────────────────────────────────────
export interface OccurrenceItem {
  id: string;
  templateItemId: string;
  key: string;
  value: string;    // Resolved value for this specific date (editable)
  checked: boolean;
}

export interface ChecklistOccurrence {
  id: string;
  templateId: string;
  userId: string;
  date: string;   // YYYY-MM-DD
  title: string;
  color: string;
  items: OccurrenceItem[];
  completedAt: number | null;
}

// ────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────
export const ACCENT_COLORS = [
  '#007AFF', '#34C759', '#FF9500', '#FF3B30',
  '#AF52DE', '#5AC8FA', '#FF6B35', '#32ADE6',
];

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface User {
  id: string;
  username: string;
  password: string;
  displayName: string;
}
