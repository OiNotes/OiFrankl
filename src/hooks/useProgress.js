import { useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';

export const useProgress = (userKey) => {
  const [progress, setProgress] = useState(() => {
    return storage.getProgress(userKey);
  });
  const [isSaving, setIsSaving] = useState(false);

  // Сохранение прогресса с дебаунсом
  useEffect(() => {
    if (!userKey) return;

    setIsSaving(true);
    const timeoutId = setTimeout(() => {
      storage.saveProgress(userKey, progress);
      setIsSaving(false);
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      setIsSaving(false);
    };
  }, [userKey, progress]);

  const updateIndex = useCallback((newIndex) => {
    setProgress(prev => {
      // Получаем ID фрагмента по индексу
      const fragmentId = newIndex + 1; // ID начинаются с 1
      
      // Добавляем в прочитанные, если еще не добавлен
      const readFragments = prev.readFragments || [];
      const updatedReadFragments = readFragments.includes(fragmentId) 
        ? readFragments 
        : [...readFragments, fragmentId];
      
      return {
        ...prev,
        currentIndex: newIndex,
        totalRead: Math.max(prev.totalRead, newIndex + 1),
        readFragments: updatedReadFragments
      };
    });
  }, []);

  const toggleViewMode = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      viewMode: prev.viewMode === 'original' ? 'analogy' : 'original'
    }));
  }, []);

  const toggleLike = useCallback((paragraphId) => {
    setProgress(prev => {
      const likes = prev.likes.includes(paragraphId)
        ? prev.likes.filter(id => id !== paragraphId)
        : [...prev.likes, paragraphId];
      
      return {
        ...prev,
        likes
      };
    });
  }, []);

  const resetProgress = useCallback(() => {
    const defaultProgress = {
      currentIndex: 0,
      viewMode: 'original',
      lastRead: Date.now(),
      totalRead: 0,
      readFragments: [],
      likes: []
    };
    setProgress(defaultProgress);
    storage.saveProgress(userKey, defaultProgress);
  }, [userKey]);

  return {
    progress,
    updateIndex,
    toggleViewMode,
    toggleLike,
    resetProgress,
    isSaving
  };
};