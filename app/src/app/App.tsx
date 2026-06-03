import { useState, useEffect } from 'react';
import { User } from './data/types';
import { storage, initSeedData } from './data/storage';
import Login from './components/Login';
import MainApp from './components/MainApp';

initSeedData();

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const sessionId = storage.getSession();
    if (!sessionId) return null;
    return storage.getUsers().find((u) => u.id === sessionId) ?? null;
  });

  // Keep page height correct on mobile (address bar issues)
  useEffect(() => {
    const setVh = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);

  const handleLogout = () => {
    storage.clearSession();
    setUser(null);
  };

  if (!user) return <Login onLogin={setUser} />;
  return <MainApp user={user} onLogout={handleLogout} />;
}
