import { useState } from 'react';
import { User } from '../data/types';
import { storage } from '../data/storage';

interface Props {
  onLogin: (user: User) => void;
}

export function Login({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = storage.getUsers().find(
      u => u.username === username.trim() && u.password === password
    );
    if (user) {
      storage.saveSession(user.id);
      onLogin(user);
    } else {
      setError('Invalid username or password');
    }
  };

  const S = styles;

  return (
    <div style={S.page}>
      <div style={S.center}>
        {/* App icon */}
        <div style={S.icon}>✓</div>
        <h1 style={S.title}>Household Checklist</h1>
        <p style={S.subtitle}>Aviation-inspired task management</p>

        <form onSubmit={handleSubmit} style={S.form}>
          <div style={S.card}>
            <div style={S.fieldWrap}>
              <label style={S.label}>USERNAME</label>
              <input
                style={S.input}
                type="text"
                value={username}
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="Enter username"
                onChange={e => { setUsername(e.target.value); setError(''); }}
              />
            </div>
            <div style={S.divider} />
            <div style={S.fieldWrap}>
              <label style={S.label}>PASSWORD</label>
              <input
                style={S.input}
                type="password"
                value={password}
                placeholder="Enter password"
                onChange={e => { setPassword(e.target.value); setError(''); }}
              />
            </div>
          </div>

          {error && <p style={S.error}>{error}</p>}

          <button type="submit" style={S.btn}>Sign In</button>
        </form>

        <p style={S.hint}>
          Demo: <strong>admin</strong> / admin123 · <strong>student</strong> / student
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100svh',
    background: '#F2F2F7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: "'Nunito', sans-serif",
  } as React.CSSProperties,
  center: {
    width: '100%',
    maxWidth: '360px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  icon: {
    width: '80px', height: '80px',
    borderRadius: '22px',
    background: '#007AFF',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '38px', color: '#fff',
    boxShadow: '0 6px 20px rgba(0,122,255,0.4)',
    marginBottom: '20px',
  } as React.CSSProperties,
  title: {
    fontSize: '28px', fontWeight: 800, color: '#1C1C1E',
    marginBottom: '6px', textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: '15px', color: '#8E8E93', marginBottom: '36px',
    textAlign: 'center' as const,
  },
  form: { width: '100%' },
  card: {
    background: '#fff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    marginBottom: '16px',
  },
  fieldWrap: { padding: '10px 16px 14px' },
  label: {
    fontSize: '11px', fontWeight: 700, color: '#8E8E93',
    letterSpacing: '0.6px', display: 'block', marginBottom: '4px',
    fontFamily: "'Nunito', sans-serif",
  } as React.CSSProperties,
  input: {
    width: '100%', border: 'none', outline: 'none',
    fontSize: '17px', color: '#1C1C1E', background: 'transparent',
    fontFamily: "'Nunito', sans-serif", fontWeight: 600,
    padding: 0,
  } as React.CSSProperties,
  divider: { height: '1px', background: '#F2F2F7', marginLeft: '16px' },
  error: {
    color: '#FF3B30', fontSize: '14px', fontWeight: 600,
    textAlign: 'center' as const, marginBottom: '12px',
  },
  btn: {
    width: '100%', padding: '16px',
    background: '#007AFF', color: '#fff',
    border: 'none', borderRadius: '14px',
    fontSize: '17px', fontWeight: 700,
    cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
    boxShadow: '0 4px 14px rgba(0,122,255,0.35)',
  } as React.CSSProperties,
  hint: {
    fontSize: '13px', color: '#C7C7CC',
    marginTop: '28px', textAlign: 'center' as const,
  },
};
