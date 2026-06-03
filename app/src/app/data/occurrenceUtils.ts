import {
  ChecklistTemplate, ChecklistOccurrence, OccurrenceItem,
  TemplateItem, WeekdayValues,
} from './types';
import { storage, uid } from './storage';
import { getDayOfWeek, offsetDate, todayStr, daysBetween } from './dateUtils';

// ──────────────────────────────────────────────────────────────
// Scheduling logic
// ──────────────────────────────────────────────────────────────
export function isScheduled(tmpl: ChecklistTemplate, dateStr: string): boolean {
  const dow = getDayOfWeek(dateStr);
  switch (tmpl.scheduleType) {
    case 'daily':
      return true;
    case 'weekdays':
      return dow >= 1 && dow <= 5;
    case 'custom':
      return tmpl.scheduleDays.includes(dow);
    case 'interval': {
      const start = tmpl.scheduleStartDate || todayStr();
      const diff = daysBetween(start, dateStr);
      const interval = Math.max(1, tmpl.scheduleIntervalDays || 1);
      return diff >= 0 && diff % interval === 0;
    }
  }
}

/** Find the next date (after fromDate) when this template is scheduled */
export function nextScheduledDate(tmpl: ChecklistTemplate, fromDate: string): string {
  let d = offsetDate(fromDate, 1);
  for (let i = 0; i < 400; i++) {
    if (isScheduled(tmpl, d)) return d;
    d = offsetDate(d, 1);
  }
  return offsetDate(fromDate, 1);
}

/** Find the previous date (before fromDate) when this template is scheduled */
export function prevScheduledDate(tmpl: ChecklistTemplate, fromDate: string): string {
  let d = offsetDate(fromDate, -1);
  for (let i = 0; i < 400; i++) {
    if (isScheduled(tmpl, d)) return d;
    d = offsetDate(d, -1);
  }
  return offsetDate(fromDate, -1);
}

/** Human-readable schedule description */
export function scheduleLabel(t: ChecklistTemplate): string {
  const DAYS = ['日', '月', '火', '水', '木', '金', '土'];
  switch (t.scheduleType) {
    case 'daily': return '毎日';
    case 'weekdays': return '月〜金';
    case 'custom':
      return t.scheduleDays.map((d) => DAYS[d]).join('・') || '未設定';
    case 'interval':
      return `${t.scheduleIntervalDays || 1}日ごと`;
  }
}

// ──────────────────────────────────────────────────────────────
// Value resolution
// ──────────────────────────────────────────────────────────────
function resolveValue(item: TemplateItem, dateStr: string): string {
  switch (item.valueType) {
    case 'static':
      return item.staticValue;
    case 'blank':
      return '';
    case 'by-weekday': {
      const dow = getDayOfWeek(dateStr) as keyof WeekdayValues;
      return item.weekdayValues[dow] || '';
    }
  }
}

// ──────────────────────────────────────────────────────────────
// Occurrence management
// ──────────────────────────────────────────────────────────────

/**
 * Ensure occurrences exist for all scheduled templates on a given date.
 * Creates missing ones with resolved values. Returns the user's occurrences for that date.
 */
export function ensureOccurrences(
  templates: ChecklistTemplate[],
  userId: string,
  dateStr: string,
): ChecklistOccurrence[] {
  const all = storage.getOccurrences();
  const existing = all.filter((o) => o.date === dateStr && o.userId === userId);
  const scheduled = templates.filter((t) => t.userId === userId && isScheduled(t, dateStr));

  const created: ChecklistOccurrence[] = [];
  for (const t of scheduled) {
    if (!existing.some((o) => o.templateId === t.id)) {
      const items: OccurrenceItem[] = t.items.map((ti) => ({
        id: uid(),
        templateItemId: ti.id,
        key: ti.key,
        value: resolveValue(ti, dateStr),
        checked: false,
      }));
      created.push({
        id: uid(),
        templateId: t.id,
        userId,
        date: dateStr,
        title: t.title,
        color: t.color,
        items,
        completedAt: null,
      });
    }
  }

  if (created.length > 0) {
    storage.saveOccurrences([...all, ...created]);
    return [...existing, ...created];
  }
  return existing;
}

/** Persist a single updated occurrence */
export function persistOccurrence(occ: ChecklistOccurrence): void {
  const all = storage.getOccurrences();
  const idx = all.findIndex((o) => o.id === occ.id);
  if (idx >= 0) all[idx] = occ;
  else all.push(occ);
  storage.saveOccurrences(all);
}

/** Remove future occurrences when a template is deleted or edited */
export function removeFutureOccurrences(templateId: string, fromDate: string): void {
  const all = storage.getOccurrences();
  storage.saveOccurrences(
    all.filter((o) => !(o.templateId === templateId && o.date >= fromDate))
  );
}

/**
 * Get or create an occurrence for a specific template on a specific date.
 * Used by ChecklistDetail when navigating to a future/past date.
 */
export function getOrCreateOccurrence(
  template: ChecklistTemplate,
  userId: string,
  dateStr: string,
): ChecklistOccurrence {
  const all = storage.getOccurrences();
  const existing = all.find(
    (o) => o.templateId === template.id && o.userId === userId && o.date === dateStr
  );
  if (existing) return existing;

  const items: OccurrenceItem[] = template.items.map((ti) => ({
    id: uid(),
    templateItemId: ti.id,
    key: ti.key,
    value: resolveValue(ti, dateStr),
    checked: false,
  }));
  const newOcc: ChecklistOccurrence = {
    id: uid(),
    templateId: template.id,
    userId,
    date: dateStr,
    title: template.title,
    color: template.color,
    items,
    completedAt: null,
  };
  storage.saveOccurrences([...all, newOcc]);
  return newOcc;
}
