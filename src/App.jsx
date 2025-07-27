import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Welcome } from './components/Welcome';
import { Reader } from './components/Reader';
import { storage } from './utils/storage';

function App() {
  const [userKey, setUserKey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Отладка: проверяем режим работы и переменные окружения
    console.log('=== DEBUG: App Configuration ===');
    console.log('🔧 Режим работы:');
    console.log('  VITE_USE_LOCAL_STORAGE:', import.meta.env.VITE_USE_LOCAL_STORAGE);
    console.log('  Используется локальное хранилище:', import.meta.env.VITE_USE_LOCAL_STORAGE === 'true');
    console.log('  VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Установлен' : '❌ Не установлен');
    console.log('  VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Установлен' : '❌ Не установлен');
    console.log('');
    console.log('📦 LocalStorage:');
    console.log('  Global likes:', localStorage.getItem('frankl_global_likes'));
    const allKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('frankl')) {
        allKeys.push(key);
      }
    }
    console.log('  All frankl keys:', allKeys);
    console.log('=================================');
    
    // Одноразовая очистка старых данных
    if (localStorage.getItem('frankl_cleaned_v2') !== 'true') {
      console.log('🧹 Очищаем старые данные...');
      // Очищаем все ключи с frankl_user_likes_
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('frankl_user_likes_') || key === 'frankl_global_likes')) {
          console.log('Удаляем:', key);
          localStorage.removeItem(key);
        }
      }
      localStorage.setItem('frankl_cleaned_v2', 'true');
    }
    
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