import { useState, useEffect, useCallback } from 'react';
import { supabaseStorage } from '../services/supabase-storage';
import { supabaseLikesService } from '../services/supabase-likes';
import { migrationService } from '../services/migration';
import { migrateUserToSupabase } from '../config/supabase';

export const useSupabaseProgress = (userKey) => {
  const [progress, setProgress] = useState({
    currentIndex: 0,
    viewMode: 'original',
    lastRead: Date.now(),
    totalRead: 0,
    readFragments: [],
    likes: []
  });
  
  const [syncStatus, setSyncStatus] = useState({
    isOnline: true,
    hasPendingSync: false,
    syncInProgress: false,
    isMigrating: false
  });

  // Инициализация при монтировании
  useEffect(() => {
    if (!userKey) return;

    const initializeProgress = async () => {
      // Проверяем и выполняем миграцию если нужно
      setSyncStatus(prev => ({ ...prev, isMigrating: true }));
      
      try {
        // Инициализируем хранилище
        await supabaseStorage.init(userKey);
        
        // Проверяем, нужна ли миграция
        const needsMigration = await migrationService.checkMigrationNeeded(userKey);
        
        if (needsMigration && supabaseStorage.userId) {
          console.log('Starting data migration...');
          await migrationService.migrateUserData(userKey, supabaseStorage.userId);
        }
        
        // Инициализируем сервис лайков
        await supabaseLikesService.init(userKey, supabaseStorage.userId);
        
        // Загружаем прогресс
        const loadedProgress = await supabaseStorage.getProgress(userKey);
        setProgress(loadedProgress);
      } catch (error) {
        console.error('Failed to initialize progress:', error);
      } finally {
        setSyncStatus(prev => ({ ...prev, isMigrating: false }));
      }
    };

    initializeProgress();

    // Обновляем статус синхронизации
    const syncInterval = setInterval(() => {
      const status = supabaseStorage.getSyncStatus();
      setSyncStatus(prev => ({
        ...prev,
        ...status
      }));
    }, 1000);

    return () => {
      clearInterval(syncInterval);
      supabaseLikesService.cleanup();
    };
  }, [userKey]);

  // Обновление индекса
  const updateIndex = useCallback(async (newIndex) => {
    setProgress(prev => {
      // Получаем ID фрагмента по индексу
      const fragmentId = newIndex + 1;
      
      // Добавляем в прочитанные, если еще не добавлен
      const readFragments = prev.readFragments || [];
      const updatedReadFragments = readFragments.includes(fragmentId) 
        ? readFragments 
        : [...readFragments, fragmentId];
      
      const newProgress = {
        ...prev,
        currentIndex: newIndex,
        totalRead: Math.max(prev.totalRead, newIndex + 1),
        readFragments: updatedReadFragments
      };
      
      // Сохраняем асинхронно
      supabaseStorage.saveProgress(userKey, newProgress);
      
      return newProgress;
    });
  }, [userKey]);

  // Переключение режима просмотра
  const toggleViewMode = useCallback(async () => {
    setProgress(prev => {
      const newProgress = {
        ...prev,
        viewMode: prev.viewMode === 'original' ? 'analogy' : 'original'
      };
      
      // Сохраняем асинхронно
      supabaseStorage.saveProgress(userKey, newProgress);
      
      return newProgress;
    });
  }, [userKey]);

  // Переключение лайка
  const toggleLike = useCallback(async (paragraphId) => {
    // Обновляем локальный список лайков
    setProgress(prev => {
      const likes = prev.likes.includes(paragraphId)
        ? prev.likes.filter(id => id !== paragraphId)
        : [...prev.likes, paragraphId];
      
      const newProgress = {
        ...prev,
        likes
      };
      
      // Сохраняем асинхронно
      supabaseStorage.saveProgress(userKey, newProgress);
      
      return newProgress;
    });
    
    // Обновляем глобальный лайк через Supabase
    await supabaseStorage.toggleLike(paragraphId);
  }, [userKey]);

  // Сброс прогресса
  const resetProgress = useCallback(async () => {
    const defaultProgress = {
      currentIndex: 0,
      viewMode: 'original',
      lastRead: Date.now(),
      totalRead: 0,
      readFragments: [],
      likes: []
    };
    
    setProgress(defaultProgress);
    await supabaseStorage.saveProgress(userKey, defaultProgress);
  }, [userKey]);

  return {
    progress,
    updateIndex,
    toggleViewMode,
    toggleLike,
    resetProgress,
    syncStatus
  };
};