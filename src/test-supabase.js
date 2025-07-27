import { createClient } from '@supabase/supabase-js';

// Тестовый файл для проверки подключения к Supabase
const supabaseUrl = 'https://nfayxrcrzsdxlwpumnwb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mYXl4cmNyenNkeGx3cHVtbndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDkyMDUsImV4cCI6MjA2OTE4NTIwNX0.ThWlkSh69luGZPLg_y9FOzc56qp3tvhHB8lUWhmeKvI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Тест 1: Проверка таблицы users
async function testUsers() {
  console.log('\n=== Тест таблицы users ===');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('Ошибка при чтении users:', error);
    } else {
      console.log('Успешно! Найдено записей:', data.length);
      console.log('Примеры данных:', data);
    }
  } catch (e) {
    console.error('Критическая ошибка:', e);
  }
}

// Тест 2: Проверка таблицы user_likes
async function testUserLikes() {
  console.log('\n=== Тест таблицы user_likes ===');
  
  try {
    const { data, error } = await supabase
      .from('user_likes')
      .select('fragment_id')
      .limit(10);
    
    if (error) {
      console.error('Ошибка при чтении user_likes:', error);
    } else {
      console.log('Успешно! Найдено лайков:', data.length);
      console.log('Примеры данных:', data);
    }
  } catch (e) {
    console.error('Критическая ошибка:', e);
  }
}

// Тест 3: Проверка подсчета лайков для конкретного фрагмента
async function testFragmentLikes(fragmentId) {
  console.log(`\n=== Тест подсчета лайков для фрагмента ${fragmentId} ===`);
  
  try {
    const { count, error } = await supabase
      .from('user_likes')
      .select('*', { count: 'exact', head: true })
      .eq('fragment_id', fragmentId);
    
    if (error) {
      console.error('Ошибка при подсчете лайков:', error);
    } else {
      console.log(`Фрагмент ${fragmentId} имеет ${count} лайков`);
    }
  } catch (e) {
    console.error('Критическая ошибка:', e);
  }
}

// Запускаем тесты
async function runTests() {
  console.log('Начинаем тестирование Supabase...');
  console.log('URL:', supabaseUrl);
  console.log('Key (первые 20 символов):', supabaseAnonKey.substring(0, 20) + '...');
  
  await testUsers();
  await testUserLikes();
  
  // Тестируем несколько фрагментов
  for (let i = 1; i <= 10; i++) {
    await testFragmentLikes(i);
  }
}

// Запускаем тесты при загрузке модуля
runTests();