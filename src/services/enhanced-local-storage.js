// Улучшенное локальное хранилище с симуляцией глобальных лайков

class EnhancedLocalStorage {
  constructor() {
    this.GLOBAL_LIKES_KEY = 'frankl_global_likes_v2';
    this.USER_PROGRESS_KEY = 'frankl_user_progress_';
    this.SIMULATED_USERS_KEY = 'frankl_simulated_users';
    
    // Инициализируем симулированные глобальные лайки при первом запуске
    this.initializeSimulatedLikes();
  }

  initializeSimulatedLikes() {
    const existingLikes = localStorage.getItem(this.GLOBAL_LIKES_KEY);
    if (!existingLikes) {
      // Создаем реалистичное распределение лайков
      const simulatedLikes = {};
      
      // Популярные фрагменты (больше лайков)
      const popularFragments = [1, 5, 7, 12, 15, 23, 34, 42, 56, 78, 99, 123, 145, 167, 189];
      popularFragments.forEach(id => {
        simulatedLikes[id] = Math.floor(Math.random() * 8) + 5; // 5-12 лайков
      });
      
      // Средние фрагменты
      const mediumFragments = [2, 3, 8, 10, 14, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100];
      mediumFragments.forEach(id => {
        simulatedLikes[id] = Math.floor(Math.random() * 5) + 2; // 2-6 лайков
      });
      
      // Случайные фрагменты с 1-3 лайками
      for (let i = 0; i < 30; i++) {
        const randomId = Math.floor(Math.random() * 200) + 1;
        if (!simulatedLikes[randomId]) {
          simulatedLikes[randomId] = Math.floor(Math.random() * 3) + 1;
        }
      }
      
      localStorage.setItem(this.GLOBAL_LIKES_KEY, JSON.stringify(simulatedLikes));
      console.log('[EnhancedLocalStorage] Инициализированы симулированные лайки:', Object.keys(simulatedLikes).length, 'фрагментов');
    }
  }

  // Получить прогресс пользователя
  getUserProgress(userKey) {
    const key = this.USER_PROGRESS_KEY + userKey;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      const progress = JSON.parse(stored);
      // Убеждаемся, что есть все необходимые поля
      return {
        currentIndex: progress.currentIndex || 0,
        viewMode: progress.viewMode || 'original',
        lastRead: progress.lastRead || Date.now(),
        totalRead: progress.totalRead || 0,
        readFragments: progress.readFragments || [],
        likes: progress.likes || []
      };
    }
    
    // Возвращаем начальное состояние
    return {
      currentIndex: 0,
      viewMode: 'original',
      lastRead: Date.now(),
      totalRead: 0,
      readFragments: [],
      likes: []
    };
  }

  // Сохранить прогресс пользователя
  saveUserProgress(userKey, progress) {
    const key = this.USER_PROGRESS_KEY + userKey;
    localStorage.setItem(key, JSON.stringify({
      ...progress,
      lastRead: Date.now()
    }));
  }

  // Получить количество глобальных лайков для фрагмента
  getGlobalLikes(fragmentId) {
    const globalLikes = JSON.parse(localStorage.getItem(this.GLOBAL_LIKES_KEY) || '{}');
    return globalLikes[fragmentId] || 0;
  }

  // Обновить глобальные лайки
  updateGlobalLikes(fragmentId, increment) {
    const globalLikes = JSON.parse(localStorage.getItem(this.GLOBAL_LIKES_KEY) || '{}');
    const currentCount = globalLikes[fragmentId] || 0;
    const newCount = Math.max(0, currentCount + increment);
    
    if (newCount === 0) {
      delete globalLikes[fragmentId];
    } else {
      globalLikes[fragmentId] = newCount;
    }
    
    localStorage.setItem(this.GLOBAL_LIKES_KEY, JSON.stringify(globalLikes));
    return newCount;
  }

  // Переключить лайк пользователя
  toggleUserLike(userKey, fragmentId) {
    const progress = this.getUserProgress(userKey);
    const likes = progress.likes || [];
    const isLiked = likes.includes(fragmentId);
    
    let newLikes;
    let globalIncrement;
    
    if (isLiked) {
      // Убираем лайк
      newLikes = likes.filter(id => id !== fragmentId);
      globalIncrement = -1;
    } else {
      // Добавляем лайк
      newLikes = [...likes, fragmentId];
      globalIncrement = 1;
    }
    
    // Обновляем прогресс пользователя
    this.saveUserProgress(userKey, {
      ...progress,
      likes: newLikes
    });
    
    // Обновляем глобальные лайки
    const newGlobalCount = this.updateGlobalLikes(fragmentId, globalIncrement);
    
    return {
      isLiked: !isLiked,
      userLikesCount: newLikes.length,
      globalLikesCount: newGlobalCount
    };
  }

  // Получить топ лайкнутых фрагментов
  getTopLiked(limit = 10) {
    const globalLikes = JSON.parse(localStorage.getItem(this.GLOBAL_LIKES_KEY) || '{}');
    
    return Object.entries(globalLikes)
      .map(([fragmentId, count]) => ({
        fragmentId: parseInt(fragmentId),
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // Получить статистику
  getStats(userKey) {
    const progress = this.getUserProgress(userKey);
    const globalLikes = JSON.parse(localStorage.getItem(this.GLOBAL_LIKES_KEY) || '{}');
    
    return {
      userStats: {
        totalRead: progress.totalRead,
        totalLiked: progress.likes.length,
        lastRead: new Date(progress.lastRead).toLocaleDateString()
      },
      globalStats: {
        totalLikes: Object.values(globalLikes).reduce((sum, count) => sum + count, 0),
        totalLikedFragments: Object.keys(globalLikes).length
      }
    };
  }

  // Очистить все данные пользователя
  clearUserData(userKey) {
    const key = this.USER_PROGRESS_KEY + userKey;
    localStorage.removeItem(key);
  }

  // Сбросить глобальные лайки (для тестирования)
  resetGlobalLikes() {
    localStorage.removeItem(this.GLOBAL_LIKES_KEY);
    this.initializeSimulatedLikes();
  }
}

// Создаем единственный экземпляр
export const enhancedLocalStorage = new EnhancedLocalStorage();