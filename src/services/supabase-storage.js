import { supabase, migrateUserToSupabase } from '../config/supabase';
import { storage as localStorageService } from '../utils/storage';

// Класс для управления хранилищем с Supabase и localStorage fallback
class SupabaseStorage {
  constructor() {
    this.userId = null;
    this.syncInProgress = false;
    this.offlineQueue = [];
    this.isOnline = navigator.onLine;
    
    // Слушаем изменения состояния сети
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  async init(userKey) {
    this.userKey = userKey;
    
    // Пытаемся мигрировать пользователя в Supabase
    if (supabase && this.isOnline) {
      try {
        this.userId = await migrateUserToSupabase(userKey);
      } catch (error) {
        console.error('Failed to migrate user to Supabase:', error);
      }
    }
  }

  // Обработка восстановления соединения
  async handleOnline() {
    this.isOnline = true;
    // Синхронизируем данные из очереди
    await this.processSyncQueue();
  }

  // Обработка потери соединения
  handleOffline() {
    this.isOnline = false;
  }

  // Обработка очереди синхронизации
  async processSyncQueue() {
    if (!this.isOnline || !supabase || this.syncInProgress) return;
    
    this.syncInProgress = true;
    
    while (this.offlineQueue.length > 0) {
      const operation = this.offlineQueue.shift();
      try {
        await operation();
      } catch (error) {
        console.error('Failed to sync operation:', error);
        // Возвращаем операцию в очередь
        this.offlineQueue.unshift(operation);
        break;
      }
    }
    
    this.syncInProgress = false;
  }

  // Получение прогресса с fallback
  async getProgress(userKey) {
    // Сначала загружаем локальные данные для быстрого отклика
    const localProgress = localStorageService.getProgress(userKey);
    
    // Если есть Supabase и соединение, пытаемся получить свежие данные
    if (supabase && this.isOnline && this.userId) {
      try {
        const { data, error } = await supabase
          .from('reading_progress')
          .select('*')
          .eq('user_id', this.userId)
          .single();
        
        if (!error && data) {
          // Конвертируем формат из БД в локальный формат
          const remoteProgress = {
            currentIndex: data.current_index,
            viewMode: data.view_mode,
            lastRead: new Date(data.last_read).getTime(),
            totalRead: data.total_read,
            readFragments: data.read_fragments || [],
            likes: await this.getUserLikes() // Получаем лайки отдельно из Supabase
          };
          
          // Сохраняем в localStorage для кеширования
          localStorageService.saveProgress(userKey, remoteProgress);
          return remoteProgress;
        } else {
          // Если пользователь новый в Supabase, создаем чистый прогресс
          console.log('No data in Supabase for user, creating fresh progress');
          const freshProgress = {
            ...localProgress,
            likes: [] // Очищаем старые локальные лайки
          };
          
          // Сохраняем чистый прогресс
          localStorageService.saveProgress(userKey, freshProgress);
          return freshProgress;
        }
      } catch (error) {
        console.error('Failed to fetch progress from Supabase:', error);
      }
    }
    
    // Для оффлайн режима очищаем лайки из старых данных
    return {
      ...localProgress,
      likes: [] // Не загружаем старые локальные лайки
    };
  }

  // Сохранение прогресса с retry логикой
  async saveProgress(userKey, progress, retryCount = 0) {
    // Всегда сохраняем локально
    localStorageService.saveProgress(userKey, progress);
    
    // Пытаемся сохранить в Supabase
    if (supabase && this.userId) {
      const saveOperation = async () => {
        const { error } = await supabase
          .from('reading_progress')
          .upsert({
            user_id: this.userId,
            current_index: progress.currentIndex,
            view_mode: progress.viewMode,
            total_read: progress.totalRead,
            read_fragments: progress.readFragments || [],
            last_read: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });
        
        if (error) throw error;
      };

      if (this.isOnline) {
        try {
          await saveOperation();
        } catch (error) {
          console.error('Failed to save progress to Supabase:', error);
          
          // Retry логика
          if (retryCount < 3) {
            setTimeout(() => {
              this.saveProgress(userKey, progress, retryCount + 1);
            }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
          } else {
            // Добавляем в очередь для синхронизации позже
            this.offlineQueue.push(saveOperation);
          }
        }
      } else {
        // Если offline, добавляем в очередь
        this.offlineQueue.push(saveOperation);
      }
    }
  }

  // Получение лайков пользователя
  async getUserLikes() {
    if (!supabase || !this.userId) return [];
    
    try {
      const { data, error } = await supabase
        .from('user_likes')
        .select('fragment_id')
        .eq('user_id', this.userId);
      
      if (!error && data) {
        console.log('Fetched user likes from Supabase:', data.length, 'likes for user:', this.userId);
        
        // Импортируем contentFull для конвертации globalId в id
        const { contentFull } = await import('../data/contentFull');
        
        // Конвертируем fragment_id (globalId) в локальные id
        const localIds = data.map(item => {
          const fragment = contentFull.find(f => f.globalId === item.fragment_id);
          return fragment ? fragment.id : null;
        }).filter(id => id !== null);
        
        console.log('Converted to local IDs:', localIds);
        return localIds;
      } else {
        console.log('No user likes found in Supabase for user:', this.userId);
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch user likes:', error);
    }
    
    return [];
  }

  // Переключение лайка с синхронизацией
  async toggleLike(fragmentId) {
    const likes = await this.getUserLikes();
    const isLiked = likes.includes(fragmentId);
    
    if (!supabase || !this.userId) {
      // Если нет Supabase, работаем только локально
      return;
    }
    
    // Получаем globalId для сохранения в Supabase
    const { contentFull } = await import('../data/contentFull');
    const fragment = contentFull.find(f => f.id === fragmentId);
    if (!fragment || !fragment.globalId) {
      console.error('Fragment not found or has no globalId:', fragmentId);
      return;
    }
    
    const globalId = fragment.globalId;
    
    const toggleOperation = async () => {
      if (isLiked) {
        const { error } = await supabase
          .from('user_likes')
          .delete()
          .eq('user_id', this.userId)
          .eq('fragment_id', globalId); // Используем globalId
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_likes')
          .insert({
            user_id: this.userId,
            fragment_id: globalId // Используем globalId
          });
        
        if (error) throw error;
      }
    };

    if (this.isOnline) {
      try {
        await toggleOperation();
      } catch (error) {
        console.error('Failed to toggle like:', error);
        this.offlineQueue.push(toggleOperation);
      }
    } else {
      this.offlineQueue.push(toggleOperation);
    }
  }

  // Получение состояния синхронизации
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      hasPendingSync: this.offlineQueue.length > 0,
      syncInProgress: this.syncInProgress
    };
  }
}

// Создаем единственный экземпляр
export const supabaseStorage = new SupabaseStorage();