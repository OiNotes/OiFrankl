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
    console.log('💡 Чтобы добавить тестовые лайки:');
    console.log('1. Откройте /src/test-likes.html в браузере');
    console.log('2. Нажмите "Add Test Likes"');
    console.log('3. Перезагрузите приложение');
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