import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Welcome } from './components/Welcome';
import { Reader } from './components/Reader';
import { storage } from './utils/storage';
import { supabaseLikesService } from './services/supabase-likes-optimized';
import { migrateUserToSupabase } from './config/supabase';

function App() {
  const [userKey, setUserKey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      
      // Проверяем, есть ли сохраненная сессия
      const savedKey = storage.getUserKey();
      if (savedKey) {
        // Предзагружаем данные для Supabase
        if (import.meta.env.VITE_USE_LOCAL_STORAGE !== 'true') {
          try {
            const userId = await migrateUserToSupabase(savedKey);
            if (userId) {
              await supabaseLikesService.init(savedKey, userId);
            }
          } catch (error) {
            console.error('Error preloading data:', error);
          }
        }
        setUserKey(savedKey);
      }
      
      setIsLoading(false);
    };
    
    // Очистка старых данных
    const cleanupOldData = () => {
      if (localStorage.getItem('frankl_cleaned_v3') !== 'true') {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('frankl_user_likes_') || key === 'frankl_global_likes')) {
            localStorage.removeItem(key);
          }
        }
        localStorage.setItem('frankl_cleaned_v3', 'true');
      }
    };
    
    cleanupOldData();
    initializeApp();
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