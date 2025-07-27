import { supabase } from '../config/supabase';

// Сервис для миграции данных из localStorage в Supabase
export const migrationService = {
  // Проверка, нужна ли миграция
  async checkMigrationNeeded(userKey) {
    const localData = localStorage.getItem(`frankl_${userKey}`);
    const migrationKey = `frankl_migrated_${userKey}`;
    const isMigrated = localStorage.getItem(migrationKey);
    
    return localData && !isMigrated;
  },

  // Миграция данных пользователя
  async migrateUserData(userKey, userId) {
    if (!supabase || !userId) {
      console.log('Skipping migration: Supabase not configured or no userId');
      return false;
    }

    try {
      // Получаем локальные данные
      const localProgress = JSON.parse(localStorage.getItem(`frankl_${userKey}`) || '{}');
      // Берем лайки из прогресса, а не из отдельного ключа
      const localLikes = localProgress.likes || [];
      
      // Мигрируем прогресс чтения
      if (localProgress.currentIndex !== undefined) {
        const { error: progressError } = await supabase
          .from('reading_progress')
          .upsert({
            user_id: userId,
            current_index: localProgress.currentIndex || 0,
            view_mode: localProgress.viewMode || 'original',
            total_read: localProgress.totalRead || 0,
            read_fragments: localProgress.readFragments || [],
            last_read: new Date(localProgress.lastRead || Date.now()).toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (progressError) {
          console.error('Failed to migrate progress:', progressError);
          throw progressError;
        }
      }

      // Мигрируем лайки пользователя
      if (localLikes.length > 0) {
        console.log('Migrating user likes:', localLikes.length, 'likes for user:', userId);
        
        // Сначала удаляем существующие лайки (на случай повторной миграции)
        await supabase
          .from('user_likes')
          .delete()
          .eq('user_id', userId);

        // Добавляем новые лайки, фильтруя только валидные ID
        const likesToInsert = localLikes
          .filter(fragmentId => fragmentId && fragmentId > 0)
          .map(fragmentId => ({
            user_id: userId,
            fragment_id: fragmentId
          }));

        if (likesToInsert.length > 0) {
          const { error: likesError } = await supabase
            .from('user_likes')
            .insert(likesToInsert);

          if (likesError) {
            console.error('Failed to migrate likes:', likesError);
            throw likesError;
          }
        }
      }

      // Мигрируем глобальные лайки (если это первый пользователь)
      await this.migrateGlobalLikes();

      // Отмечаем, что миграция выполнена
      localStorage.setItem(`frankl_migrated_${userKey}`, 'true');
      
      console.log('Migration completed successfully');
      return true;
    } catch (error) {
      console.error('Migration failed:', error);
      return false;
    }
  },

  // Миграция глобальных лайков
  async migrateGlobalLikes() {
    try {
      const localGlobalLikes = JSON.parse(localStorage.getItem('frankl_global_likes') || '{}');
      
      if (Object.keys(localGlobalLikes).length === 0) {
        return;
      }

      // Получаем существующие глобальные лайки
      const { data: existingLikes } = await supabase
        .from('global_likes')
        .select('fragment_id, count');

      const existingMap = new Map(
        (existingLikes || []).map(item => [item.fragment_id, item.count])
      );

      // Подготавливаем данные для upsert
      const likesToUpsert = Object.entries(localGlobalLikes)
        .map(([fragmentId, localCount]) => {
          const existingCount = existingMap.get(parseInt(fragmentId)) || 0;
          // Берем максимальное значение между локальным и существующим
          return {
            fragment_id: parseInt(fragmentId),
            count: Math.max(localCount, existingCount)
          };
        })
        .filter(item => item.count > 0);

      if (likesToUpsert.length > 0) {
        const { error } = await supabase
          .from('global_likes')
          .upsert(likesToUpsert, {
            onConflict: 'fragment_id'
          });

        if (error) {
          console.error('Failed to migrate global likes:', error);
        }
      }
    } catch (error) {
      console.error('Failed to migrate global likes:', error);
    }
  },

  // Очистка локальных данных после успешной миграции (опционально)
  clearLocalData(userKey) {
    // Сохраняем флаг миграции
    const migrationFlag = localStorage.getItem(`frankl_migrated_${userKey}`);
    
    // Удаляем старые данные
    localStorage.removeItem(`frankl_${userKey}`);
    localStorage.removeItem(`frankl_user_likes_${userKey}`);
    
    // Восстанавливаем флаг миграции
    if (migrationFlag) {
      localStorage.setItem(`frankl_migrated_${userKey}`, migrationFlag);
    }
  },

  // Проверка состояния миграции
  getMigrationStatus(userKey) {
    const isMigrated = localStorage.getItem(`frankl_migrated_${userKey}`) === 'true';
    const hasLocalData = !!localStorage.getItem(`frankl_${userKey}`);
    
    return {
      isMigrated,
      hasLocalData,
      needsMigration: hasLocalData && !isMigrated
    };
  }
};