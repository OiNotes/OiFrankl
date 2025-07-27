import { createClient } from '@supabase/supabase-js';

// Получаем переменные окружения
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Проверяем наличие переменных
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

console.log('[Supabase Config] URL:', supabaseUrl ? 'present' : 'missing');
console.log('[Supabase Config] Anon Key:', supabaseAnonKey ? 'present' : 'missing');
console.log('[Supabase Config] Configured:', isSupabaseConfigured);

// Создаем клиент только если есть конфигурация
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Флаг для проверки в компонентах
export const useSupabase = isSupabaseConfigured;

// Вспомогательные функции для миграции
export const migrateUserToSupabase = async (userKey) => {
  if (!supabase) {
    console.log('[migrateUserToSupabase] No Supabase client');
    return null;
  }
  
  console.log('[migrateUserToSupabase] Checking/creating user for key:', userKey);
  
  try {
    // Проверяем, существует ли пользователь
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('id')
      .eq('user_key', userKey)
      .single();
    
    if (existingUser) {
      console.log('[migrateUserToSupabase] Found existing user:', existingUser.id);
      return existingUser.id;
    }
    
    // Если ошибка не "PGRST116" (not found), то это реальная ошибка
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('[migrateUserToSupabase] Error selecting user:', selectError);
      throw selectError;
    }
    
    // Создаем нового пользователя
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({ user_key: userKey })
      .select('id')
      .single();
    
    if (insertError) {
      console.error('[migrateUserToSupabase] Error creating user:', insertError);
      throw insertError;
    }
    
    console.log('[migrateUserToSupabase] Created new user:', newUser.id);
    return newUser.id;
  } catch (error) {
    console.error('[migrateUserToSupabase] Error migrating user:', error);
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