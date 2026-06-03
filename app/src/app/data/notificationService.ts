import { ChecklistTemplate } from './types';
import { todayStr, offsetDate } from './dateUtils';
import { isScheduled } from './occurrenceUtils';

/** Request permission and register notifications for all templates */
export async function requestAndScheduleNotifications(
  templates: ChecklistTemplate[],
  userId: string,
): Promise<boolean> {
  if (!('Notification' in window)) return false;

  let perm = Notification.permission;
  if (perm === 'default') {
    perm = await Notification.requestPermission();
  }
  if (perm !== 'granted') return false;

  scheduleNotifications(templates, userId);
  return true;
}

/** Schedule notifications for today and tomorrow */
export function scheduleNotifications(
  templates: ChecklistTemplate[],
  userId: string,
): void {
  if (Notification.permission !== 'granted') return;
  if (!('serviceWorker' in navigator)) return;

  const userTemplates = templates.filter((t) => t.userId === userId && t.notificationTime);
  const today = todayStr();
  const tomorrow = offsetDate(today, 1);

  navigator.serviceWorker.ready.then((reg) => {
    for (const tmpl of userTemplates) {
      for (const dateStr of [today, tomorrow]) {
        if (!isScheduled(tmpl, dateStr)) continue;

        const [h, m] = (tmpl.notificationTime!).split(':').map(Number);
        const d = new Date(dateStr + 'T12:00:00');
        d.setHours(h, m, 0, 0);
        const timestamp = d.getTime();

        if (timestamp <= Date.now()) continue;

        reg.active?.postMessage({
          type: 'SCHEDULE_NOTIFICATION',
          title: `📋 ${tmpl.title}`,
          body: 'チェックリストを確認してください',
          timestamp,
        });
      }
    }
  }).catch(() => {
    // SW not available, skip
  });
}
