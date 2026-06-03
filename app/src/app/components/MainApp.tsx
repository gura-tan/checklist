import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { User, ChecklistTemplate } from '../data/types';
import { storage } from '../data/storage';
import { scheduleNotifications } from '../data/notificationService';
import ExecutionScreen from './execution/ExecutionScreen';
import ManagementScreen from './management/ManagementScreen';

interface Props { user: User; onLogout: () => void; }

export default function MainApp({ user, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>(() => storage.getTemplates());
  const [detailOpen, setDetailOpen] = useState(false); // hides tab bar when detail screen is open

  const refreshTemplates = useCallback(() => {
    const t = storage.getTemplates();
    setTemplates(t);
    scheduleNotifications(t, user.id);
  }, [user.id]);

  const userTemplates = templates.filter((t) => t.userId === user.id);

  // Schedule notifications on load
  useEffect(() => {
    scheduleNotifications(userTemplates, user.id);
  }, []); // eslint-disable-line

  return (
    <div style={{
      height: '100svh', display: 'flex', flexDirection: 'column',
      background: '#F2F2F7', fontFamily: "'Nunito', sans-serif",
      overflow: 'hidden',
    }}>
      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, display: activeTab === 0 ? 'flex' : 'none', flexDirection: 'column' }}>
          <ExecutionScreen
            user={user}
            templates={userTemplates}
            onDetailOpenChange={setDetailOpen}
          />
        </div>
        <div style={{ position: 'absolute', inset: 0, display: activeTab === 1 ? 'flex' : 'none', flexDirection: 'column' }}>
          <ManagementScreen
            user={user}
            templates={userTemplates}
            onTemplatesChange={refreshTemplates}
            onLogout={onLogout}
          />
        </div>
      </div>

      {/* Bottom tab bar — hidden when detail is open */}
      <AnimatePresence>
        {!detailOpen && (
          <motion.div
            key="tabbar"
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            style={{
              display: 'flex',
              background: 'rgba(255,255,255,0.94)',
              backdropFilter: 'blur(20px)',
              borderTop: '0.5px solid #C6C6C8',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              flexShrink: 0,
            }}
          >
            <TabButton label="チェック" active={activeTab === 0} onClick={() => setActiveTab(0)}>
              <ChecklistIcon active={activeTab === 0} />
            </TabButton>
            <TabButton label="管理" active={activeTab === 1} onClick={() => setActiveTab(1)}>
              <ManageIcon active={activeTab === 1} />
            </TabButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({ label, active, onClick, children }: {
  label: string; active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: '3px', border: 'none', background: 'none',
        cursor: 'pointer', padding: '8px 0 4px', fontFamily: "'Nunito', sans-serif",
      }}
    >
      {children}
      <span style={{ fontSize: '10px', fontWeight: 700, color: active ? '#007AFF' : '#8E8E93', letterSpacing: '0.2px' }}>
        {label}
      </span>
    </button>
  );
}

function ChecklistIcon({ active }: { active: boolean }) {
  const c = active ? '#007AFF' : '#8E8E93';
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <rect x="4" y="5" width="18" height="16" rx="3" stroke={c} strokeWidth={active ? 2 : 1.7} />
      <path d="M8 10h10M8 13h10M8 16h6" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      {active && <circle cx="5.5" cy="10" r="1.5" fill={c} />}
    </svg>
  );
}

function ManageIcon({ active }: { active: boolean }) {
  const c = active ? '#007AFF' : '#8E8E93';
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path d="M13 4v2M13 20v2M4 13h2M20 13h2" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="13" cy="13" r="5" stroke={c} strokeWidth={active ? 2 : 1.7} />
      <circle cx="13" cy="13" r="2" fill={c} />
    </svg>
  );
}
