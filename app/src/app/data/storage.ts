import { User, ChecklistTemplate, ChecklistOccurrence, EMPTY_WEEKDAY_VALUES } from './types';

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

// ──────────────────────────────────────────────────────────────
// Migrate old template items (isVariable: bool → valueType)
// so existing data from the reference app continues to work
// ──────────────────────────────────────────────────────────────
function migrateTemplates(templates: ChecklistTemplate[]): ChecklistTemplate[] {
  return templates.map((t) => {
    const items = (t.items as unknown as Array<Record<string, unknown>>).map((item) => {
      if ('valueType' in item) return item; // Already migrated
      const isVariable = !!(item['isVariable'] as boolean);
      return {
        ...item,
        valueType: isVariable ? 'blank' : 'static',
        staticValue: (item['defaultValue'] as string) ?? '',
        weekdayValues: { ...EMPTY_WEEKDAY_VALUES },
      };
    });
    return {
      ...t,
      items: items as unknown as ChecklistTemplate['items'],
      scheduleIntervalDays: (t as unknown as Record<string, unknown>)['scheduleIntervalDays'] as number ?? 1,
      scheduleStartDate: (t as unknown as Record<string, unknown>)['scheduleStartDate'] as string ?? '',
    };
  });
}

export const storage = {
  getUsers: (): User[] => load(K.USERS, []),
  saveUsers: (u: User[]) => persist(K.USERS, u),

  getTemplates: (): ChecklistTemplate[] => {
    const raw = load<ChecklistTemplate[]>(K.TEMPLATES, []);
    return migrateTemplates(raw);
  },
  saveTemplates: (t: ChecklistTemplate[]) => persist(K.TEMPLATES, t),

  getOccurrences: (): ChecklistOccurrence[] => load(K.OCCURRENCES, []),
  saveOccurrences: (o: ChecklistOccurrence[]) => persist(K.OCCURRENCES, o),

  getSession: (): string | null => localStorage.getItem(K.SESSION),
  saveSession: (id: string) => localStorage.setItem(K.SESSION, id),
  clearSession: () => localStorage.removeItem(K.SESSION),
};

// ──────────────────────────────────────────────────────────────
// Seed data for first launch
// ──────────────────────────────────────────────────────────────
export function initSeedData() {
  if (storage.getUsers().length > 0) return;
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);

  storage.saveUsers([
    { id: 'u1', username: 'admin', password: 'admin123', displayName: 'Admin' },
  ]);

  storage.saveTemplates([
    {
      id: 't1', userId: 'u1',
      title: '登校前チェック',
      color: '#007AFF',
      items: [
        {
          id: 'i1', key: '持っていく端末',
          valueType: 'static', staticValue: 'Chromebook',
          weekdayValues: { ...EMPTY_WEEKDAY_VALUES },
        },
        {
          id: 'i2', key: '今日の自学時間',
          valueType: 'blank', staticValue: '',
          weekdayValues: { ...EMPTY_WEEKDAY_VALUES },
        },
        {
          id: 'i3', key: '今日の小テスト',
          valueType: 'by-weekday', staticValue: '',
          weekdayValues: { 0: 'なし', 1: '数学', 2: 'なし', 3: '英語', 4: 'なし', 5: '理科', 6: 'なし' },
        },
        {
          id: 'i4', key: '今日の提出課題',
          valueType: 'blank', staticValue: '',
          weekdayValues: { ...EMPTY_WEEKDAY_VALUES },
        },
      ],
      scheduleType: 'weekdays',
      scheduleDays: [],
      scheduleIntervalDays: 1,
      scheduleStartDate: today,
      notificationTime: '07:30',
      createdAt: now, updatedAt: now,
    },
  ]);
}
