import { useState, useEffect, useCallback } from 'react';
import { enhancedLocalStorage } from '../services/enhanced-local-storage';
import { useSupabaseProgress } from './useSupabaseProgress';

// Проверяем режим работы
const useLocalMode = import.meta.env.VITE_USE_LOCAL_STORAGE === 'true';

export const useUnifiedProgress = (userKey) => {
  // Для Supabase режима
  const supabaseData = useSupabaseProgress(useLocalMode ? null : userKey);
  
  // Для локального режима
  const [localProgress, setLocalProgress] = useState({
    currentIndex: 0,
    viewMode: 'original',
    lastRead: Date.now(),
    totalRead: 0,
    readFragments: [],
    likes: []
  });
  
  const [localSyncStatus, setLocalSyncStatus] = useState({
    isOnline: true,
    hasPendingSync: false,
    syncInProgress: false,
    isMigrating: false
  });

  // Загружаем данные для локального режима
  useEffect(() => {
    if (!useLocalMode || !userKey) return;

    const loadProgress = () => {
      const progress = enhancedLocalStorage.getUserProgress(userKey);
      setLocalProgress(progress);
    };

    loadProgress();
    
    // Обновляем при изменениях в других вкладках
    const handleStorageChange = (e) => {
      if (e.key?.includes('frankl_')) {
        loadProgress();
      }
    };
    
    // Слушаем событие обновления лайков
    const handleLikesUpdated = () => {
      console.log('[useUnifiedProgress] Получено событие обновления лайков');
      loadProgress();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('likesUpdated', handleLikesUpdated);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('likesUpdated', handleLikesUpdated);
    };
  }, [userKey]);

  // Обновление индекса
  const updateIndex = useCallback(async (newIndex) => {
    if (useLocalMode) {
      const fragmentId = newIndex + 1;
      const readFragments = localProgress.readFragments || [];
      const updatedReadFragments = readFragments.includes(fragmentId) 
        ? readFragments 
        : [...readFragments, fragmentId];
      
      const newProgress = {
        ...localProgress,
        currentIndex: newIndex,
        totalRead: Math.max(localProgress.totalRead, newIndex + 1),
        readFragments: updatedReadFragments
      };
      
      setLocalProgress(newProgress);
      enhancedLocalStorage.saveUserProgress(userKey, newProgress);
    } else {
      await supabaseData.updateIndex(newIndex);
    }
  }, [userKey, localProgress, supabaseData]);

  // Переключение режима просмотра
  const toggleViewMode = useCallback(async () => {
    if (useLocalMode) {
      const newViewMode = localProgress.viewMode === 'original' ? 'analogy' : 'original';
      const newProgress = {
        ...localProgress,
        viewMode: newViewMode
      };
      
      setLocalProgress(newProgress);
      enhancedLocalStorage.saveUserProgress(userKey, newProgress);
    } else {
      await supabaseData.toggleViewMode();
    }
  }, [userKey, localProgress, supabaseData]);

  // Переключение лайка
  const toggleLike = useCallback(async (fragmentId) => {
    if (useLocalMode) {
      const result = enhancedLocalStorage.toggleUserLike(userKey, fragmentId);
      
      // Обновляем локальное состояние
      const newProgress = enhancedLocalStorage.getUserProgress(userKey);
      setLocalProgress(newProgress);
    } else {
      await supabaseData.toggleLike(fragmentId);
    }
  }, [userKey, supabaseData]);

  // Возвращаем унифицированный интерфейс
  if (useLocalMode) {
    return {
      progress: localProgress,
      syncStatus: localSyncStatus,
      updateIndex,
      toggleViewMode,
      toggleLike
    };
  } else {
    return supabaseData;
  }
};