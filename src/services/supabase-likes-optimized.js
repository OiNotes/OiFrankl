import { supabase } from '../config/supabase';
import { likesService as localLikesService } from './likes';

// Оптимизированный сервис для работы с глобальными лайками через Supabase
class OptimizedSupabaseLikesService {
  constructor() {
    this.listeners = new Map();
    this.likesCache = new Map();
    this.userLikesCache = new Set();
    this.subscription = null;
    this.userKey = null;
    this.userId = null;
    this.pendingRequests = new Map(); // Для предотвращения дублирующих запросов
    this.batchTimer = null;
    this.batchQueue = new Set();
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
    
    // Загружаем все лайки одним запросом
    await this.loadAllData();
    
    // Подписываемся на изменения глобальных лайков
    this.subscribeToGlobalLikes();
  }

  // Загрузка всех данных одним батчем
  async loadAllData() {
    if (!supabase || !this.userId) return;
    
    try {
      // Загружаем лайки пользователя
      const { data: userLikes, error: userError } = await supabase
        .from('user_likes')
        .select('fragment_id')
        .eq('user_id', this.userId);
      
      if (!userError && userLikes) {
        this.userLikesCache = new Set(userLikes.map(item => item.fragment_id));
        console.log('Loaded user likes:', this.userLikesCache.size, 'likes');
      }
      
      // Загружаем общее количество лайков для всех фрагментов
      const { data: allLikes, error: allError } = await supabase
        .from('user_likes')
        .select('fragment_id')
        .order('fragment_id');
      
      if (!allError && allLikes) {
        // Группируем по fragment_id и считаем
        const likeCounts = {};
        allLikes.forEach(like => {
          likeCounts[like.fragment_id] = (likeCounts[like.fragment_id] || 0) + 1;
        });
        
        // Сохраняем в кеш
        Object.entries(likeCounts).forEach(([fragmentId, count]) => {
          this.likesCache.set(parseInt(fragmentId), count);
        });
        
        console.log('Loaded like counts for', Object.keys(likeCounts).length, 'fragments');
      }
      
      // Уведомляем все компоненты
      this.notifyAllListeners();
    } catch (error) {
      console.error('Failed to load all data:', error);
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
    
    const fragmentId = newData?.fragment_id || oldData?.fragment_id;
    if (!fragmentId) return;
    
    // Обновляем кеш количества лайков
    const currentCount = this.likesCache.get(fragmentId) || 0;
    if (eventType === 'INSERT') {
      this.likesCache.set(fragmentId, currentCount + 1);
      if (newData.user_id === this.userId) {
        this.userLikesCache.add(fragmentId);
      }
    } else if (eventType === 'DELETE') {
      this.likesCache.set(fragmentId, Math.max(0, currentCount - 1));
      if (oldData.user_id === this.userId) {
        this.userLikesCache.delete(fragmentId);
      }
    }
    
    // Уведомляем слушателей
    this.notifyListeners(fragmentId);
  }

  // Получить количество лайков для фрагмента (с кешем)
  async getLikesCount(fragmentId) {
    // Всегда возвращаем из кеша
    return this.likesCache.get(fragmentId) || 0;
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
    
    // Оптимистичное обновление UI
    if (isLiked) {
      this.userLikesCache.delete(fragmentId);
      this.likesCache.set(fragmentId, Math.max(0, (this.likesCache.get(fragmentId) || 0) - 1));
    } else {
      this.userLikesCache.add(fragmentId);
      this.likesCache.set(fragmentId, (this.likesCache.get(fragmentId) || 0) + 1);
    }
    
    // Сразу уведомляем UI
    this.notifyListeners(fragmentId);
    
    try {
      if (isLiked) {
        // Удаляем лайк
        const { error } = await supabase
          .from('user_likes')
          .delete()
          .eq('user_id', this.userId)
          .eq('fragment_id', fragmentId);
        
        if (error && !error.message.includes('global_likes')) {
          // Откатываем изменения
          this.userLikesCache.add(fragmentId);
          this.likesCache.set(fragmentId, (this.likesCache.get(fragmentId) || 0) + 1);
          this.notifyListeners(fragmentId);
          throw error;
        }
      } else {
        // Добавляем лайк
        const { error } = await supabase
          .from('user_likes')
          .insert({
            user_id: this.userId,
            fragment_id: fragmentId
          });
        
        if (error && !error.message.includes('global_likes')) {
          // Откатываем изменения
          this.userLikesCache.delete(fragmentId);
          this.likesCache.set(fragmentId, Math.max(0, (this.likesCache.get(fragmentId) || 0) - 1));
          this.notifyListeners(fragmentId);
          throw error;
        }
      }
      
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
    
    // Сразу вызываем callback с текущими данными из кеша
    callback({
      count: this.likesCache.get(fragmentId) || 0,
      isLikedByUser: this.isLikedByUser(fragmentId)
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
  notifyListeners(fragmentId) {
    const callbacks = this.listeners.get(fragmentId);
    if (callbacks) {
      const count = this.likesCache.get(fragmentId) || 0;
      const isLikedByUser = this.isLikedByUser(fragmentId);
      
      callbacks.forEach(callback => {
        callback({ count, isLikedByUser });
      });
    }
  }

  // Уведомить все подписанные компоненты
  notifyAllListeners() {
    this.listeners.forEach((callbacks, fragmentId) => {
      this.notifyListeners(fragmentId);
    });
  }

  // Очистка ресурсов
  cleanup() {
    if (this.subscription && supabase) {
      supabase.removeChannel(this.subscription);
    }
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    this.listeners.clear();
    this.likesCache.clear();
    this.userLikesCache.clear();
    this.pendingRequests.clear();
  }
}

// Создаем единственный экземпляр
export const supabaseLikesService = new OptimizedSupabaseLikesService();

// Хук для использования в компонентах
import { useState, useEffect, useRef } from 'react';

export const useSupabaseGlobalLikes = (fragmentId) => {
  const [likesData, setLikesData] = useState({
    count: 0,
    isLikedByUser: false
  });
  
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    // Если нет валидного fragmentId, возвращаем пустые данные
    if (!fragmentId || fragmentId <= 0) {
      setLikesData({ count: 0, isLikedByUser: false });
      return;
    }
    
    // Подписываемся на изменения
    const unsubscribe = supabaseLikesService.subscribe(fragmentId, (data) => {
      if (mountedRef.current) {
        setLikesData(data);
      }
    });
    
    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, [fragmentId]);

  const toggleLike = async () => {
    if (fragmentId && fragmentId > 0) {
      await supabaseLikesService.toggleLike(fragmentId);
    }
  };

  return { ...likesData, toggleLike };
};