import { useState, useCallback } from 'react';
import { User, ChecklistTemplate } from '../data/types';
import { storage } from '../data/storage';
import { ExecutionScreen } from './execution/ExecutionScreen';
import { ManagementScreen } from './management/ManagementScreen';

interface Props {
  user: User;
  onLogout: () => void;
}

export function MainApp({ user, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>(() => storage.getTemplates());

  const refreshTemplates = useCallback(() => setTemplates(storage.getTemplates()), []);
  const userTemplates = templates.filter(t => t.userId === user.id);

  return (
    <div style={{ height: '100svh', display: 'flex', flexDirection: 'column', background: '#F2F2F7', fontFamily: "'Nunito', sans-serif" }}>
      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, display: activeTab === 0 ? 'flex' : 'none', flexDirection: 'column' }}>
          <ExecutionScreen user={user} templates={userTemplates} />
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

      {/* Bottom tab bar */}
      <div style={tabBarStyle}>
        <TabButton
          icon={<ChecklistIcon active={activeTab === 0} />}
          label="Today"
          active={activeTab === 0}
          onClick={() => setActiveTab(0)}
        />
        <TabButton
          icon={<ManageIcon active={activeTab === 1} />}
          label="Manage"
          active={activeTab === 1}
          onClick={() => setActiveTab(1)}
        />
      </div>
    </div>
  );
}

function TabButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: '4px', border: 'none', background: 'none',
        cursor: 'pointer', padding: '8px 0 4px', fontFamily: "'Nunito', sans-serif",
      }}
    >
      {icon}
      <span style={{ fontSize: '10px', fontWeight: 600, color: active ? '#007AFF' : '#8E8E93', letterSpacing: '0.2px' }}>
        {label}
      </span>
    </button>
  );
}

function ChecklistIcon({ active }: { active: boolean }) {
  const c = active ? '#007AFF' : '#8E8E93';
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <rect x="4" y="5" width="18" height="16" rx="3" stroke={c} strokeWidth="1.8" />
      <path d="M8 10h10M8 13h10M8 16h6" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      {active && <circle cx="8" cy="10" r="1.5" fill={c} />}
    </svg>
  );
}

function ManageIcon({ active }: { active: boolean }) {
  const c = active ? '#007AFF' : '#8E8E93';
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="9" stroke={c} strokeWidth="1.8" />
      <circle cx="13" cy="13" r="3.5" stroke={c} strokeWidth="1.8" />
      <path d="M13 4v2M13 20v2M4 13h2M20 13h2" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const tabBarStyle: React.CSSProperties = {
  display: 'flex',
  background: 'rgba(255,255,255,0.95)',
  backdropFilter: 'blur(20px)',
  borderTop: '0.5px solid #C6C6C8',
  paddingBottom: 'env(safe-area-inset-bottom, 0px)',
};
