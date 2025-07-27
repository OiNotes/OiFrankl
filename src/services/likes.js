// Сервис для работы с глобальными лайками
// Временная реализация с localStorage для демонстрации
// Для продакшена необходимо подключить Firebase

class LikesService {
  constructor() {
    this.likes = JSON.parse(localStorage.getItem('frankl_global_likes') || '{}');
    this.userLikes = new Set();
    this.listeners = new Map();
  }

  // Инициализация для пользователя
  init(userKey) {
    this.userKey = userKey;
    const userLikesData = JSON.parse(localStorage.getItem(`frankl_user_likes_${userKey}`) || '[]');
    this.userLikes = new Set(userLikesData);
  }

  // Получить количество лайков для фрагмента
  getLikesCount(fragmentId) {
    return this.likes[fragmentId] || 0;
  }

  // Проверить, лайкнул ли пользователь фрагмент
  isLikedByUser(fragmentId) {
    return this.userLikes.has(fragmentId);
  }

  // Переключить лайк
  async toggleLike(fragmentId) {
    const isLiked = this.userLikes.has(fragmentId);
    
    if (isLiked) {
      this.userLikes.delete(fragmentId);
      this.likes[fragmentId] = Math.max(0, (this.likes[fragmentId] || 0) - 1);
    } else {
      this.userLikes.add(fragmentId);
      this.likes[fragmentId] = (this.likes[fragmentId] || 0) + 1;
    }

    // Сохраняем в localStorage
    localStorage.setItem('frankl_global_likes', JSON.stringify(this.likes));
    localStorage.setItem(`frankl_user_likes_${this.userKey}`, JSON.stringify([...this.userLikes]));

    // Уведомляем подписчиков
    this.notifyListeners(fragmentId);

    return !isLiked;
  }

  // Подписаться на изменения лайков
  subscribe(fragmentId, callback) {
    if (!this.listeners.has(fragmentId)) {
      this.listeners.set(fragmentId, new Set());
    }
    this.listeners.get(fragmentId).add(callback);

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
      callbacks.forEach(callback => {
        callback({
          count: this.getLikesCount(fragmentId),
          isLikedByUser: this.isLikedByUser(fragmentId)
        });
      });
    }
  }

  // Получить топ лайкнутых фрагментов
  getTopLiked(limit = 10) {
    return Object.entries(this.likes)
      .map(([fragmentId, count]) => ({ fragmentId: parseInt(fragmentId), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}

// Создаем единственный экземпляр сервиса
export const likesService = new LikesService();

// Хук для использования в компонентах
import { useState, useEffect } from 'react';

export const useGlobalLikes = (fragmentId) => {
  const [likesData, setLikesData] = useState({
    count: likesService.getLikesCount(fragmentId),
    isLikedByUser: likesService.isLikedByUser(fragmentId)
  });

  useEffect(() => {
    // Подписываемся на изменения
    const unsubscribe = likesService.subscribe(fragmentId, setLikesData);
    
    // Обновляем начальные данные
    setLikesData({
      count: likesService.getLikesCount(fragmentId),
      isLikedByUser: likesService.isLikedByUser(fragmentId)
    });

    return unsubscribe;
  }, [fragmentId]);

  const toggleLike = async () => {
    await likesService.toggleLike(fragmentId);
  };

  return { ...likesData, toggleLike };
};