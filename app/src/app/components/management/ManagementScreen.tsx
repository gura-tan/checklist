import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { User, ChecklistTemplate } from '../../data/types';
import { storage } from '../../data/storage';
import { removeFutureOccurrences, scheduleLabel } from '../../data/occurrenceUtils';
import { todayStr } from '../../data/dateUtils';
import TemplateEditor from './TemplateEditor';

interface Props {
  user: User;
  templates: ChecklistTemplate[];
  onTemplatesChange: () => void;
  onLogout: () => void;
}

export default function ManagementScreen({ user, templates, onTemplatesChange, onLogout }: Props) {
  const [editing, setEditing] = useState<ChecklistTemplate | null | 'new'>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    removeFutureOccurrences(id, todayStr());
    storage.saveTemplates(storage.getTemplates().filter((t) => t.id !== id));
    onTemplatesChange();
    setConfirmDelete(null);
  };

  const handleSave = (tmpl: ChecklistTemplate) => {
    const all = storage.getTemplates();
    const idx = all.findIndex((t) => t.id === tmpl.id);
    if (idx >= 0) all[idx] = tmpl;
    else all.push(tmpl);
    storage.saveTemplates(all);
    onTemplatesChange();
    setEditing(null);
  };

  if (editing !== null) {
    return (
      <TemplateEditor
        userId={user.id}
        template={editing === 'new' ? null : editing}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F2F2F7' }}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#1C1C1E' }}>チェックリスト管理</div>
          <div style={{ fontSize: '13px', color: '#8E8E93', marginTop: '1px' }}>
            {user.displayName} でログイン中
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={onLogout} style={{ fontSize: '14px', fontWeight: 700, color: '#FF3B30', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>
            ログアウト
          </button>
          <button onClick={() => setEditing('new')} style={addBtn}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1v14M1 8h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 32px' }}>
        {templates.length === 0 ? (
          <EmptyManage onNew={() => setEditing('new')} />
        ) : (
          <AnimatePresence>
            {templates.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={templateCard}
              >
                {/* Icon */}
                <div style={{
                  width: '46px', height: '46px', borderRadius: '13px',
                  background: t.color, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect x="3" y="3" width="16" height="16" rx="3" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" />
                    <path d="M6 8h10M6 11h10M6 14h6" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#1C1C1E', marginBottom: '4px' }}>
                    {t.title}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <Chip color={t.color}>{scheduleLabel(t)}</Chip>
                    <Chip color="#8E8E93">{t.items.length} 項目</Chip>
                    {t.notificationTime && <Chip color="#8E8E93">🔔 {t.notificationTime}</Chip>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button onClick={() => setEditing(t)} style={iconBtn('#007AFF', 'rgba(0,122,255,0.1)')}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M9 2l3 3-8 8H1v-3L9 2z" stroke="#007AFF" strokeWidth="1.6" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button onClick={() => setConfirmDelete(t.id)} style={iconBtn('#FF3B30', 'rgba(255,59,48,0.1)')}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 4h10M5 4V2h4v2M6 6v5M8 6v5" stroke="#FF3B30" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M3 4l1 8h6l1-8" stroke="#FF3B30" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Delete confirm sheet */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{
                width: '100%', background: '#fff', borderRadius: '22px 22px 0 0',
                padding: '20px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#1C1C1E', textAlign: 'center', marginBottom: '8px' }}>
                チェックリストを削除しますか？
              </h3>
              <p style={{ fontSize: '14px', color: '#8E8E93', textAlign: 'center', marginBottom: '20px', lineHeight: 1.6 }}>
                テンプレートと今後の予定が削除されます。過去の履歴は残ります。
              </p>
              <button onClick={() => handleDelete(confirmDelete)} style={{ ...actionBtn, background: '#FF3B30', marginBottom: '10px' }}>
                削除する
              </button>
              <button onClick={() => setConfirmDelete(null)} style={{ ...actionBtn, background: '#F2F2F7', color: '#1C1C1E' }}>
                キャンセル
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Chip({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      fontSize: '11px', fontWeight: 700, color,
      background: color === '#8E8E93' ? '#F2F2F7' : `${color}18`,
      padding: '2px 8px', borderRadius: '20px',
    }}>
      {children}
    </span>
  );
}

function EmptyManage({ onNew }: { onNew: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ fontSize: '52px', marginBottom: '16px' }}>✏️</div>
      <p style={{ fontSize: '15px', color: '#8E8E93', lineHeight: 1.6, marginBottom: '28px' }}>
        チェックリストがまだありません。<br />最初のテンプレートを作成してください。
      </p>
      <button onClick={onNew} style={{
        background: '#007AFF', color: '#fff', border: 'none',
        borderRadius: '14px', padding: '13px 32px',
        fontSize: '16px', fontWeight: 800, cursor: 'pointer',
        fontFamily: "'Nunito', sans-serif",
        boxShadow: '0 4px 14px rgba(0,122,255,0.35)',
      }}>
        チェックリストを作成
      </button>
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '16px', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
  background: 'rgba(242,242,247,0.95)', backdropFilter: 'blur(20px)',
  borderBottom: '0.5px solid #E5E5EA', flexShrink: 0,
};
const addBtn: React.CSSProperties = {
  width: '36px', height: '36px', borderRadius: '50%',
  background: '#007AFF', border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 2px 10px rgba(0,122,255,0.4)',
};
const templateCard: React.CSSProperties = {
  background: '#fff', borderRadius: '16px',
  padding: '14px', marginBottom: '10px',
  display: 'flex', alignItems: 'center', gap: '12px',
  boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
};
const iconBtn = (color: string, bg: string): React.CSSProperties => ({
  width: '34px', height: '34px', borderRadius: '9px',
  background: bg, border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
});
const actionBtn: React.CSSProperties = {
  display: 'block', width: '100%', padding: '15px',
  border: 'none', borderRadius: '14px',
  fontSize: '16px', fontWeight: 800, color: '#fff',
  cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
};
