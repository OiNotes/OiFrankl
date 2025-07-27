import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nfayxrcrzsdxlwpumnwb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mYXl4cmNyenNkeGx3cHVtbndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDkyMDUsImV4cCI6MjA2OTE4NTIwNX0.ThWlkSh69luGZPLg_y9FOzc56qp3tvhHB8lUWhmeKvI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLikes() {
  console.log('🔍 Проверяем лайки в базе данных...\n');
  
  // Проверяем user_likes
  console.log('📋 Таблица user_likes:');
  const { data: userLikes, error: userLikesError } = await supabase
    .from('user_likes')
    .select('*')
    .order('fragment_id');
  
  if (userLikesError) {
    console.error('❌ Ошибка:', userLikesError);
  } else {
    console.log(`Всего записей: ${userLikes.length}`);
    
    // Группируем по fragment_id
    const likesCount = {};
    userLikes.forEach(like => {
      likesCount[like.fragment_id] = (likesCount[like.fragment_id] || 0) + 1;
    });
    
    console.log('\nЛайки по фрагментам:');
    Object.entries(likesCount).sort((a, b) => a[0] - b[0]).forEach(([fragmentId, count]) => {
      console.log(`   Фрагмент ${fragmentId}: ${count} лайков`);
    });
    
    if (userLikes.length > 0) {
      console.log('\nПримеры записей:');
      userLikes.slice(0, 5).forEach(like => {
        console.log(`   - user_id: ${like.user_id}, fragment_id: ${like.fragment_id}`);
      });
    }
  }
  
  // Проверяем global_likes
  console.log('\n📋 Таблица global_likes:');
  const { data: globalLikes, error: globalLikesError } = await supabase
    .from('global_likes')
    .select('*')
    .order('fragment_id')
    .limit(10);
  
  if (globalLikesError) {
    console.error('❌ Ошибка:', globalLikesError);
  } else if (globalLikes) {
    console.log(`Найдено записей: ${globalLikes.length}`);
    globalLikes.forEach(item => {
      console.log(`   Фрагмент ${item.fragment_id}: ${item.count} лайков`);
    });
  }
  
  // Проверяем пользователей
  console.log('\n👥 Пользователи:');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (usersError) {
    console.error('❌ Ошибка:', usersError);
  } else {
    console.log(`Всего пользователей: ${users.length}`);
    users.forEach(user => {
      console.log(`   - ${user.user_key} (id: ${user.id})`);
    });
  }
}

checkLikes();