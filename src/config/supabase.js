import { createClient } from '@supabase/supabase-js';

// Получаем переменные окружения
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Очищаем ключ от возможных лишних символов
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const useLocalStorage = import.meta.env.VITE_USE_LOCAL_STORAGE === 'true';

// Debug logging for production
console.log('[Supabase Config] Environment Debug:');
console.log('  Mode:', import.meta.env.MODE);
console.log('  Is Production:', import.meta.env.PROD);
console.log('  VITE_SUPABASE_URL:', supabaseUrl ? `${supabaseUrl}` : '❌ NOT SET');
console.log('  VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 30)}...` : '❌ NOT SET');
console.log('  VITE_USE_LOCAL_STORAGE:', import.meta.env.VITE_USE_LOCAL_STORAGE || '❌ NOT SET');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ КРИТИЧЕСКАЯ ОШИБКА: Переменные окружения Supabase не установлены!');
  console.error('📝 Инструкция по исправлению:');
  console.error('1. Откройте Vercel Dashboard: https://vercel.com/dashboard');
  console.error('2. Выберите проект → Settings → Environment Variables');
  console.error('3. Добавьте следующие переменные:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - VITE_SUPABASE_ANON_KEY');
  console.error('   - VITE_USE_LOCAL_STORAGE (значение: false)');
  console.error('4. Передеплойте проект');
}

// Проверяем наличие переменных и режим работы
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && !useLocalStorage;

if (useLocalStorage) {
  console.log('[Storage] Используется локальное хранилище');
} else {
  console.log('[Supabase Config] URL:', supabaseUrl ? 'present' : 'missing');
  console.log('[Supabase Config] Anon Key:', supabaseAnonKey ? 'present' : 'missing');
  console.log('[Supabase Config] Configured:', !!isSupabaseConfigured);
}

// Создаем клиент только если есть конфигурация
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Тестовый запрос для проверки подключения
if (supabase && import.meta.env.PROD) {
  console.log('[Supabase] Testing connection...');
  supabase
    .from('users')
    .select('count', { count: 'exact', head: true })
    .then(({ count, error }) => {
      if (error) {
        console.error('[Supabase] Connection test failed:', error);
      } else {
        console.log('[Supabase] Connection test successful! Users count:', count);
      }
    });
}

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
    console.log('[migrateUserToSupabase] Attempting to select user with key:', userKey);
    const { data: existingUser, error: selectError, status, statusText } = await supabase
      .from('users')
      .select('id')
      .eq('user_key', userKey)
      .maybeSingle(); // Используем maybeSingle вместо single
    
    console.log('[migrateUserToSupabase] Response:', {
      status,
      statusText,
      data: existingUser,
      error: selectError
    });
    
    if (existingUser) {
      console.log('[migrateUserToSupabase] Found existing user:', existingUser.id);
      return existingUser.id;
    }
    
    // Если есть ошибка, но это не ошибка "не найдено", выбрасываем её
    if (selectError) {
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