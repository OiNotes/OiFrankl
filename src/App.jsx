import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Welcome } from './components/Welcome';
import { Reader } from './components/Reader';
import { storage } from './utils/storage';

function App() {
  const [userKey, setUserKey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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