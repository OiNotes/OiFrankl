import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nfayxrcrzsdxlwpumnwb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mYXl4cmNyenNkeGx3cHVtbndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDkyMDUsImV4cCI6MjA2OTE4NTIwNX0.ThWlkSh69luGZPLg_y9FOzc56qp3tvhHB8lUWhmeKvI';

async function testSupabase() {
  console.log('🔌 Тестируем подключение к Supabase...\n');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Тест 1: Проверяем таблицу users
  console.log('📋 Проверяем таблицу users...');
  try {
    const { data, error, status } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Ошибка:', error.message);
      console.error('Status:', status);
      console.error('Details:', error);
    } else {
      console.log('✅ Успешно! Найдено пользователей:', data.length);
      if (data.length > 0) {
        console.log('Примеры:', data);
      }
    }
  } catch (e) {
    console.error('💥 Критическая ошибка:', e);
  }
  
  // Тест 2: Проверяем таблицу user_likes
  console.log('\n📋 Проверяем таблицу user_likes...');
  try {
    const { data, error, count } = await supabase
      .from('user_likes')
      .select('*', { count: 'exact' })
      .limit(10);
    
    if (error) {
      console.error('❌ Ошибка:', error.message);
    } else {
      console.log('✅ Успешно! Всего лайков в базе:', count);
      if (data.length > 0) {
        console.log('Примеры:', data);
      }
    }
  } catch (e) {
    console.error('💥 Критическая ошибка:', e);
  }
  
  // Тест 3: Проверяем количество лайков для конкретных фрагментов
  console.log('\n📊 Проверяем лайки для фрагментов 1-10...');
  for (let i = 1; i <= 10; i++) {
    try {
      const { count, error } = await supabase
        .from('user_likes')
        .select('*', { count: 'exact', head: true })
        .eq('fragment_id', i);
      
      if (!error && count > 0) {
        console.log(`   Фрагмент ${i}: ${count} лайков`);
      }
    } catch (e) {
      console.error(`❌ Ошибка для фрагмента ${i}:`, e.message);
    }
  }
  
  // Тест 4: Пробуем создать тестового пользователя
  console.log('\n👤 Пробуем создать тестового пользователя...');
  const testKey = 'TEST-' + Date.now();
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({ user_key: testKey })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Ошибка создания:', error.message);
      console.error('Details:', error);
    } else {
      console.log('✅ Пользователь создан:', data);
      
      // Удаляем тестового пользователя
      await supabase
        .from('users')
        .delete()
        .eq('id', data.id);
      console.log('🗑️  Тестовый пользователь удален');
    }
  } catch (e) {
    console.error('💥 Критическая ошибка:', e);
  }
}

testSupabase();