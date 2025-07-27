import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nfayxrcrzsdxlwpumnwb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mYXl4cmNyenNkeGx3cHVtbndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDkyMDUsImV4cCI6MjA2OTE4NTIwNX0.ThWlkSh69luGZPLg_y9FOzc56qp3tvhHB8lUWhmeKvI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addTestLikes() {
  console.log('🚀 Добавляем тестовые лайки...\n');
  
  // Получаем существующих пользователей
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(2);
  
  if (usersError || !users || users.length === 0) {
    console.error('❌ Не могу получить пользователей:', usersError);
    return;
  }
  
  console.log('👥 Найдено пользователей:', users.length);
  console.log('Пользователи:', users.map(u => u.user_key).join(', '));
  
  // Создаем тестовые лайки для фрагментов 1-10
  const testLikes = [
    { fragment_id: 1, likes: 5 },   // 5 лайков
    { fragment_id: 2, likes: 7 },   // 7 лайков
    { fragment_id: 3, likes: 3 },   // 3 лайка
    { fragment_id: 5, likes: 9 },   // 9 лайков
    { fragment_id: 7, likes: 4 },   // 4 лайка
    { fragment_id: 9, likes: 6 },   // 6 лайков
  ];
  
  // Сначала очищаем старые лайки
  console.log('\n🗑️  Очищаем старые лайки...');
  const { error: deleteError } = await supabase
    .from('user_likes')
    .delete()
    .in('fragment_id', testLikes.map(t => t.fragment_id));
  
  if (deleteError) {
    console.error('❌ Ошибка при очистке:', deleteError);
  }
  
  // Добавляем новые лайки
  console.log('\n➕ Добавляем новые лайки...');
  
  // Создаем дополнительных пользователей если нужно
  const neededUsers = Math.max(...testLikes.map(t => t.likes));
  while (users.length < neededUsers) {
    const newKey = `TEST-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ user_key: newKey })
      .select()
      .single();
    
    if (newUser) {
      users.push(newUser);
      console.log(`👤 Создан пользователь: ${newKey}`);
    } else if (error) {
      console.error('❌ Ошибка создания пользователя:', error);
      break;
    }
  }
  
  // Добавляем лайки для каждого фрагмента
  for (const testLike of testLikes) {
    console.log(`\n📝 Обрабатываем фрагмент ${testLike.fragment_id}...`);
    
    // Добавляем лайки от разных пользователей
    for (let i = 0; i < testLike.likes && i < users.length; i++) {
      const { error } = await supabase
        .from('user_likes')
        .insert({
          user_id: users[i].id,
          fragment_id: testLike.fragment_id
        });
      
      if (error) {
        console.error(`   ❌ Ошибка от пользователя ${users[i].user_key}:`, error.message);
      } else {
        console.log(`   ✅ Лайк от ${users[i].user_key}`);
      }
    }
  }
  
  // Проверяем результат
  console.log('\n📊 Проверяем результат...');
  for (const testLike of testLikes) {
    const { count, error } = await supabase
      .from('user_likes')
      .select('*', { count: 'exact', head: true })
      .eq('fragment_id', testLike.fragment_id);
    
    if (!error) {
      console.log(`   Фрагмент ${testLike.fragment_id}: ${count} лайков (ожидалось ${testLike.likes})`);
    }
  }
  
  console.log('\n✨ Готово! Перезагрузите приложение, чтобы увидеть лайки.');
}

addTestLikes();