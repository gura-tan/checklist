import { AnimatePresence, motion } from 'motion/react';
import { useState, useRef } from 'react';
import { WeekdayValues, EMPTY_WEEKDAY_VALUES } from '../../data/types';
import { DAY_NAMES_FULL } from '../../data/types';

interface Props {
  itemKey: string;
  values: WeekdayValues;
  color: string;
  onSave: (values: WeekdayValues) => void;
  onClose: () => void;
}

export default function WeekdayValueSheet({ itemKey, values, color, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<WeekdayValues>({ ...values });
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleSave();
    }
  };

  const DAY_SHORT = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 200,
          display: 'flex', alignItems: 'flex-end',
        }}
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          style={{
            width: '100%',
            background: '#F2F2F7',
            borderRadius: '22px 22px 0 0',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
            maxHeight: '90svh',
            display: 'flex', flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
            <div style={{ width: '40px', height: '4px', background: '#D1D1D6', borderRadius: '2px' }} />
          </div>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '4px 16px 14px',
            borderBottom: '0.5px solid #E5E5EA',
          }}>
            <button
              onClick={onClose}
              style={{
                fontSize: '16px', fontWeight: 600, color: '#8E8E93',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              キャンセル
            </button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#1C1C1E' }}>
                曜日ごとの値
              </div>
              <div style={{
                fontSize: '12px', color: color, fontWeight: 700,
                maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {itemKey}
              </div>
            </div>
            <button
              onClick={handleSave}
              style={{
                fontSize: '16px', fontWeight: 800, color: color,
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              完了
            </button>
          </div>

          {/* Day rows */}
          <div style={{ overflowY: 'auto', padding: '12px 16px' }}>
            <div style={{
              background: '#fff', borderRadius: '16px',
              overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              {([0, 1, 2, 3, 4, 5, 6] as (keyof WeekdayValues)[]).map((dow, idx) => (
                <div key={dow}>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    padding: '12px 14px', minHeight: '52px',
                  }}>
                    {/* Day badge */}
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '50%',
                      background: draft[dow] ? color : '#F2F2F7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginRight: '14px',
                      transition: 'background 0.2s',
                    }}>
                      <span style={{
                        fontSize: '13px', fontWeight: 900,
                        color: draft[dow] ? '#fff' : '#8E8E93',
                      }}>
                        {DAY_SHORT[dow]}
                      </span>
                    </div>

                    {/* Full name */}
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#1C1C1E', flexShrink: 0, width: '52px' }}>
                      {DAY_NAMES_FULL[dow]}
                    </span>

                    {/* Dots */}
                    <div style={{ flex: 1, borderBottom: '2px dotted #E5E5EA', margin: '0 10px', alignSelf: 'flex-end', marginBottom: '7px' }} />

                    {/* Value input */}
                    <input
                      ref={(el) => { inputRefs.current[idx] = el; }}
                      value={draft[dow]}
                      onChange={(e) => setDraft((prev) => ({ ...prev, [dow]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && idx < 6) {
                          inputRefs.current[idx + 1]?.focus();
                        }
                      }}
                      placeholder="未設定"
                      style={{
                        border: 'none', outline: 'none',
                        fontSize: '14px', fontWeight: 800,
                        color: draft[dow] ? color : '#C7C7CC',
                        background: 'transparent',
                        textAlign: 'right', width: '110px',
                        fontFamily: "'Nunito', sans-serif",
                      }}
                    />
                  </div>
                  {idx < 6 && <div style={{ height: '0.5px', background: '#F2F2F7', marginLeft: '62px' }} />}
                </div>
              ))}
            </div>

            {/* Helper text */}
            <p style={{ fontSize: '12px', color: '#8E8E93', marginTop: '12px', lineHeight: 1.6, textAlign: 'center' }}>
              未設定の曜日は空欄として扱われます
            </p>

            {/* Clear all */}
            <button
              onClick={() => setDraft({ ...EMPTY_WEEKDAY_VALUES })}
              style={{
                display: 'block', width: '100%', marginTop: '8px',
                padding: '12px', border: '1.5px dashed #E5E5EA',
                borderRadius: '12px', background: 'transparent',
                fontSize: '14px', fontWeight: 700, color: '#8E8E93',
                cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
              }}
            >
              すべてクリア
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
