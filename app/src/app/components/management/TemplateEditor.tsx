import { useState } from 'react';
import {
  ChecklistTemplate, TemplateItem, ItemValueType,
  ACCENT_COLORS, DAY_NAMES, ScheduleType, EMPTY_WEEKDAY_VALUES,
} from '../../data/types';
import { uid } from '../../data/storage';
import { todayStr } from '../../data/dateUtils';
import WeekdayValueSheet from './WeekdayValueSheet';

interface Props {
  userId: string;
  template: ChecklistTemplate | null;
  onSave: (t: ChecklistTemplate) => void;
  onCancel: () => void;
}

function blankTemplate(userId: string): ChecklistTemplate {
  const now = Date.now();
  return {
    id: uid(), userId,
    title: '',
    color: ACCENT_COLORS[0],
    items: [{ id: uid(), key: '', valueType: 'blank', staticValue: '', weekdayValues: { ...EMPTY_WEEKDAY_VALUES } }],
    scheduleType: 'daily',
    scheduleDays: [],
    scheduleIntervalDays: 3,
    scheduleStartDate: todayStr(),
    notificationTime: null,
    createdAt: now, updatedAt: now,
  };
}

export default function TemplateEditor({ userId, template, onSave, onCancel }: Props) {
  const [form, setForm] = useState<ChecklistTemplate>(() =>
    template
      ? { ...template, items: template.items.map((i) => ({ ...i, weekdayValues: { ...i.weekdayValues } })) }
      : blankTemplate(userId)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Which item's weekday sheet is open (item index or null)
  const [weekdaySheetIdx, setWeekdaySheetIdx] = useState<number | null>(null);

  const set = (patch: Partial<ChecklistTemplate>) => setForm((f) => ({ ...f, ...patch }));

  const setItem = (idx: number, patch: Partial<TemplateItem>) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    }));
  };

  const addItem = () => {
    setForm((f) => ({
      ...f,
      items: [...f.items, { id: uid(), key: '', valueType: 'blank', staticValue: '', weekdayValues: { ...EMPTY_WEEKDAY_VALUES } }],
    }));
  };

  const removeItem = (idx: number) => {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= form.items.length) return;
    setForm((f) => {
      const items = [...f.items];
      [items[idx], items[newIdx]] = [items[newIdx], items[idx]];
      return { ...f, items };
    });
  };

  const toggleScheduleDay = (dow: number) => {
    const days = form.scheduleDays.includes(dow)
      ? form.scheduleDays.filter((d) => d !== dow)
      : [...form.scheduleDays, dow].sort();
    set({ scheduleDays: days });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'タイトルを入力してください';
    if (form.items.every((i) => !i.key.trim())) errs.items = '少なくとも1つの項目を追加してください';
    if (form.scheduleType === 'custom' && form.scheduleDays.length === 0) {
      errs.days = '少なくとも1つの曜日を選択してください';
    }
    if (form.scheduleType === 'interval' && (!form.scheduleIntervalDays || form.scheduleIntervalDays < 1)) {
      errs.interval = '1以上の日数を設定してください';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      ...form,
      title: form.title.trim(),
      items: form.items.filter((i) => i.key.trim()),
      updatedAt: Date.now(),
    });
  };

  const scheduleTypes: { type: ScheduleType; label: string }[] = [
    { type: 'daily', label: '毎日' },
    { type: 'weekdays', label: '月〜金' },
    { type: 'custom', label: 'カスタム' },
    { type: 'interval', label: 'N日ごと' },
  ];

  return (
    <>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F2F2F7' }}>
        {/* Nav header */}
        <div style={navHeader}>
          <button onClick={onCancel} style={cancelBtn}>キャンセル</button>
          <span style={{ fontSize: '17px', fontWeight: 800, color: '#1C1C1E' }}>
            {template ? 'チェックリストを編集' : '新規チェックリスト'}
          </span>
          <button onClick={handleSave} style={{ ...cancelBtn, color: form.color, fontWeight: 900 }}>保存</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 48px' }}>

          {/* Title */}
          <Section label="タイトル">
            {errors.title && <ErrorMsg>{errors.title}</ErrorMsg>}
            <input
              style={textInput}
              value={form.title}
              placeholder="例: 登校前チェック"
              onChange={(e) => set({ title: e.target.value })}
            />
          </Section>

          {/* Color */}
          <Section label="カラー">
            <div style={{ display: 'flex', gap: '10px', padding: '6px 0', flexWrap: 'wrap' }}>
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => set({ color: c })}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: c, border: 'none', cursor: 'pointer',
                    boxShadow: form.color === c ? `0 0 0 3px #fff, 0 0 0 5px ${c}` : 'none',
                    transform: form.color === c ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>
          </Section>

          {/* Schedule */}
          <Section label="繰り返し">
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
              {scheduleTypes.map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => set({ scheduleType: type })}
                  style={{
                    flex: 1, minWidth: '60px', padding: '9px 4px', borderRadius: '10px', border: 'none',
                    background: form.scheduleType === type ? form.color : '#F2F2F7',
                    color: form.scheduleType === type ? '#fff' : '#1C1C1E',
                    fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                    fontFamily: "'Nunito', sans-serif", transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Custom: day selector */}
            {form.scheduleType === 'custom' && (
              <>
                {errors.days && <ErrorMsg>{errors.days}</ErrorMsg>}
                <div style={{ display: 'flex', gap: '5px', justifyContent: 'space-between' }}>
                  {DAY_NAMES.map((name, i) => {
                    const active = form.scheduleDays.includes(i);
                    return (
                      <button
                        key={i}
                        onClick={() => toggleScheduleDay(i)}
                        style={{
                          flex: 1, padding: '9px 0', borderRadius: '9px', border: 'none',
                          background: active ? form.color : '#F2F2F7',
                          color: active ? '#fff' : '#8E8E93',
                          fontSize: '12px', fontWeight: 800,
                          cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
                          transition: 'all 0.15s',
                        }}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Interval: N days */}
            {form.scheduleType === 'interval' && (
              <>
                {errors.interval && <ErrorMsg>{errors.interval}</ErrorMsg>}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#1C1C1E', flexShrink: 0 }}>
                    毎
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={form.scheduleIntervalDays || ''}
                    onChange={(e) => set({ scheduleIntervalDays: parseInt(e.target.value) || 1 })}
                    style={{
                      ...textInput,
                      width: '70px',
                      fontSize: '20px', fontWeight: 900,
                      color: form.color, textAlign: 'center',
                    }}
                  />
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#1C1C1E', flexShrink: 0 }}>
                    日ごと
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#8E8E93', marginTop: '8px', lineHeight: 1.5 }}>
                  開始日: {form.scheduleStartDate || todayStr()} から起算
                </p>
              </>
            )}
          </Section>

          {/* Notification */}
          <Section label="通知">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Toggle */}
              <div
                onClick={() => set({ notificationTime: form.notificationTime ? null : '07:30' })}
                style={{
                  width: '50px', height: '30px', borderRadius: '15px',
                  background: form.notificationTime ? form.color : '#D1D1D6',
                  position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
                }}
              >
                <div style={{
                  width: '26px', height: '26px', borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: '2px',
                  left: form.notificationTime ? '22px' : '2px',
                  transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }} />
              </div>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#1C1C1E' }}>
                {form.notificationTime ? 'オン' : 'オフ'}
              </span>
              {form.notificationTime && (
                <input
                  type="time"
                  value={form.notificationTime}
                  onChange={(e) => set({ notificationTime: e.target.value })}
                  style={{ ...textInput, flex: 1, fontSize: '20px', fontWeight: 900, color: form.color, textAlign: 'right' }}
                />
              )}
            </div>
            {form.notificationTime && (
              <p style={{ fontSize: '12px', color: '#8E8E93', marginTop: '10px', lineHeight: 1.5 }}>
                🔔 ホーム画面に追加（PWAとしてインストール）することでプッシュ通知が有効になります。
              </p>
            )}
          </Section>

          {/* Items */}
          <Section label={`項目  (${form.items.filter((i) => i.key.trim()).length})`}>
            {errors.items && <ErrorMsg>{errors.items}</ErrorMsg>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {form.items.map((item, idx) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  idx={idx}
                  total={form.items.length}
                  color={form.color}
                  onMove={(dir) => moveItem(idx, dir)}
                  onRemove={() => removeItem(idx)}
                  onKeyChange={(k) => setItem(idx, { key: k })}
                  onValueTypeChange={(vt) => {
                    setItem(idx, {
                      valueType: vt,
                      staticValue: vt !== 'static' ? '' : item.staticValue,
                    });
                  }}
                  onStaticValueChange={(v) => setItem(idx, { staticValue: v })}
                  onOpenWeekdaySheet={() => setWeekdaySheetIdx(idx)}
                />
              ))}
            </div>

            {/* Legend */}
            <p style={{ fontSize: '12px', color: '#8E8E93', marginTop: '10px', lineHeight: 1.6 }}>
              <strong>固定</strong> = 常に同じ値　<strong>空欄</strong> = 毎回入力　<strong>曜日</strong> = 曜日ごとに設定
            </p>

            <button onClick={addItem} style={addItemBtn(form.color)}>
              ＋ 項目を追加
            </button>
          </Section>
        </div>
      </div>

      {/* Weekday value sheet (Option B) */}
      {weekdaySheetIdx !== null && (
        <WeekdayValueSheet
          itemKey={form.items[weekdaySheetIdx]?.key || '項目'}
          values={form.items[weekdaySheetIdx]?.weekdayValues || { ...EMPTY_WEEKDAY_VALUES }}
          color={form.color}
          onSave={(wv) => setItem(weekdaySheetIdx, { weekdayValues: wv })}
          onClose={() => setWeekdaySheetIdx(null)}
        />
      )}
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// ItemRow sub-component
// ──────────────────────────────────────────────────────────────
interface ItemRowProps {
  item: TemplateItem;
  idx: number;
  total: number;
  color: string;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onKeyChange: (k: string) => void;
  onValueTypeChange: (vt: ItemValueType) => void;
  onStaticValueChange: (v: string) => void;
  onOpenWeekdaySheet: () => void;
}

function ItemRow({
  item, idx, total, color, onMove, onRemove,
  onKeyChange, onValueTypeChange, onStaticValueChange, onOpenWeekdaySheet,
}: ItemRowProps) {
  const valueTypes: { type: ItemValueType; label: string }[] = [
    { type: 'static', label: '固定' },
    { type: 'blank', label: '空欄' },
    { type: 'by-weekday', label: '曜日' },
  ];

  const hasWeekdayValues = Object.values(item.weekdayValues).some((v) => v.trim() !== '');

  return (
    <div style={{ background: '#F9F9FB', borderRadius: '12px', padding: '10px 10px 12px 8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Move buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
          <button onClick={() => onMove(-1)} style={moveBtn} disabled={idx === 0}>
            <svg width="12" height="8" viewBox="0 0 12 8"><path d="M1 7l5-5 5 5" stroke={idx === 0 ? '#D1D1D6' : '#8E8E93'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
          </button>
          <button onClick={() => onMove(1)} style={moveBtn} disabled={idx === total - 1}>
            <svg width="12" height="8" viewBox="0 0 12 8"><path d="M1 1l5 5 5-5" stroke={idx === total - 1 ? '#D1D1D6' : '#8E8E93'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
          </button>
        </div>

        {/* Key input */}
        <input
          style={{ ...itemInput, fontWeight: 800, flex: 1 }}
          placeholder="項目名 (例: 持っていく端末)"
          value={item.key}
          onChange={(e) => onKeyChange(e.target.value)}
        />

        {/* Delete */}
        <button
          onClick={onRemove}
          disabled={total === 1}
          style={{ ...moveBtn, opacity: total === 1 ? 0.25 : 1, flexShrink: 0 }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M1 1l11 11M12 1L1 12" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Value type selector */}
      <div style={{ display: 'flex', gap: '5px', marginTop: '8px', marginLeft: '24px' }}>
        {valueTypes.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => onValueTypeChange(type)}
            style={{
              padding: '5px 10px', borderRadius: '7px', border: 'none',
              background: item.valueType === type ? `${color}20` : '#EFEFEF',
              color: item.valueType === type ? color : '#8E8E93',
              fontSize: '11px', fontWeight: 800,
              cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
              letterSpacing: '0.3px', transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Static value input */}
      {item.valueType === 'static' && (
        <input
          style={{ ...itemInput, marginTop: '8px', marginLeft: '24px', color }}
          placeholder="値を入力 (例: Chromebook)"
          value={item.staticValue}
          onChange={(e) => onStaticValueChange(e.target.value)}
        />
      )}

      {/* Weekday value button */}
      {item.valueType === 'by-weekday' && (
        <button
          onClick={onOpenWeekdaySheet}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginTop: '8px', marginLeft: '24px',
            background: hasWeekdayValues ? `${color}12` : '#EFEFEF',
            border: `1.5px solid ${hasWeekdayValues ? `${color}40` : '#E5E5EA'}`,
            borderRadius: '9px', padding: '7px 12px',
            cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
            width: 'calc(100% - 24px)',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 800, color: hasWeekdayValues ? color : '#8E8E93', flex: 1, textAlign: 'left' }}>
            {hasWeekdayValues ? '曜日ごとの値を設定済み' : '曜日ごとの値を設定する…'}
          </span>
          <svg width="8" height="13" viewBox="0 0 8 13" fill="none">
            <path d="M1 1l6 5.5L1 12" stroke={hasWeekdayValues ? color : '#C7C7CC'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Helper components / styles
// ──────────────────────────────────────────────────────────────
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '22px' }}>
      <div style={{ fontSize: '11px', fontWeight: 800, color: '#8E8E93', letterSpacing: '0.8px', marginBottom: '8px', paddingLeft: '4px' }}>
        {label}
      </div>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '14px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {children}
      </div>
    </div>
  );
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return <p style={{ color: '#FF3B30', fontSize: '13px', fontWeight: 700, margin: '0 0 8px' }}>{children}</p>;
}

const navHeader: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '12px 16px',
  paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
  background: 'rgba(242,242,247,0.95)', backdropFilter: 'blur(20px)',
  borderBottom: '0.5px solid #E5E5EA', flexShrink: 0,
};
const cancelBtn: React.CSSProperties = {
  fontSize: '16px', fontWeight: 700, color: '#8E8E93',
  background: 'none', border: 'none', cursor: 'pointer',
  fontFamily: "'Nunito', sans-serif",
};
const textInput: React.CSSProperties = {
  width: '100%', border: 'none', outline: 'none',
  fontSize: '16px', color: '#1C1C1E', background: 'transparent',
  fontFamily: "'Nunito', sans-serif", fontWeight: 600,
  padding: 0, boxSizing: 'border-box',
};
const itemInput: React.CSSProperties = {
  display: 'block', width: '100%', border: 'none', outline: 'none',
  fontSize: '14px', color: '#1C1C1E', background: 'transparent',
  fontFamily: "'Nunito', sans-serif", padding: 0,
};
const moveBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const addItemBtn = (color: string): React.CSSProperties => ({
  display: 'block', width: '100%', marginTop: '14px',
  padding: '13px', border: `2px dashed ${color}50`,
  borderRadius: '12px', background: `${color}08`,
  fontSize: '15px', fontWeight: 800, color,
  cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
});
