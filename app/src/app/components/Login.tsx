import { useState } from 'react';
import { motion } from 'motion/react';
import { User } from '../data/types';
import { storage } from '../data/storage';

interface Props { onLogin: (user: User) => void; }

export default function Login({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = storage.getUsers().find(
      (u) => u.username === username.trim() && u.password === password
    );
    if (user) {
      storage.saveSession(user.id);
      onLogin(user);
    } else {
      setError('ユーザー名またはパスワードが正しくありません');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div style={{
      minHeight: '100svh', background: '#F2F2F7',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: "'Nunito', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* App icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300 }}
          style={{
            width: '88px', height: '88px', borderRadius: '24px',
            background: 'linear-gradient(145deg, #007AFF, #0055CC)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 28px rgba(0,122,255,0.45)',
            marginBottom: '22px',
          }}
        >
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <rect x="8" y="10" width="28" height="24" rx="4" stroke="white" strokeWidth="2.2" />
            <path d="M14 18h16M14 22h16M14 26h10" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="11" cy="18" r="1.5" fill="white" />
            <circle cx="11" cy="22" r="1.5" fill="white" />
            <circle cx="11" cy="26" r="1.5" fill="white" />
          </svg>
        </motion.div>

        <motion.h1
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{ fontSize: '26px', fontWeight: 900, color: '#1C1C1E', marginBottom: '6px', textAlign: 'center' }}
        >
          Checklist
        </motion.h1>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          style={{ fontSize: '14px', color: '#8E8E93', marginBottom: '40px', textAlign: 'center' }}
        >
          航空チェックリスト方式の個人タスク管理
        </motion.p>

        <motion.form
          onSubmit={handleSubmit}
          style={{ width: '100%' }}
          animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.5 }}
        >
          <div style={{
            background: '#fff', borderRadius: '18px',
            overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            marginBottom: '14px',
          }}>
            <div style={{ padding: '12px 18px 14px' }}>
              <label style={{ fontSize: '10px', fontWeight: 800, color: '#8E8E93', letterSpacing: '0.8px', display: 'block', marginBottom: '4px' }}>
                ユーザー名
              </label>
              <input
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: '17px', color: '#1C1C1E', background: 'transparent', fontFamily: "'Nunito', sans-serif", fontWeight: 600 }}
                type="text"
                value={username}
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="username"
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
              />
            </div>
            <div style={{ height: '0.5px', background: '#E5E5EA', marginLeft: '18px' }} />
            <div style={{ padding: '12px 18px 14px' }}>
              <label style={{ fontSize: '10px', fontWeight: 800, color: '#8E8E93', letterSpacing: '0.8px', display: 'block', marginBottom: '4px' }}>
                パスワード
              </label>
              <input
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: '17px', color: '#1C1C1E', background: 'transparent', fontFamily: "'Nunito', sans-serif", fontWeight: 600 }}
                type="password"
                value={password}
                placeholder="password"
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
              />
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ color: '#FF3B30', fontSize: '13px', fontWeight: 700, textAlign: 'center', marginBottom: '12px' }}
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            style={{
              width: '100%', padding: '16px',
              background: 'linear-gradient(135deg, #007AFF, #0062CC)',
              color: '#fff', border: 'none', borderRadius: '14px',
              fontSize: '17px', fontWeight: 800,
              cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,122,255,0.4)',
            }}
          >
            サインイン
          </button>
        </motion.form>
      </div>
    </div>
  );
}
