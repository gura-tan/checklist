import { User, ChecklistTemplate, ChecklistOccurrence } from './types';

const K = {
  USERS: 'hl_users',
  TEMPLATES: 'hl_templates',
  OCCURRENCES: 'hl_occurrences',
  SESSION: 'hl_session',
};

function load<T>(key: string, fb: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fb;
  } catch {
    return fb;
  }
}

function persist(key: string, v: unknown) {
  localStorage.setItem(key, JSON.stringify(v));
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export const storage = {
  getUsers: (): User[] => load(K.USERS, []),
  saveUsers: (u: User[]) => persist(K.USERS, u),
  getTemplates: (): ChecklistTemplate[] => load(K.TEMPLATES, []),
  saveTemplates: (t: ChecklistTemplate[]) => persist(K.TEMPLATES, t),
  getOccurrences: (): ChecklistOccurrence[] => load(K.OCCURRENCES, []),
  saveOccurrences: (o: ChecklistOccurrence[]) => persist(K.OCCURRENCES, o),
  getSession: (): string | null => localStorage.getItem(K.SESSION),
  saveSession: (id: string) => localStorage.setItem(K.SESSION, id),
  clearSession: () => localStorage.removeItem(K.SESSION),
};

export function initSeedData() {
  if (storage.getUsers().length > 0) return;
  const now = Date.now();

  storage.saveUsers([
    { id: 'u1', username: 'admin', password: 'admin123', displayName: 'Admin' },
    { id: 'u2', username: 'student', password: 'student', displayName: 'Student' },
  ]);

  storage.saveTemplates([
    {
      id: 't1', userId: 'u2', title: 'Before Leaving for School',
      color: '#007AFF',
      items: [
        { id: 'i1', key: 'DEVICE TO BRING', defaultValue: 'CHROMEBOOK', isVariable: false },
        { id: 'i2', key: 'SELF-STUDY HOURS TODAY', defaultValue: '', isVariable: true },
        { id: 'i3', key: 'QUIZZES TODAY', defaultValue: '', isVariable: true },
        { id: 'i4', key: 'ASSIGNMENTS DUE TODAY', defaultValue: '', isVariable: true },
      ],
      scheduleType: 'weekdays', scheduleDays: [],
      notificationTime: '07:30', createdAt: now, updatedAt: now,
    },
    {
      id: 't2', userId: 'u1', title: 'Morning Routine',
      color: '#FF9500',
      items: [
        { id: 'i5', key: 'COFFEE', defaultValue: 'BREWING', isVariable: false },
        { id: 'i6', key: 'VITAMINS', defaultValue: 'TAKEN', isVariable: false },
        { id: 'i7', key: 'EXERCISE', defaultValue: 'DONE', isVariable: false },
        { id: 'i8', key: 'EMAILS', defaultValue: 'CHECKED', isVariable: false },
      ],
      scheduleType: 'daily', scheduleDays: [],
      notificationTime: '08:00', createdAt: now + 1, updatedAt: now + 1,
    },
    {
      id: 't3', userId: 'u1', title: 'Evening Shutdown',
      color: '#AF52DE',
      items: [
        { id: 'i9', key: 'DOORS', defaultValue: 'LOCKED', isVariable: false },
        { id: 'i10', key: 'STOVE', defaultValue: 'OFF', isVariable: false },
        { id: 'i11', key: 'PHONE', defaultValue: 'CHARGING', isVariable: false },
        { id: 'i12', key: 'ALARM', defaultValue: 'SET', isVariable: false },
      ],
      scheduleType: 'daily', scheduleDays: [],
      notificationTime: '22:00', createdAt: now + 2, updatedAt: now + 2,
    },
  ]);
}
