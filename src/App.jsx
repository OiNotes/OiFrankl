import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Welcome } from './components/Welcome';
import { Reader } from './components/Reader';
import { storage } from './utils/storage';

function App() {
  const [userKey, setUserKey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Отладка: проверяем localStorage при загрузке
    console.log('=== DEBUG: Checking localStorage ===');
    console.log('Global likes:', localStorage.getItem('frankl_global_likes'));
    const allKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('frankl')) {
        allKeys.push(key);
      }
    }
    console.log('All frankl keys:', allKeys);
    console.log('=================================');
    
    // Проверяем, есть ли сохраненная сессия
    const savedKey = storage.getUserKey();
    if (savedKey) {
      setUserKey(savedKey);
    }
    setIsLoading(false);
  }, []);

  const handleStart = (key) => {
    storage.setUserKey(key);
    setUserKey(key);
  };

  const handleLogout = () => {
    setUserKey(null);
    storage.setUserKey('');
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-text-secondary">Загрузка...</div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {!userKey ? (
        <Welcome key="welcome" onStart={handleStart} />
      ) : (
        <Reader key="reader" userKey={userKey} onLogout={handleLogout} />
      )}
    </AnimatePresence>
  );
}

export default App;