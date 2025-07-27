import { chromium } from '@playwright/test';

async function testLikesSync() {
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--window-size=400,800']
  });
  const page = await browser.newPage({ viewport: { width: 400, height: 800 } });
  
  console.log('🔍 Тест синхронизации лайков и избранного\n');
  
  // Минимальный лог
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('likes') || text.includes('Liked') || text.includes('toggle')) {
      console.log(`[LOG] ${text}`);
    }
  });
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);
  
  // Начинаем чтение
  await page.click('button:has-text("Начать")');
  await page.waitForTimeout(1000);
  await page.locator('button').filter({ hasText: 'чтение' }).click();
  await page.waitForTimeout(2000);
  
  console.log('📱 Приложение открыто\n');
  
  // 1. Проверяем начальное состояние
  console.log('1️⃣ Проверяем начальное состояние');
  
  // Счетчик в правом верхнем углу
  const initialBadge = await page.locator('.absolute.-top-1.-right-1').textContent().catch(() => '0');
  console.log(`   Счетчик избранного: ${initialBadge}`);
  
  // 2. Добавляем лайки
  console.log('\n2️⃣ Добавляем лайки к 3 фрагментам');
  
  for (let i = 0; i < 3; i++) {
    const fragmentText = await page.locator('.text-content').textContent();
    const fragmentNum = await page.locator('text=/Фрагмент \\d+/').textContent();
    
    console.log(`\n   ${fragmentNum}:`);
    console.log(`   Текст: "${fragmentText.substring(0, 40)}..."`);
    
    // Кликаем лайк
    await page.locator('button').filter({ has: page.locator('svg[width="24"]') }).click();
    await page.waitForTimeout(500);
    
    // Проверяем что лайк поставился
    const isLiked = await page.locator('svg[fill="currentColor"]').count() > 0;
    console.log(`   ✅ Лайк поставлен: ${isLiked}`);
    
    // Переходим к следующему
    if (i < 2) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(1000);
    }
  }
  
  // 3. Проверяем счетчик избранного
  console.log('\n3️⃣ Проверяем обновление счетчика');
  const updatedBadge = await page.locator('.absolute.-top-1.-right-1').textContent().catch(() => '0');
  console.log(`   Счетчик избранного: ${updatedBadge} (должно быть 3)`);
  
  // 4. Открываем избранное
  console.log('\n4️⃣ Открываем избранное');
  await page.locator('button').filter({ has: page.locator('svg[width="20"]') }).first().click();
  await page.waitForTimeout(1000);
  
  // Считаем элементы
  const favoritesCount = await page.locator('.space-y-4 > div').count();
  console.log(`   Элементов в избранном: ${favoritesCount}`);
  
  // Выводим тексты из избранного
  if (favoritesCount > 0) {
    console.log('\n   Тексты в избранном:');
    for (let i = 0; i < favoritesCount; i++) {
      const text = await page.locator('.space-y-4 > div').nth(i).locator('.font-serif').textContent();
      console.log(`   ${i + 1}. "${text.substring(0, 50)}..."`);
    }
  }
  
  // 5. Проверяем localStorage
  console.log('\n5️⃣ Проверяем данные в localStorage');
  const storageData = await page.evaluate(() => {
    const userKey = localStorage.getItem('frankl_user_key');
    const progressKey = `frankl_user_progress_${userKey}`;
    const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
    
    return {
      userKey,
      userLikes: progress.likes || [],
      currentIndex: progress.currentIndex,
      totalRead: progress.totalRead
    };
  });
  
  console.log(`   Ключ пользователя: ${storageData.userKey}`);
  console.log(`   Лайкнутые фрагменты: [${storageData.userLikes.join(', ')}]`);
  console.log(`   Текущий индекс: ${storageData.currentIndex}`);
  
  // 6. Закрываем и снова открываем избранное
  console.log('\n6️⃣ Проверяем персистентность');
  
  // Закрываем избранное
  await page.locator('button').filter({ has: page.locator('path[d*="M15 5L5 15"]') }).click();
  await page.waitForTimeout(500);
  
  // Перезагружаем страницу
  await page.reload();
  await page.waitForTimeout(2000);
  
  // Снова открываем избранное
  await page.locator('button').filter({ has: page.locator('svg[width="20"]') }).first().click();
  await page.waitForTimeout(1000);
  
  const favoritesAfterReload = await page.locator('.space-y-4 > div').count();
  console.log(`   После перезагрузки в избранном: ${favoritesAfterReload} элементов`);
  
  // Делаем финальный скриншот
  await page.screenshot({ path: 'test-favorites-final.png' });
  console.log('\n📸 Финальный скриншот: test-favorites-final.png');
  
  console.log('\n✅ Тест завершен!');
  
  if (favoritesCount === 3 && favoritesAfterReload === 3) {
    console.log('✨ Синхронизация работает корректно!');
  } else {
    console.log('❌ Обнаружена проблема с синхронизацией!');
    console.log(`   Ожидалось: 3 элемента`);
    console.log(`   Получено: ${favoritesCount} → ${favoritesAfterReload}`);
  }
  
  await browser.close();
}

testLikesSync().catch(console.error);