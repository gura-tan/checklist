export interface User {
  id: string;
  username: string;
  password: string;
  displayName: string;
}

export interface TemplateItem {
  id: string;
  key: string;
  defaultValue: string;
  isVariable: boolean;
}

export type ScheduleType = 'daily' | 'weekdays' | 'custom';

export const ACCENT_COLORS = [
  '#007AFF', '#34C759', '#FF9500', '#FF3B30',
  '#AF52DE', '#5AC8FA', '#FF6B35', '#32ADE6',
];

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface ChecklistTemplate {
  id: string;
  userId: string;
  title: string;
  color: string;
  items: TemplateItem[];
  scheduleType: ScheduleType;
  scheduleDays: number[];
  notificationTime: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface OccurrenceItem {
  id: string;
  templateItemId: string;
  key: string;
  value: string;
  checked: boolean;
}

export interface ChecklistOccurrence {
  id: string;
  templateId: string;
  userId: string;
  date: string;
  title: string;
  color: string;
  items: OccurrenceItem[];
  completedAt: number | null;
}
