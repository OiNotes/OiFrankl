import { createClient } from '@supabase/supabase-js';

// Получаем переменные окружения
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Проверяем наличие переменных
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

// Создаем клиент только если есть конфигурация
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Флаг для проверки в компонентах
export const useSupabase = isSupabaseConfigured;

// Вспомогательные функции для миграции
export const migrateUserToSupabase = async (userKey) => {
  if (!supabase) return null;
  
  try {
    // Проверяем, существует ли пользователь
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('user_key', userKey)
      .single();
    
    if (existingUser) return existingUser.id;
    
    // Создаем нового пользователя
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ user_key: userKey })
      .select('id')
      .single();
    
    if (error) throw error;
    return newUser.id;
  } catch (error) {
    console.error('Error migrating user:', error);
    return null;
  }
};

// Обертка для постепенной миграции
export const supabaseWrapper = {
  // Метод для проверки доступности
  isAvailable: () => !!supabase,
  
  // Методы для работы с данными
  async saveProgress(userId, progress) {
    if (!supabase) return false;
    
    try {
      const { error } = await supabase
        .from('reading_progress')
        .upsert({
          user_id: userId,
          current_index: progress.currentIndex,
          view_mode: progress.viewMode,
          total_read: progress.totalRead,
          read_fragments: progress.readFragments || [],
          last_read: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      return !error;
    } catch (error) {
      console.error('Error saving progress:', error);
      return false;
    }
  },
  
  async getProgress(userId) {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting progress:', error);
      return null;
    }
  }
};