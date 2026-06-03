import { useState, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChecklistOccurrence, ChecklistTemplate, OccurrenceItem } from '../../data/types';
import { todayStr, formatDateFull, formatDateLabel } from '../../data/dateUtils';
import {
  persistOccurrence, getOrCreateOccurrence,
  nextScheduledDate, prevScheduledDate,
} from '../../data/occurrenceUtils';

interface Props {
  initialOcc: ChecklistOccurrence;
  template: ChecklistTemplate;
  userId: string;
  onClose: (updated?: ChecklistOccurrence) => void;
}

export default function ChecklistDetail({ initialOcc, template, userId, onClose }: Props) {
  const [occ, setOcc] = useState(initialOcc);
  const [slideDir, setSlideDir] = useState(0);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const touchStartX = useRef(0);

  const today = todayStr();
  const isToday = occ.date === today;
  const isPast = occ.date < today;
  const isFuture = occ.date > today;
  const isAllChecked = occ.items.length > 0 && occ.items.every((i) => i.checked);

  const navigateDate = useCallback((dir: 1 | -1) => {
    setEditingItemId(null);
    const targetDate = dir === 1
      ? nextScheduledDate(template, occ.date)
      : prevScheduledDate(template, occ.date);

    // Persist current before navigating
    persistOccurrence(occ);

    const nextOcc = getOrCreateOccurrence(template, userId, targetDate);
    setSlideDir(dir);
    setOcc(nextOcc);
  }, [occ, template, userId]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 60) navigateDate(dx < 0 ? 1 : -1);
  };

  const toggleCheck = (itemId: string) => {
    // Can only check/uncheck on current day
    if (!isToday) return;
    const updated: ChecklistOccurrence = {
      ...occ,
      items: occ.items.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)),
    };
    const nowAllChecked = updated.items.every((i) => i.checked);
    updated.completedAt = nowAllChecked ? Date.now() : null;
    persistOccurrence(updated);
    setOcc(updated);
  };

  const updateValue = (itemId: string, value: string) => {
    const updated: ChecklistOccurrence = {
      ...occ,
      items: occ.items.map((i) => (i.id === itemId ? { ...i, value } : i)),
    };
    persistOccurrence(updated);
    setOcc(updated);
  };

  const handleClose = () => {
    persistOccurrence(occ);
    onClose(occ);
  };

  const checkedCount = occ.items.filter((i) => i.checked).length;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 320 }}
      style={{
        position: 'absolute', inset: 0,
        background: '#F2F2F7', display: 'flex', flexDirection: 'column',
        zIndex: 50,
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '12px 12px 10px',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        background: 'rgba(242,242,247,0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid #E5E5EA', flexShrink: 0,
      }}>
        {/* Back */}
        <button onClick={handleClose} style={iconBtnStyle}>
          <svg width="10" height="17" viewBox="0 0 10 17"><path d="M8.5 1.5L1.5 8.5l7 7" stroke="#007AFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
        </button>

        {/* Date navigation */}
        <button onClick={() => navigateDate(-1)} style={navDateBtn}>
          <svg width="8" height="13" viewBox="0 0 8 13"><path d="M7 1L1 6.5 7 12" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#1C1C1E', lineHeight: 1.2 }}>
            {formatDateLabel(occ.date)}
          </div>
          <div style={{ fontSize: '11px', color: '#8E8E93', marginTop: '1px' }}>
            {formatDateFull(occ.date)}
          </div>
        </div>
        <button onClick={() => navigateDate(1)} style={navDateBtn}>
          <svg width="8" height="13" viewBox="0 0 8 13"><path d="M1 1l6 5.5L1 12" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
        </button>
      </div>

      {/* Mode banner */}
      {isFuture && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,149,0,0.1)', padding: '8px 16px', borderBottom: '0.5px solid rgba(255,149,0,0.2)' }}>
          <span>📝</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#FF9500' }}>事前設定モード — 値を編集できます</span>
        </div>
      )}
      {isPast && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(142,142,147,0.1)', padding: '8px 16px', borderBottom: '0.5px solid rgba(142,142,147,0.2)' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#8E8E93' }}>📂 過去のチェックリスト</span>
        </div>
      )}

      {/* Title + Progress */}
      <AnimatePresence mode="wait">
        <motion.div
          key={occ.date}
          initial={{ x: slideDir * 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: slideDir * -40, opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          {/* Title block */}
          <div style={{ padding: '16px 16px 0', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: occ.color, flexShrink: 0 }} />
              <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#1C1C1E', margin: 0, flex: 1 }}>
                {occ.title}
              </h1>
              {!isPast && !isFuture && (
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#8E8E93' }}>
                  {checkedCount}/{occ.items.length}
                </span>
              )}
            </div>
            {/* Progress bar */}
            {isToday && (
              <div style={{ height: '5px', background: '#E5E5EA', borderRadius: '3px', overflow: 'hidden', marginBottom: '4px' }}>
                <motion.div
                  animate={{ width: `${occ.items.length > 0 ? (checkedCount / occ.items.length) * 100 : 0}%` }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  style={{ height: '100%', background: isAllChecked ? '#34C759' : occ.color, borderRadius: '3px' }}
                />
              </div>
            )}
          </div>

          {/* Column header */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '6px 16px', borderBottom: '0.5px solid #E5E5EA', flexShrink: 0 }}>
            {isToday && <div style={{ width: '34px', flexShrink: 0 }} />}
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#C7C7CC', letterSpacing: '1px' }}>項目</span>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#C7C7CC', letterSpacing: '1px', marginLeft: 'auto' }}>値</span>
          </div>

          {/* Items */}
          <div style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
            {occ.items.map((item, idx) => (
              <ChecklistRow
                key={item.id}
                item={item}
                isEditing={editingItemId === item.id}
                canCheck={isToday}
                onToggle={() => toggleCheck(item.id)}
                onValueChange={(v) => updateValue(item.id, v)}
                onEditStart={() => setEditingItemId(item.id)}
                onEditEnd={() => setEditingItemId(null)}
                isLast={idx === occ.items.length - 1}
                color={occ.color}
              />
            ))}

            {/* CHECKLIST COMPLETED */}
            {isAllChecked && isToday && (
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 280 }}
                style={{
                  margin: '20px 16px',
                  padding: '22px',
                  background: 'rgba(52,199,89,0.08)',
                  border: '1.5px solid rgba(52,199,89,0.35)',
                  borderRadius: '18px',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', textAlign: 'center', gap: '6px',
                }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 12 }}
                >
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <circle cx="18" cy="18" r="18" fill="#34C759" />
                    <path d="M10 18l5.5 5.5L26 12" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#1C7A41', letterSpacing: '0.5px' }}>
                  CHECKLIST COMPLETED
                </div>
                <div style={{ fontSize: '13px', color: '#34C759', fontWeight: 700 }}>
                  全{occ.items.length}項目を確認しました
                  {occ.completedAt ? ` · ${new Date(occ.completedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}` : ''}
                </div>
              </motion.div>
            )}

            <div style={{ height: '40px' }} />
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

interface RowProps {
  item: OccurrenceItem;
  isEditing: boolean;
  canCheck: boolean;
  onToggle: () => void;
  onValueChange: (v: string) => void;
  onEditStart: () => void;
  onEditEnd: () => void;
  isLast: boolean;
  color: string;
}

function ChecklistRow({ item, isEditing, canCheck, onToggle, onValueChange, onEditStart, onEditEnd, isLast, color }: RowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(item.value);

  const commitEdit = () => {
    onValueChange(draft.trim());
    onEditEnd();
  };

  const handleValueTap = () => {
    setDraft(item.value);
    onEditStart();
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const isChecked = item.checked;
  const textColor = isChecked ? '#34C759' : '#1C1C1E';
  const valueColor = isChecked ? '#34C759' : item.value ? color : '#C7C7CC';
  const dotsColor = isChecked ? 'rgba(52,199,89,0.25)' : '#E5E5EA';

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '0 16px',
      borderBottom: isLast ? 'none' : '0.5px solid #F2F2F7',
      background: isChecked ? 'rgba(52,199,89,0.04)' : '#fff',
      transition: 'background 0.2s', minHeight: '54px',
    }}>
      {/* Checkbox */}
      {canCheck && (
        <button
          onClick={onToggle}
          style={{
            width: '26px', height: '26px', borderRadius: '7px',
            border: `2px solid ${isChecked ? '#34C759' : '#C7C7CC'}`,
            background: isChecked ? '#34C759' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, cursor: 'pointer',
            transition: 'all 0.18s', marginRight: '12px',
          }}
        >
          {isChecked && (
            <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
              <path d="M1.5 5l3 3.5L11.5 1" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      )}

      {/* Key */}
      <span style={{
        fontSize: '14px', fontWeight: 800, color: textColor,
        whiteSpace: 'nowrap', letterSpacing: '0.2px',
        transition: 'color 0.2s', flexShrink: 0,
        maxWidth: '44vw', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {item.key}
      </span>

      {/* Leader dots */}
      <div style={{
        flex: 1, margin: '0 8px',
        borderBottom: `2px dotted ${dotsColor}`,
        minWidth: '12px', alignSelf: 'flex-end',
        marginBottom: '13px', transition: 'border-color 0.2s',
      }} />

      {/* Value */}
      {isEditing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') { setDraft(item.value); onEditEnd(); }
          }}
          style={{
            border: 'none', outline: 'none',
            fontSize: '14px', fontWeight: 800, color,
            background: `${color}15`,
            borderRadius: '7px', padding: '4px 8px',
            fontFamily: "'Nunito', sans-serif",
            textAlign: 'right', width: '110px', maxWidth: '38vw',
          }}
          placeholder="値を入力…"
        />
      ) : (
        <button
          onClick={handleValueTap}
          style={{
            border: 'none', background: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: 800,
            color: valueColor, padding: '4px 0',
            fontFamily: "'Nunito', sans-serif",
            textAlign: 'right', maxWidth: '38vw',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            transition: 'color 0.2s',
          }}
        >
          {item.value || '…'}
        </button>
      )}
    </div>
  );
}

// Utility styles used above
const iconBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: '8px 12px', display: 'flex', alignItems: 'center', flexShrink: 0,
};
const navDateBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: '8px 10px', display: 'flex', alignItems: 'center', flexShrink: 0,
};
