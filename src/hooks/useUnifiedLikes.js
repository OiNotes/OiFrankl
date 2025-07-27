import { useState, useEffect, useCallback } from 'react';
import { enhancedLocalStorage } from '../services/enhanced-local-storage';
import { useSupabaseGlobalLikes } from '../services/supabase-likes';

// Проверяем режим работы
const useLocalMode = import.meta.env.VITE_USE_LOCAL_STORAGE === 'true';

export const useUnifiedLikes = (fragmentId, userKey) => {
  // Для Supabase режима
  const supabaseData = useSupabaseGlobalLikes(useLocalMode ? null : fragmentId);
  
  // Для локального режима
  const [localData, setLocalData] = useState({
    count: 0,
    isLikedByUser: false
  });

  // Загружаем данные для локального режима
  useEffect(() => {
    if (!useLocalMode || !fragmentId || !userKey) return;

    const loadLocalData = () => {
      const progress = enhancedLocalStorage.getUserProgress(userKey);
      const globalCount = enhancedLocalStorage.getGlobalLikes(fragmentId);
      const isLiked = progress.likes.includes(fragmentId);
      
      setLocalData({
        count: globalCount,
        isLikedByUser: isLiked
      });
    };

    loadLocalData();
    
    // Обновляем при изменениях в других вкладках
    const handleStorageChange = (e) => {
      if (e.key?.includes('frankl_')) {
        loadLocalData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fragmentId, userKey]);

  // Функция переключения лайка
  const toggleLike = useCallback(async () => {
    if (!fragmentId) return;

    if (useLocalMode) {
      // Локальный режим
      console.log('[useUnifiedLikes] toggleLike для фрагмента:', fragmentId, 'пользователь:', userKey);
      const result = enhancedLocalStorage.toggleUserLike(userKey, fragmentId);
      console.log('[useUnifiedLikes] Результат:', result);
      
      // Обновляем состояние
      setLocalData({
        count: result.globalLikesCount,
        isLikedByUser: result.isLiked
      });
      
      // Уведомляем родительский компонент об изменении
      window.dispatchEvent(new CustomEvent('likesUpdated', { detail: { fragmentId, isLiked: result.isLiked } }));
      
      // Анимация
      if (window.navigator?.vibrate) {
        window.navigator.vibrate(30);
      }
    } else {
      // Supabase режим
      await supabaseData.toggleLike();
    }
  }, [fragmentId, userKey, supabaseData]);

  // Возвращаем унифицированный интерфейс
  if (useLocalMode) {
    return {
      count: localData.count,
      isLikedByUser: localData.isLikedByUser,
      toggleLike
    };
  } else {
    return supabaseData;
  }
};