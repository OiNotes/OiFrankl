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
      console.log('Using local likes service as fallback');
      return;
    }
    
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
      }
    } catch (error) {
      console.error('Failed to load user likes:', error);
    }
  }

  // Подписка на изменения глобальных лайков
  subscribeToGlobalLikes() {
    if (!supabase) return;
    
    // Отписываемся от предыдущей подписки
    if (this.subscription) {
      supabase.removeChannel(this.subscription);
    }
    
    // Создаем новую подписку
    this.subscription = supabase
      .channel('global_likes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'global_likes'
        },
        (payload) => {
          this.handleGlobalLikesChange(payload);
        }
      )
      .subscribe();
  }

  // Обработка изменений глобальных лайков
  handleGlobalLikesChange(payload) {
    const { eventType, new: newData, old: oldData } = payload;
    
    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      this.likesCache.set(newData.fragment_id, newData.count);
      this.notifyListeners(newData.fragment_id);
    } else if (eventType === 'DELETE') {
      this.likesCache.delete(oldData.fragment_id);
      this.notifyListeners(oldData.fragment_id);
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
    
    // Загружаем из БД
    try {
      const { data, error } = await supabase
        .from('global_likes')
        .select('count')
        .eq('fragment_id', fragmentId)
        .single();
      
      if (!error && data) {
        this.likesCache.set(fragmentId, data.count);
        return data.count;
      }
    } catch (error) {
      // Игнорируем ошибку, если запись не найдена
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
    
    try {
      if (isLiked) {
        // Удаляем лайк
        const { error } = await supabase
          .from('user_likes')
          .delete()
          .eq('user_id', this.userId)
          .eq('fragment_id', fragmentId);
        
        if (error) throw error;
        
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
        
        if (error) throw error;
        
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

  useEffect(() => {
    // Подписываемся на изменения
    const unsubscribe = supabaseLikesService.subscribe(fragmentId, setLikesData);
    
    return unsubscribe;
  }, [fragmentId]);

  const toggleLike = async () => {
    await supabaseLikesService.toggleLike(fragmentId);
  };

  return { ...likesData, toggleLike };
};