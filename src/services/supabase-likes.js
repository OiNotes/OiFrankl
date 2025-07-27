import { supabase } from '../config/supabase';
import { likesService as localLikesService } from './likes';

// Сервис для работы с глобальными лайками через Supabase
class SupabaseLikesService {
  constructor() {
    this.listeners = new Map();
    this.likesCache = new Map();
    this.userLikesCache = new Set();
    this.subscription = null;
    this.userKey = null;
    this.userId = null;
  }

  // Инициализация сервиса
  async init(userKey, userId) {
    this.userKey = userKey;
    this.userId = userId;
    
    // Инициализируем локальный сервис как fallback
    localLikesService.init(userKey);
    
    if (!supabase || !userId) {
      console.log('[supabaseLikesService.init] Using local likes service as fallback. supabase:', !!supabase, 'userId:', userId);
      return;
    }
    
    console.log('[supabaseLikesService.init] Initialized with userKey:', userKey, 'userId:', userId);
    
    // Загружаем лайки пользователя
    await this.loadUserLikes();
    
    // Подписываемся на изменения глобальных лайков
    this.subscribeToGlobalLikes();
  }

  // Загрузка лайков пользователя
  async loadUserLikes() {
    if (!supabase || !this.userId) return;
    
    try {
      const { data, error } = await supabase
        .from('user_likes')
        .select('fragment_id')
        .eq('user_id', this.userId);
      
      if (!error && data) {
        this.userLikesCache = new Set(data.map(item => item.fragment_id));
        console.log('Loaded user likes:', this.userLikesCache.size, 'likes for user:', this.userId);
        console.log('User likes fragments:', Array.from(this.userLikesCache));
      }
    } catch (error) {
      console.error('Failed to load user likes:', error);
    }
  }

  // Подписка на изменения лайков
  subscribeToGlobalLikes() {
    if (!supabase) return;
    
    // Отписываемся от предыдущей подписки
    if (this.subscription) {
      supabase.removeChannel(this.subscription);
    }
    
    // Создаем новую подписку на изменения в user_likes
    this.subscription = supabase
      .channel('user_likes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_likes'
        },
        (payload) => {
          this.handleUserLikesChange(payload);
        }
      )
      .subscribe();
  }

  // Обработка изменений лайков пользователей
  handleUserLikesChange(payload) {
    const { eventType, new: newData, old: oldData } = payload;
    
    // При любом изменении сбрасываем кеш для этого фрагмента
    const fragmentId = newData?.fragment_id || oldData?.fragment_id;
    if (fragmentId) {
      this.likesCache.delete(fragmentId);
      
      // Если это лайк текущего пользователя, обновляем кеш
      if (eventType === 'INSERT' && newData.user_id === this.userId) {
        this.userLikesCache.add(fragmentId);
      } else if (eventType === 'DELETE' && oldData.user_id === this.userId) {
        this.userLikesCache.delete(fragmentId);
      }
      
      // Уведомляем слушателей
      this.notifyListeners(fragmentId);
    }
  }

  // Получить количество лайков для фрагмента
  async getLikesCount(fragmentId) {
    // Сначала проверяем кеш
    if (this.likesCache.has(fragmentId)) {
      return this.likesCache.get(fragmentId);
    }
    
    // Если нет Supabase, используем локальный сервис
    if (!supabase) {
      return localLikesService.getLikesCount(fragmentId);
    }
    
    // Подсчитываем количество лайков напрямую из user_likes
    try {
      const { count, error } = await supabase
        .from('user_likes')
        .select('*', { count: 'exact', head: true })
        .eq('fragment_id', fragmentId);
      
      if (!error && count !== null) {
        console.log(`[getLikesCount] Fragment ${fragmentId}: found ${count} likes in Supabase`);
        this.likesCache.set(fragmentId, count);
        return count;
      } else {
        console.log(`[getLikesCount] Fragment ${fragmentId}: no likes found or error:`, error);
      }
    } catch (error) {
      console.error('Failed to get likes count:', error);
    }
    
    return 0;
  }

  // Проверить, лайкнул ли пользователь фрагмент
  isLikedByUser(fragmentId) {
    if (!supabase || !this.userId) {
      return localLikesService.isLikedByUser(fragmentId);
    }
    
    return this.userLikesCache.has(fragmentId);
  }

  // Переключить лайк
  async toggleLike(fragmentId) {
    // Если нет Supabase, используем локальный сервис
    if (!supabase || !this.userId) {
      return localLikesService.toggleLike(fragmentId);
    }
    
    const isLiked = this.isLikedByUser(fragmentId);
    
    console.log(`[toggleLike] Fragment ${fragmentId}, isLiked: ${isLiked}, userId: ${this.userId}`);
    
    try {
      if (isLiked) {
        // Удаляем лайк
        const { error } = await supabase
          .from('user_likes')
          .delete()
          .eq('user_id', this.userId)
          .eq('fragment_id', fragmentId);
        
        if (error) {
          console.error('[toggleLike] Error deleting like:', error);
          // Не выбрасываем ошибку, если это проблема с global_likes
          if (!error.message.includes('global_likes')) {
            throw error;
          }
        }
        console.log(`[toggleLike] Successfully deleted like for fragment ${fragmentId}`);
        
        // Обновляем локальный кеш
        this.userLikesCache.delete(fragmentId);
      } else {
        // Добавляем лайк
        const { error } = await supabase
          .from('user_likes')
          .insert({
            user_id: this.userId,
            fragment_id: fragmentId
          });
        
        if (error) {
          console.error('[toggleLike] Error inserting like:', error);
          // Не выбрасываем ошибку, если это проблема с global_likes
          if (!error.message.includes('global_likes')) {
            throw error;
          }
        }
        console.log(`[toggleLike] Successfully added like for fragment ${fragmentId}`);
        
        // Обновляем локальный кеш
        this.userLikesCache.add(fragmentId);
      }
      
      // Обновляем количество лайков в кеше
      const currentCount = this.likesCache.get(fragmentId) || 0;
      const newCount = isLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
      this.likesCache.set(fragmentId, newCount);
      
      // Уведомляем слушателей
      this.notifyListeners(fragmentId);
      
      // Сохраняем локально для оффлайн доступа
      localLikesService.toggleLike(fragmentId);
      
      return !isLiked;
    } catch (error) {
      console.error('Failed to toggle like:', error);
      // В случае ошибки используем локальный сервис
      return localLikesService.toggleLike(fragmentId);
    }
  }

  // Подписаться на изменения лайков конкретного фрагмента
  subscribe(fragmentId, callback) {
    // Если нет валидного fragmentId, возвращаем пустую функцию отписки
    if (!fragmentId || fragmentId <= 0) {
      return () => {};
    }
    
    if (!this.listeners.has(fragmentId)) {
      this.listeners.set(fragmentId, new Set());
    }
    this.listeners.get(fragmentId).add(callback);
    
    // Загружаем актуальные данные
    this.getLikesCount(fragmentId).then(count => {
      callback({
        count,
        isLikedByUser: this.isLikedByUser(fragmentId)
      });
    });
    
    // Возвращаем функцию отписки
    return () => {
      const callbacks = this.listeners.get(fragmentId);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  // Уведомить подписчиков об изменении
  async notifyListeners(fragmentId) {
    const callbacks = this.listeners.get(fragmentId);
    if (callbacks) {
      const count = await this.getLikesCount(fragmentId);
      const isLikedByUser = this.isLikedByUser(fragmentId);
      
      callbacks.forEach(callback => {
        callback({ count, isLikedByUser });
      });
    }
  }

  // Получить топ лайкнутых фрагментов
  async getTopLiked(limit = 10) {
    if (!supabase) {
      return localLikesService.getTopLiked(limit);
    }
    
    try {
      const { data, error } = await supabase
        .from('global_likes')
        .select('fragment_id, count')
        .order('count', { ascending: false })
        .limit(limit);
      
      if (!error && data) {
        return data;
      }
    } catch (error) {
      console.error('Failed to get top liked:', error);
    }
    
    return [];
  }

  // Очистка ресурсов
  cleanup() {
    if (this.subscription && supabase) {
      supabase.removeChannel(this.subscription);
    }
    this.listeners.clear();
    this.likesCache.clear();
    this.userLikesCache.clear();
  }
}

// Создаем единственный экземпляр
export const supabaseLikesService = new SupabaseLikesService();

// Хук для использования в компонентах
import { useState, useEffect } from 'react';

export const useSupabaseGlobalLikes = (fragmentId) => {
  const [likesData, setLikesData] = useState({
    count: 0,
    isLikedByUser: false
  });

  console.log('[useSupabaseGlobalLikes] Hook вызван для fragmentId:', fragmentId);
  console.log('[useSupabaseGlobalLikes] supabaseLikesService userId:', supabaseLikesService.userId);

  useEffect(() => {
    // Если нет валидного fragmentId, возвращаем пустые данные
    if (!fragmentId || fragmentId <= 0) {
      console.log('[useSupabaseGlobalLikes] Пропускаем - невалидный fragmentId:', fragmentId);
      setLikesData({ count: 0, isLikedByUser: false });
      return;
    }
    
    // Загружаем начальные данные сразу
    supabaseLikesService.getLikesCount(fragmentId).then(count => {
      const isLikedByUser = supabaseLikesService.isLikedByUser(fragmentId);
      console.log(`[useSupabaseGlobalLikes] Fragment ${fragmentId}: count=${count}, isLikedByUser=${isLikedByUser}`);
      setLikesData({ count, isLikedByUser });
    });
    
    // Подписываемся на изменения
    const unsubscribe = supabaseLikesService.subscribe(fragmentId, setLikesData);
    
    return unsubscribe;
  }, [fragmentId]);

  const toggleLike = async () => {
    console.log('[useSupabaseGlobalLikes] toggleLike вызван для fragmentId:', fragmentId);
    if (fragmentId && fragmentId > 0) {
      await supabaseLikesService.toggleLike(fragmentId);
    } else {
      console.warn('[useSupabaseGlobalLikes] toggleLike пропущен - невалидный fragmentId:', fragmentId);
    }
  };

  return { ...likesData, toggleLike };
};