import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { User, ChecklistTemplate, ChecklistOccurrence } from '../../data/types';
import { todayStr, offsetDate, formatDateLabel, formatDateFull } from '../../data/dateUtils';
import { ensureOccurrences, persistOccurrence } from '../../data/occurrenceUtils';
import ChecklistDetail from './ChecklistDetail';

interface Props {
  user: User;
  templates: ChecklistTemplate[];
  onDetailOpenChange: (open: boolean) => void;
}

export default function ExecutionScreen({ user, templates, onDetailOpenChange }: Props) {
  const [currentDate, setCurrentDate] = useState(todayStr);
  const [occurrences, setOccurrences] = useState<ChecklistOccurrence[]>([]);
  const [openOcc, setOpenOcc] = useState<{ occ: ChecklistOccurrence; template: ChecklistTemplate } | null>(null);
  const [slideDir, setSlideDir] = useState(0);
  const touchStartX = useRef(0);

  const loadOccurrences = useCallback(() => {
    const occs = ensureOccurrences(templates, user.id, currentDate);
    setOccurrences(occs);
  }, [currentDate, templates, user.id]);

  useEffect(() => { loadOccurrences(); }, [loadOccurrences]);

  const navigate = (dir: number) => {
    setSlideDir(dir);
    setCurrentDate((d) => offsetDate(d, dir));
  };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 60) navigate(dx < 0 ? 1 : -1);
  };

  const handleOccurrenceUpdate = (updated: ChecklistOccurrence) => {
    persistOccurrence(updated);
    setOccurrences((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  };

  const handleOpenDetail = (occ: ChecklistOccurrence) => {
    const tmpl = templates.find((t) => t.id === occ.templateId);
    if (!tmpl) return;
    setOpenOcc({ occ, template: tmpl });
    onDetailOpenChange(true);
  };

  const handleCloseDetail = (updatedOcc?: ChecklistOccurrence) => {
    if (updatedOcc) handleOccurrenceUpdate(updatedOcc);
    setOpenOcc(null);
    onDetailOpenChange(false);
    loadOccurrences();
  };

  const today = todayStr();
  const isToday = currentDate === today;
  const isFuture = currentDate > today;
  const incomplete = occurrences.filter((o) => !o.completedAt);
  const complete = occurrences.filter((o) => !!o.completedAt);

  return (
    <>
      <div
        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F2F2F7' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div style={headerStyle}>
          <button onClick={() => navigate(-1)} style={navBtn}>
            <svg width="10" height="17" viewBox="0 0 10 17"><path d="M8.5 1.5L1.5 8.5l7 7" stroke="#007AFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
          </button>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#1C1C1E' }}>
              {formatDateLabel(currentDate)}
            </div>
            {!isToday && (
              <div style={{ fontSize: '12px', color: '#8E8E93', marginTop: '1px' }}>
                {formatDateFull(currentDate)}
              </div>
            )}
          </div>
          <button onClick={() => navigate(1)} style={navBtn}>
            <svg width="10" height="17" viewBox="0 0 10 17"><path d="M1.5 1.5l7 7-7 7" stroke="#007AFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
          </button>
        </div>

        {/* Back to today */}
        {!isToday && (
          <button onClick={() => { setSlideDir(0); setCurrentDate(today); }} style={todayChip}>
            今日に戻る
          </button>
        )}

        {/* Future pre-set banner */}
        {isFuture && (
          <div style={presetBanner}>
            <span>📝</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#FF9500' }}>
              事前の値を設定・修正できます
            </span>
          </div>
        )}

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 32px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentDate}
              initial={{ x: slideDir * 44, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: slideDir * -44, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {occurrences.length === 0 ? (
                <EmptyState date={currentDate} />
              ) : (
                <>
                  {incomplete.map((occ) => (
                    <ChecklistCard key={occ.id} occ={occ} compact={false} onOpen={() => handleOpenDetail(occ)} />
                  ))}
                  {complete.length > 0 && (
                    <>
                      {incomplete.length > 0 && (
                        <div style={sectionLabel}>完了済み</div>
                      )}
                      {complete.map((occ) => (
                        <ChecklistCard key={occ.id} occ={occ} compact={true} onOpen={() => handleOpenDetail(occ)} />
                      ))}
                    </>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Full-screen detail */}
      <AnimatePresence>
        {openOcc && (
          <ChecklistDetail
            key={openOcc.occ.id}
            initialOcc={openOcc.occ}
            template={openOcc.template}
            userId={user.id}
            onClose={handleCloseDetail}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function ChecklistCard({ occ, compact, onOpen }: { occ: ChecklistOccurrence; compact: boolean; onOpen: () => void }) {
  const checked = occ.items.filter((i) => i.checked).length;
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
        <span style={{ flex: 1, fontSize: '15px', fontWeight: 700, color: '#8E8E93', textAlign: 'left' }}>{occ.title}</span>
        <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
          <circle cx="8.5" cy="8.5" r="8" fill="#34C759" />
          <path d="M5 8.5l2.5 2.5 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <svg width="8" height="14" viewBox="0 0 8 14" style={{ marginLeft: '4px' }}><path d="M1 1l6 6-6 6" stroke="#C7C7CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
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
      <div style={{ width: '4px', alignSelf: 'stretch', background: occ.color, borderRadius: '2px', flexShrink: 0 }} />
      <div style={{ flex: 1, padding: '2px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
          <span style={{ fontSize: '16px', fontWeight: 800, color: '#1C1C1E' }}>{occ.title}</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#8E8E93' }}>{checked}/{total}</span>
        </div>
        {/* Progress bar */}
        <div style={{ height: '4px', background: '#F2F2F7', borderRadius: '2px', overflow: 'hidden', marginBottom: '10px' }}>
          <div style={{ height: '100%', width: `${progress * 100}%`, background: occ.color, borderRadius: '2px', transition: 'width 0.3s' }} />
        </div>
        {/* Item preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {occ.items.slice(0, 3).map((item) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '13px', height: '13px', borderRadius: '3px', flexShrink: 0,
                border: `1.5px solid ${item.checked ? '#34C759' : '#D1D1D6'}`,
                background: item.checked ? '#34C759' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.checked && <span style={{ color: '#fff', fontSize: '8px', fontWeight: 900, lineHeight: 1 }}>✓</span>}
              </div>
              <span style={{ fontSize: '12px', color: '#8E8E93', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.key}{item.value ? ` — ${item.value}` : ''}
              </span>
            </div>
          ))}
          {occ.items.length > 3 && (
            <span style={{ fontSize: '12px', color: '#C7C7CC', marginTop: '1px' }}>+{occ.items.length - 3} 項目</span>
          )}
        </div>
      </div>
      <svg width="8" height="14" viewBox="0 0 8 14" style={{ alignSelf: 'center', marginLeft: '8px' }}><path d="M1 1l6 6-6 6" stroke="#C7C7CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
    </motion.button>
  );
}

function EmptyState({ date }: { date: string }) {
  const today = todayStr();
  const msg =
    date < today ? 'この日のチェックリストはありませんでした。'
    : date === today ? '今日のチェックリストはありません。\n「管理」タブからテンプレートを作成してください。'
    : 'この日のチェックリストはありません。\nテンプレートを作成すると事前に値を設定できます。';
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ fontSize: '52px', marginBottom: '16px' }}>📋</div>
      <p style={{ fontSize: '15px', color: '#8E8E93', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{msg}</p>
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
  padding: '12px 8px 10px',
  paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
  background: 'rgba(242,242,247,0.95)', backdropFilter: 'blur(20px)',
  borderBottom: '0.5px solid #E5E5EA', flexShrink: 0,
};
const navBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: '8px 16px', display: 'flex', alignItems: 'center',
};
const todayChip: React.CSSProperties = {
  margin: '8px auto 0', display: 'block',
  background: '#007AFF', color: '#fff', border: 'none',
  borderRadius: '20px', fontSize: '13px', fontWeight: 700,
  padding: '6px 18px', cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
};
const presetBanner: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px',
  background: 'rgba(255,149,0,0.1)', padding: '8px 16px',
  borderBottom: '0.5px solid rgba(255,149,0,0.2)',
};
const sectionLabel: React.CSSProperties = {
  fontSize: '11px', fontWeight: 800, color: '#8E8E93',
  letterSpacing: '0.5px', padding: '16px 4px 8px',
};
const cardStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'stretch', gap: '12px',
  background: '#fff', borderRadius: '16px',
  padding: '14px 14px 14px 12px', marginBottom: '10px',
  width: '100%', border: 'none', cursor: 'pointer',
  boxShadow: '0 1px 6px rgba(0,0,0,0.07)', textAlign: 'left',
  fontFamily: "'Nunito', sans-serif",
};
const compactCardStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '10px',
  background: '#fff', borderRadius: '12px',
  padding: '12px 14px', marginBottom: '8px', width: '100%',
  border: 'none', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  fontFamily: "'Nunito', sans-serif",
};
