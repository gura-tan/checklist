import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ChecklistOccurrence, OccurrenceItem } from '../../data/types';
import { formatDateFull } from '../../data/dateUtils';

interface Props {
  occ: ChecklistOccurrence;
  isFuture: boolean;
  onUpdate: (updated: ChecklistOccurrence) => void;
  onClose: () => void;
}

export function ChecklistDetailModal({ occ, isFuture, onUpdate, onClose }: Props) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const isAllChecked = occ.items.length > 0 && occ.items.every(i => i.checked);

  const toggleCheck = (itemId: string) => {
    const updated: ChecklistOccurrence = {
      ...occ,
      items: occ.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i),
    };
    const nowAllChecked = updated.items.every(i => i.checked);
    updated.completedAt = nowAllChecked ? Date.now() : null;
    onUpdate(updated);
  };

  const updateValue = (itemId: string, value: string) => {
    onUpdate({
      ...occ,
      items: occ.items.map(i => i.id === itemId ? { ...i, value } : i),
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={backdrop}
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        style={sheet}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
          <div style={{ width: '36px', height: '4px', background: '#D1D1D6', borderRadius: '2px' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '4px 16px 14px', borderBottom: '0.5px solid #E5E5EA' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: occ.color, flexShrink: 0, marginTop: '1px' }} />
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1C1C1E', margin: 0, lineHeight: 1.2 }}>
                  {occ.title}
                </h2>
              </div>
              <p style={{ fontSize: '13px', color: '#8E8E93', margin: 0, paddingLeft: '22px' }}>
                {formatDateFull(occ.date)}
                {isFuture && ' · Pre-setting values'}
              </p>
            </div>
            <button onClick={onClose} style={closeBtn}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Progress */}
          <div style={{ marginTop: '12px' }}>
            <div style={{ height: '4px', background: '#F2F2F7', borderRadius: '2px', overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${occ.items.length > 0 ? (occ.items.filter(i => i.checked).length / occ.items.length) * 100 : 0}%` }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                style={{ height: '100%', background: isAllChecked ? '#34C759' : occ.color, borderRadius: '2px' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '12px', color: '#8E8E93', fontWeight: 600 }}>
                {occ.items.filter(i => i.checked).length} of {occ.items.length} items checked
              </span>
              {!isFuture && !isAllChecked && (
                <span style={{ fontSize: '12px', color: '#8E8E93' }}>Tap row to check</span>
              )}
              {isFuture && (
                <span style={{ fontSize: '12px', color: '#FF9500', fontWeight: 600 }}>Tap value to pre-set</span>
              )}
            </div>
          </div>
        </div>

        {/* Column headers */}
        <div style={colHeaders}>
          <div style={{ width: '34px' }} />
          <span style={colLabel}>ITEM</span>
          <span style={{ ...colLabel, marginLeft: 'auto' }}>VALUE</span>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {occ.items.map((item, idx) => (
            <ChecklistRow
              key={item.id}
              item={item}
              isEditing={editingItemId === item.id}
              isFuture={isFuture}
              onToggle={() => { if (!isFuture) toggleCheck(item.id); }}
              onValueChange={(v) => updateValue(item.id, v)}
              onEditStart={() => setEditingItemId(item.id)}
              onEditEnd={() => setEditingItemId(null)}
              isLast={idx === occ.items.length - 1}
            />
          ))}

          {/* Completed banner */}
          {isAllChecked && !isFuture && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
              style={completedBanner}
            >
              <div style={completedIcon}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="14" fill="#34C759" />
                  <path d="M8 14l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#1C7A41', letterSpacing: '0.3px' }}>
                CHECKLIST COMPLETED
              </div>
              <div style={{ fontSize: '13px', color: '#34C759', marginTop: '2px', fontWeight: 600 }}>
                All {occ.items.length} items verified ·{' '}
                {new Date(occ.completedAt!).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </motion.div>
          )}

          <div style={{ height: '32px' }} />
        </div>
      </motion.div>
    </motion.div>
  );
}

interface RowProps {
  item: OccurrenceItem;
  isEditing: boolean;
  isFuture: boolean;
  onToggle: () => void;
  onValueChange: (v: string) => void;
  onEditStart: () => void;
  onEditEnd: () => void;
  isLast: boolean;
}

function ChecklistRow({ item, isEditing, isFuture, onToggle, onValueChange, onEditStart, onEditEnd, isLast }: RowProps) {
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
  const valueColor = isChecked ? '#34C759' : item.value ? '#007AFF' : '#C7C7CC';
  const dotsColor = isChecked ? 'rgba(52,199,89,0.3)' : '#E5E5EA';

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '0 16px',
      borderBottom: isLast ? 'none' : '0.5px solid #F2F2F7',
      background: isChecked ? 'rgba(52,199,89,0.04)' : '#fff',
      transition: 'background 0.2s',
      minHeight: '52px',
    }}>
      {/* Checkbox — only interactive when not future */}
      <button
        onClick={onToggle}
        style={{
          width: '26px', height: '26px', borderRadius: '7px',
          border: `2px solid ${isChecked ? '#34C759' : '#C7C7CC'}`,
          background: isChecked ? '#34C759' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, cursor: isFuture ? 'default' : 'pointer',
          transition: 'all 0.18s', marginRight: '12px',
          opacity: isFuture ? 0.4 : 1,
        }}
      >
        {isChecked && (
          <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
            <path d="M1.5 5l3 3.5L11.5 1" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Key */}
      <span style={{
        fontSize: '14px', fontWeight: 700, color: textColor,
        whiteSpace: 'nowrap', letterSpacing: '0.3px',
        transition: 'color 0.2s', flexShrink: 0,
        maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {item.key}
      </span>

      {/* Leader dots */}
      <div style={{ flex: 1, margin: '0 8px', borderBottom: `2px dotted ${dotsColor}`, minWidth: '12px', alignSelf: 'flex-end', marginBottom: '12px', transition: 'border-color 0.2s' }} />

      {/* Value */}
      {isEditing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') { setDraft(item.value); onEditEnd(); } }}
          style={{
            border: 'none', outline: 'none',
            fontSize: '14px', fontWeight: 700, color: '#007AFF',
            background: 'rgba(0,122,255,0.08)',
            borderRadius: '6px', padding: '3px 8px',
            fontFamily: "'Nunito', sans-serif",
            textAlign: 'right',
            width: '120px', maxWidth: '38vw',
          }}
          placeholder="Enter value…"
        />
      ) : (
        <button
          onClick={handleValueTap}
          style={{
            border: 'none', background: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: 700,
            color: valueColor, padding: '4px 0',
            fontFamily: "'Nunito', sans-serif",
            textAlign: 'right', maxWidth: '38vw',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            transition: 'color 0.2s',
          }}
        >
          {item.value || (isFuture ? 'Tap to set' : 'Tap to set')}
        </button>
      )}
    </div>
  );
}

const backdrop: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.4)',
  zIndex: 100,
  display: 'flex', alignItems: 'flex-end',
};

const sheet: React.CSSProperties = {
  width: '100%',
  maxHeight: '92svh',
  background: '#fff',
  borderRadius: '20px 20px 0 0',
  display: 'flex', flexDirection: 'column',
  paddingBottom: 'env(safe-area-inset-bottom, 0px)',
};

const closeBtn: React.CSSProperties = {
  width: '30px', height: '30px', borderRadius: '50%',
  background: '#F2F2F7', border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0, marginTop: '2px',
};

const colHeaders: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
  padding: '8px 16px 6px',
  borderBottom: '0.5px solid #F2F2F7',
};

const colLabel: React.CSSProperties = {
  fontSize: '10px', fontWeight: 800, color: '#C7C7CC', letterSpacing: '1px',
};

const completedBanner: React.CSSProperties = {
  margin: '20px 16px',
  padding: '20px',
  background: 'rgba(52,199,89,0.08)',
  border: '1.5px solid rgba(52,199,89,0.4)',
  borderRadius: '16px',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', textAlign: 'center', gap: '4px',
};

const completedIcon: React.CSSProperties = {
  marginBottom: '8px',
};
