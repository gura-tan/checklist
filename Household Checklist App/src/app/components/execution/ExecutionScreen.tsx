import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, ChecklistTemplate, ChecklistOccurrence } from '../../data/types';
import { todayStr, offsetDate, formatDateLabel, formatDateFull } from '../../data/dateUtils';
import { ensureOccurrences, persistOccurrence } from '../../data/occurrenceUtils';
import { ChecklistDetailModal } from './ChecklistDetailModal';

interface Props {
  user: User;
  templates: ChecklistTemplate[];
}

export function ExecutionScreen({ user, templates }: Props) {
  const [currentDate, setCurrentDate] = useState(todayStr);
  const [occurrences, setOccurrences] = useState<ChecklistOccurrence[]>([]);
  const [openOcc, setOpenOcc] = useState<ChecklistOccurrence | null>(null);
  const touchStartX = useRef(0);
  const [slideDir, setSlideDir] = useState(0);

  const loadOccurrences = useCallback(() => {
    const occs = ensureOccurrences(templates, user.id, currentDate);
    setOccurrences(occs);
  }, [currentDate, templates, user.id]);

  useEffect(() => { loadOccurrences(); }, [loadOccurrences]);

  const navigate = (dir: number) => {
    setSlideDir(dir);
    setCurrentDate(d => offsetDate(d, dir));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 60) navigate(dx < 0 ? 1 : -1);
  };

  const handleOccurrenceUpdate = (updated: ChecklistOccurrence) => {
    persistOccurrence(updated);
    setOccurrences(prev => prev.map(o => o.id === updated.id ? updated : o));
    if (openOcc?.id === updated.id) setOpenOcc(updated);
  };

  const today = todayStr();
  const isToday = currentDate === today;
  const isFuture = currentDate > today;

  const incomplete = occurrences.filter(o => !o.completedAt);
  const complete = occurrences.filter(o => !!o.completedAt);

  return (
    <div
      style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F2F2F7' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div style={headerStyle}>
        <button onClick={() => navigate(-1)} style={navBtn}>
          <svg width="10" height="16" viewBox="0 0 10 16"><path d="M9 1L1 8l8 7" stroke="#007AFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
        </button>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '17px', fontWeight: 700, color: '#1C1C1E' }}>
            {formatDateLabel(currentDate)}
          </div>
          {!isToday && (
            <div style={{ fontSize: '12px', color: '#8E8E93', marginTop: '1px' }}>
              {formatDateFull(currentDate)}
            </div>
          )}
        </div>
        <button onClick={() => navigate(1)} style={navBtn}>
          <svg width="10" height="16" viewBox="0 0 10 16"><path d="M1 1l8 7-8 7" stroke="#007AFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
        </button>
      </div>

      {!isToday && (
        <button onClick={() => { setSlideDir(0); setCurrentDate(today); }} style={todayChip}>
          Back to Today
        </button>
      )}

      {isFuture && (
        <div style={presetBanner}>
          <span style={{ fontSize: '13px' }}>📝</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#FF9500' }}>
            Pre-setting values for a future checklist
          </span>
        </div>
      )}

      {/* Checklist list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 24px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentDate}
            initial={{ x: slideDir * 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: slideDir * -40, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {occurrences.length === 0 ? (
              <EmptyState date={currentDate} />
            ) : (
              <>
                {incomplete.map(occ => (
                  <ChecklistCard
                    key={occ.id}
                    occ={occ}
                    compact={false}
                    onOpen={() => setOpenOcc(occ)}
                  />
                ))}

                {complete.length > 0 && (
                  <>
                    {incomplete.length > 0 && (
                      <div style={sectionLabel}>COMPLETED</div>
                    )}
                    {complete.map(occ => (
                      <ChecklistCard
                        key={occ.id}
                        occ={occ}
                        compact={true}
                        onOpen={() => setOpenOcc(occ)}
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {openOcc && (
          <ChecklistDetailModal
            occ={openOcc}
            isFuture={isFuture}
            onUpdate={handleOccurrenceUpdate}
            onClose={() => setOpenOcc(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ChecklistCard({ occ, compact, onOpen }: { occ: ChecklistOccurrence; compact: boolean; onOpen: () => void }) {
  const checked = occ.items.filter(i => i.checked).length;
  const total = occ.items.length;

  if (compact) {
    return (
      <motion.button
        onClick={onOpen}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        style={compactCardStyle}
      >
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: occ.color, flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: '#8E8E93', textAlign: 'left' }}>{occ.title}</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" fill="#34C759" />
          <path d="M5 8l2 2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <svg width="8" height="14" viewBox="0 0 8 14" style={{ marginLeft: '4px' }}>
          <path d="M1 1l6 6-6 6" stroke="#C7C7CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </motion.button>
    );
  }

  const progress = total > 0 ? checked / total : 0;

  return (
    <motion.button
      onClick={onOpen}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={cardStyle}
    >
      {/* Color accent bar */}
      <div style={{ width: '4px', alignSelf: 'stretch', background: occ.color, borderRadius: '2px', flexShrink: 0 }} />
      <div style={{ flex: 1, padding: '4px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#1C1C1E' }}>{occ.title}</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#8E8E93' }}>{checked}/{total}</span>
        </div>
        {/* Progress bar */}
        <div style={{ height: '4px', background: '#F2F2F7', borderRadius: '2px', overflow: 'hidden', marginBottom: '10px' }}>
          <div style={{ height: '100%', width: `${progress * 100}%`, background: occ.color, borderRadius: '2px', transition: 'width 0.3s' }} />
        </div>
        {/* Item preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {occ.items.slice(0, 3).map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '3px', border: `1.5px solid ${item.checked ? '#34C759' : '#C7C7CC'}`, background: item.checked ? '#34C759' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {item.checked && <span style={{ color: '#fff', fontSize: '9px', fontWeight: 900, lineHeight: 1 }}>✓</span>}
              </div>
              <span style={{ fontSize: '12px', color: '#8E8E93', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.key}
                {item.value ? ` — ${item.value}` : ''}
              </span>
            </div>
          ))}
          {occ.items.length > 3 && (
            <span style={{ fontSize: '12px', color: '#C7C7CC', marginTop: '1px' }}>+{occ.items.length - 3} more items</span>
          )}
        </div>
      </div>
      <svg width="8" height="14" viewBox="0 0 8 14" style={{ alignSelf: 'center', marginLeft: '8px' }}>
        <path d="M1 1l6 6-6 6" stroke="#C7C7CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </motion.button>
  );
}

function EmptyState({ date }: { date: string }) {
  const today = todayStr();
  const msg = date < today
    ? 'No checklists were scheduled for this day.'
    : date === today
    ? 'No checklists scheduled for today.\nCreate one in the Manage tab.'
    : 'No checklists scheduled for this day.\nValues can be pre-set after creating templates.';

  return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
      <p style={{ fontSize: '15px', color: '#8E8E93', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{msg}</p>
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
  padding: '12px 8px 10px',
  paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
  background: 'rgba(242,242,247,0.95)',
  backdropFilter: 'blur(20px)',
  borderBottom: '0.5px solid #E5E5EA',
};

const navBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: '8px 16px', display: 'flex', alignItems: 'center',
};

const todayChip: React.CSSProperties = {
  margin: '8px auto 0', display: 'block',
  background: '#007AFF', color: '#fff',
  border: 'none', borderRadius: '20px',
  fontSize: '13px', fontWeight: 700, padding: '6px 16px',
  cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
};

const presetBanner: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px',
  background: 'rgba(255,149,0,0.1)',
  padding: '8px 16px',
  borderBottom: '0.5px solid rgba(255,149,0,0.2)',
};

const sectionLabel: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: '#8E8E93',
  letterSpacing: '0.5px', padding: '16px 4px 8px',
};

const cardStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'stretch', gap: '12px',
  background: '#fff', borderRadius: '14px',
  padding: '14px 14px 14px 12px',
  marginBottom: '10px', width: '100%',
  border: 'none', cursor: 'pointer',
  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
  textAlign: 'left', fontFamily: "'Nunito', sans-serif",
};

const compactCardStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '10px',
  background: '#fff', borderRadius: '12px',
  padding: '12px 14px', marginBottom: '8px', width: '100%',
  border: 'none', cursor: 'pointer',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  fontFamily: "'Nunito', sans-serif",
};
