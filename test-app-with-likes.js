import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nfayxrcrzsdxlwpumnwb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mYXl4cmNyenNkeGx3cHVtbndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDkyMDUsImV4cCI6MjA2OTE4NTIwNX0.ThWlkSh69luGZPLg_y9FOzc56qp3tvhHB8lUWhmeKvI';

async function testAppWithLikes() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Логируем консоль
  page.on('console', msg => {
    if (!msg.text().includes('[vite]') && !msg.text().includes('Download the React')) {
      console.log(`[BROWSER] ${msg.text()}`);
    }
  });
  
  console.log('🚀 Открываем приложение...');
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);
  
  // Если есть экран приветствия, начинаем
  const welcomeButton = page.locator('button:has-text("Начать чтение")');
  if (await welcomeButton.isVisible()) {
    console.log('📱 Начинаем чтение...');
    await welcomeButton.click();
    await page.waitForTimeout(2000);
  }
  
  // Получаем userKey из консоли или localStorage
  const userKey = await page.evaluate(() => {
    return localStorage.getItem('frankl_user_key');
  });
  console.log('🔑 User key:', userKey);
  
  // Проверяем userId в Supabase
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('user_key', userKey)
    .single();
  
  if (user) {
    console.log('👤 User ID в Supabase:', user.id);
  } else {
    console.log('❌ Пользователь не найден в Supabase');
  }
  
  // Добавляем несколько лайков
  console.log('\n💖 Добавляем лайки...');
  
  for (let i = 0; i < 5; i++) {
    // Проверяем текущий фрагмент
    const fragmentInfo = await page.locator('.text-xs.uppercase').first().textContent().catch(() => '');
    console.log(`\n📄 Фрагмент ${i + 1}: ${fragmentInfo}`);
    
    // Кликаем лайк
    const likeButton = page.locator('button svg[width="24"]').first();
    if (await likeButton.isVisible()) {
      // Проверяем счетчик до клика
      const countBefore = await page.locator('button span.text-sm').textContent().catch(() => '0');
      
      await likeButton.click();
      await page.waitForTimeout(1000);
      
      // Проверяем счетчик после клика
      const countAfter = await page.locator('button span.text-sm').textContent().catch(() => '0');
      console.log(`   Лайков: ${countBefore || '0'} → ${countAfter || '0'}`);
      
      // Проверяем заливку иконки
      const isFilled = await page.locator('button svg[fill="currentColor"]').count() > 0;
      console.log(`   Иконка залита: ${isFilled}`);
    }
    
    // Свайпаем к следующему
    if (i < 4) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(1000);
    }
  }
  
  // Проверяем избранное
  console.log('\n⭐ Проверяем избранное...');
  await page.locator('button:has-text("•••")').click();
  await page.waitForTimeout(500);
  await page.locator('button:has-text("Избранное")').click();
  await page.waitForTimeout(1000);
  
  const likedCount = await page.locator('.space-y-4 > div').count();
  console.log(`📚 Элементов в избранном: ${likedCount}`);
  
  // Делаем скриншот избранного
  await page.screenshot({ path: 'favorites-screen.png', fullPage: true });
  
  // Закрываем избранное
  await page.locator('button:has-text("✕")').click();
  await page.waitForTimeout(500);
  
  // Проверяем лайки в базе данных
  console.log('\n🔍 Проверяем лайки в базе данных...');
  if (user) {
    const { data: userLikes } = await supabase
      .from('user_likes')
      .select('*')
      .eq('user_id', user.id);
    
    console.log(`📊 Лайков пользователя в БД: ${userLikes?.length || 0}`);
    if (userLikes && userLikes.length > 0) {
      console.log('Фрагменты:', userLikes.map(l => l.fragment_id).join(', '));
    }
  }
  
  await page.waitForTimeout(3000);
  await browser.close();
  console.log('\n✨ Тест завершен!');
}

testAppWithLikes().catch(console.error);