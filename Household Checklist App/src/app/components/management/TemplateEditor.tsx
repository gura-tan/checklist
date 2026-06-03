import { useState } from 'react';
import { ChecklistTemplate, TemplateItem, ACCENT_COLORS, DAY_NAMES, ScheduleType } from '../../data/types';
import { uid } from '../../data/storage';

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
    items: [{ id: uid(), key: '', defaultValue: '', isVariable: false }],
    scheduleType: 'daily',
    scheduleDays: [],
    notificationTime: null,
    createdAt: now, updatedAt: now,
  };
}

export function TemplateEditor({ userId, template, onSave, onCancel }: Props) {
  const [form, setForm] = useState<ChecklistTemplate>(() =>
    template ? { ...template, items: template.items.map(i => ({ ...i })) } : blankTemplate(userId)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (patch: Partial<ChecklistTemplate>) => setForm(f => ({ ...f, ...patch }));

  const setItem = (idx: number, patch: Partial<TemplateItem>) => {
    setForm(f => ({
      ...f,
      items: f.items.map((it, i) => i === idx ? { ...it, ...patch } : it),
    }));
  };

  const addItem = () => {
    setForm(f => ({ ...f, items: [...f.items, { id: uid(), key: '', defaultValue: '', isVariable: false }] }));
  };

  const removeItem = (idx: number) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= form.items.length) return;
    setForm(f => {
      const items = [...f.items];
      [items[idx], items[newIdx]] = [items[newIdx], items[idx]];
      return { ...f, items };
    });
  };

  const toggleScheduleDay = (dow: number) => {
    const days = form.scheduleDays.includes(dow)
      ? form.scheduleDays.filter(d => d !== dow)
      : [...form.scheduleDays, dow].sort();
    set({ scheduleDays: days });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (form.items.every(i => !i.key.trim())) errs.items = 'Add at least one item';
    if (form.scheduleType === 'custom' && form.scheduleDays.length === 0) {
      errs.days = 'Select at least one day';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const cleaned = {
      ...form,
      title: form.title.trim(),
      items: form.items.filter(i => i.key.trim()),
      updatedAt: Date.now(),
    };
    onSave(cleaned);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F2F2F7' }}>
      {/* Nav header */}
      <div style={navHeader}>
        <button onClick={onCancel} style={cancelBtn}>Cancel</button>
        <span style={{ fontSize: '17px', fontWeight: 700, color: '#1C1C1E' }}>
          {template ? 'Edit Checklist' : 'New Checklist'}
        </span>
        <button onClick={handleSave} style={saveBtn}>Save</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px' }}>

        {/* Title */}
        <Section label="TITLE">
          {errors.title && <ErrorMsg>{errors.title}</ErrorMsg>}
          <input
            style={textInput}
            value={form.title}
            placeholder="Checklist name"
            onChange={e => set({ title: e.target.value })}
          />
        </Section>

        {/* Color */}
        <Section label="COLOR">
          <div style={{ display: 'flex', gap: '10px', padding: '8px 0', flexWrap: 'wrap' as const }}>
            {ACCENT_COLORS.map(c => (
              <button
                key={c}
                onClick={() => set({ color: c })}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: c, border: form.color === c ? `3px solid ${c}` : '3px solid transparent',
                  outline: form.color === c ? '2px solid #fff' : 'none',
                  outlineOffset: form.color === c ? '-5px' : '0',
                  cursor: 'pointer',
                  boxShadow: form.color === c ? `0 0 0 3px ${c}` : 'none',
                  transition: 'all 0.15s',
                }}
              />
            ))}
          </div>
        </Section>

        {/* Schedule */}
        <Section label="SCHEDULE">
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            {(['daily', 'weekdays', 'custom'] as ScheduleType[]).map(type => (
              <button
                key={type}
                onClick={() => set({ scheduleType: type })}
                style={{
                  flex: 1, padding: '9px 4px', borderRadius: '10px', border: 'none',
                  background: form.scheduleType === type ? form.color : '#F2F2F7',
                  color: form.scheduleType === type ? '#fff' : '#1C1C1E',
                  fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                  fontFamily: "'Nunito', sans-serif",
                  transition: 'all 0.15s',
                }}
              >
                {type === 'daily' ? 'Every Day' : type === 'weekdays' ? 'Weekdays' : 'Custom'}
              </button>
            ))}
          </div>
          {form.scheduleType === 'custom' && (
            <>
              {errors.days && <ErrorMsg>{errors.days}</ErrorMsg>}
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'space-between' }}>
                {DAY_NAMES.map((name, i) => {
                  const active = form.scheduleDays.includes(i);
                  return (
                    <button
                      key={i}
                      onClick={() => toggleScheduleDay(i)}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: '8px', border: 'none',
                        background: active ? form.color : '#F2F2F7',
                        color: active ? '#fff' : '#8E8E93',
                        fontSize: '12px', fontWeight: 700,
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
        </Section>

        {/* Notification time */}
        <Section label="NOTIFICATION TIME">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <div
                onClick={() => set({ notificationTime: form.notificationTime ? null : '08:00' })}
                style={{
                  width: '44px', height: '26px', borderRadius: '13px',
                  background: form.notificationTime ? form.color : '#D1D1D6',
                  position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                }}
              >
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: '2px',
                  left: form.notificationTime ? '20px' : '2px',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </div>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#1C1C1E' }}>
                {form.notificationTime ? 'On' : 'Off'}
              </span>
            </label>
            {form.notificationTime && (
              <input
                type="time"
                value={form.notificationTime}
                onChange={e => set({ notificationTime: e.target.value })}
                style={{ ...textInput, flex: 1, fontSize: '16px', fontWeight: 700, color: form.color }}
              />
            )}
          </div>
          {form.notificationTime && (
            <p style={{ fontSize: '12px', color: '#8E8E93', marginTop: '6px' }}>
              Push notifications require the app to be installed to your home screen.
            </p>
          )}
        </Section>

        {/* Items */}
        <Section label={`ITEMS  (${form.items.filter(i => i.key.trim()).length})`}>
          {errors.items && <ErrorMsg>{errors.items}</ErrorMsg>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {form.items.map((item, idx) => (
              <div key={item.id} style={itemRowStyle}>
                {/* Move buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
                  <button onClick={() => moveItem(idx, -1)} style={moveBtn} disabled={idx === 0}>
                    <svg width="12" height="8" viewBox="0 0 12 8"><path d="M1 7l5-5 5 5" stroke={idx === 0 ? '#D1D1D6' : '#8E8E93'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                  </button>
                  <button onClick={() => moveItem(idx, 1)} style={moveBtn} disabled={idx === form.items.length - 1}>
                    <svg width="12" height="8" viewBox="0 0 12 8"><path d="M1 1l5 5 5-5" stroke={idx === form.items.length - 1 ? '#D1D1D6' : '#8E8E93'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                  </button>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {/* Key row */}
                  <input
                    style={{ ...itemInput, fontWeight: 700 }}
                    placeholder="Item name (e.g. DEVICE TO BRING)"
                    value={item.key}
                    onChange={e => setItem(idx, { key: e.target.value })}
                  />
                  {/* Value row */}
                  {!item.isVariable && (
                    <input
                      style={itemInput}
                      placeholder="Value (e.g. CHROMEBOOK)"
                      value={item.defaultValue}
                      onChange={e => setItem(idx, { defaultValue: e.target.value })}
                    />
                  )}
                </div>

                {/* Variable toggle */}
                <button
                  onClick={() => setItem(idx, { isVariable: !item.isVariable, defaultValue: '' })}
                  title={item.isVariable ? 'Variable (no fixed value)' : 'Fixed value'}
                  style={{
                    padding: '4px 8px', borderRadius: '6px', border: 'none',
                    background: item.isVariable ? `${form.color}20` : '#F2F2F7',
                    color: item.isVariable ? form.color : '#8E8E93',
                    fontSize: '11px', fontWeight: 800,
                    cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
                    flexShrink: 0, letterSpacing: '0.5px',
                  }}
                >
                  {item.isVariable ? 'VAR' : 'FIX'}
                </button>

                {/* Delete */}
                <button
                  onClick={() => removeItem(idx)}
                  disabled={form.items.length === 1}
                  style={{ ...moveBtn, opacity: form.items.length === 1 ? 0.3 : 1 }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M1 1l10 10M11 1L1 11" stroke="#FF3B30" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Item hint */}
          <p style={{ fontSize: '12px', color: '#8E8E93', marginTop: '8px', lineHeight: 1.5 }}>
            <strong>FIX</strong> = constant value · <strong>VAR</strong> = filled in each time (variable)
          </p>

          <button onClick={addItem} style={addItemBtn(form.color)}>
            + Add Item
          </button>
        </Section>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontSize: '11px', fontWeight: 800, color: '#8E8E93', letterSpacing: '0.8px', marginBottom: '8px', paddingLeft: '4px' }}>
        {label}
      </div>
      <div style={{ background: '#fff', borderRadius: '14px', padding: '12px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {children}
      </div>
    </div>
  );
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return <p style={{ color: '#FF3B30', fontSize: '13px', fontWeight: 600, margin: '0 0 8px' }}>{children}</p>;
}

const navHeader: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '12px 16px',
  paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
  background: 'rgba(242,242,247,0.95)',
  backdropFilter: 'blur(20px)',
  borderBottom: '0.5px solid #E5E5EA',
};

const cancelBtn: React.CSSProperties = {
  fontSize: '16px', fontWeight: 600, color: '#8E8E93',
  background: 'none', border: 'none', cursor: 'pointer',
  fontFamily: "'Nunito', sans-serif",
};

const saveBtn: React.CSSProperties = {
  fontSize: '16px', fontWeight: 700, color: '#007AFF',
  background: 'none', border: 'none', cursor: 'pointer',
  fontFamily: "'Nunito', sans-serif",
};

const textInput: React.CSSProperties = {
  width: '100%', border: 'none', outline: 'none',
  fontSize: '16px', color: '#1C1C1E', background: 'transparent',
  fontFamily: "'Nunito', sans-serif", fontWeight: 600,
  padding: 0,
  boxSizing: 'border-box' as const,
};

const itemRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px',
  background: '#F9F9FB', borderRadius: '10px', padding: '10px 10px 10px 8px',
};

const itemInput: React.CSSProperties = {
  display: 'block', width: '100%', border: 'none', outline: 'none',
  fontSize: '14px', color: '#1C1C1E', background: 'transparent',
  fontFamily: "'Nunito', sans-serif",
  padding: 0,
};

const moveBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const addItemBtn = (color: string): React.CSSProperties => ({
  display: 'block', width: '100%', marginTop: '12px',
  padding: '12px', border: `2px dashed ${color}40`,
  borderRadius: '10px', background: `${color}08`,
  fontSize: '15px', fontWeight: 700, color,
  cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
});
