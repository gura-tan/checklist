import { ChecklistTemplate, ChecklistOccurrence, OccurrenceItem } from './types';
import { storage, uid } from './storage';
import { getDayOfWeek } from './dateUtils';

function isScheduled(tmpl: ChecklistTemplate, dateStr: string): boolean {
  const dow = getDayOfWeek(dateStr);
  switch (tmpl.scheduleType) {
    case 'daily': return true;
    case 'weekdays': return dow >= 1 && dow <= 5;
    case 'custom': return tmpl.scheduleDays.includes(dow);
  }
}

export function ensureOccurrences(
  templates: ChecklistTemplate[],
  userId: string,
  dateStr: string,
): ChecklistOccurrence[] {
  const all = storage.getOccurrences();
  const existing = all.filter(o => o.date === dateStr && o.userId === userId);
  const scheduled = templates.filter(t => t.userId === userId && isScheduled(t, dateStr));

  const created: ChecklistOccurrence[] = [];
  for (const t of scheduled) {
    if (!existing.some(o => o.templateId === t.id)) {
      const items: OccurrenceItem[] = t.items.map(ti => ({
        id: uid(),
        templateItemId: ti.id,
        key: ti.key,
        value: ti.isVariable ? '' : ti.defaultValue,
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

export function persistOccurrence(occ: ChecklistOccurrence): void {
  const all = storage.getOccurrences();
  const idx = all.findIndex(o => o.id === occ.id);
  if (idx >= 0) all[idx] = occ;
  else all.push(occ);
  storage.saveOccurrences(all);
}

export function removeFutureOccurrences(templateId: string, fromDate: string): void {
  const all = storage.getOccurrences();
  storage.saveOccurrences(
    all.filter(o => !(o.templateId === templateId && o.date >= fromDate)),
  );
}

export function scheduleLabel(t: ChecklistTemplate): string {
  if (t.scheduleType === 'daily') return 'Every day';
  if (t.scheduleType === 'weekdays') return 'Mon – Fri';
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return t.scheduleDays.map(d => DAYS[d]).join(', ') || 'No days';
}
