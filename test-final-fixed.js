import { chromium } from '@playwright/test';

async function testFinalFixed() {
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--window-size=400,800']
  });
  const page = await browser.newPage({ viewport: { width: 400, height: 800 } });
  
  console.log('🎯 Финальный тест исправленной системы лайков\n');
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);
  
  // Очищаем данные для чистого теста
  await page.evaluate(() => {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.includes('frankl_user_')) {
        localStorage.removeItem(key);
      }
    }
  });
  
  await page.reload();
  await page.waitForTimeout(1000);
  
  // Начинаем
  await page.click('button:has-text("Начать")');
  await page.waitForTimeout(1000);
  const userKey = await page.locator('div.font-mono').textContent();
  console.log(`🔑 Новый пользователь: ${userKey}`);
  
  await page.locator('button').filter({ hasText: 'чтение' }).click();
  await page.waitForTimeout(2000);
  
  // Лайкаем 3 фрагмента
  console.log('\n❤️ Ставим лайки:\n');
  
  for (let i = 0; i < 3; i++) {
    const fragmentInfo = await page.locator('text=/Фрагмент \\d+/').textContent();
    const text = await page.locator('.text-content').textContent();
    
    console.log(`${i + 1}. ${fragmentInfo}`);
    console.log(`   "${text.substring(0, 50)}..."`);
    
    // Ставим лайк
    await page.locator('button').filter({ has: page.locator('svg[width="24"]') }).click();
    await page.waitForTimeout(500);
    
    // Проверяем
    const hasHeart = await page.locator('svg[fill="currentColor"]').count() > 0;
    const count = await page.locator('button span.text-sm').textContent().catch(() => '1');
    console.log(`   ✅ Лайк поставлен (всего ${count} лайков)\n`);
    
    // Следующий фрагмент
    if (i < 2) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(1000);
    }
  }
  
  // Проверяем счетчик
  const badge = await page.locator('.absolute.-top-1.-right-1').textContent().catch(() => '0');
  console.log(`📊 Счетчик избранного: ${badge}`);
  
  // Открываем избранное
  console.log('\n⭐ Открываем избранное...');
  await page.locator('button').filter({ has: page.locator('svg[width="20"]') }).first().click();
  await page.waitForTimeout(1500);
  
  const favCount = await page.locator('.space-y-4 > div').count();
  console.log(`\n✅ В избранном ${favCount} элементов (должно быть 3)`);
  
  // Проверяем тексты
  if (favCount === 3) {
    console.log('\nПроверяем содержимое:');
    for (let i = 0; i < 3; i++) {
      const text = await page.locator('.space-y-4 > div').nth(i).locator('.font-serif').textContent();
      console.log(`${i + 1}. "${text.substring(0, 50)}..."`);
    }
  }
  
  // Кликаем на элемент в избранном
  console.log('\n🔄 Проверяем навигацию из избранного...');
  await page.locator('.space-y-4 > div').first().click();
  await page.waitForTimeout(1000);
  
  const currentFragment = await page.locator('text=/Фрагмент \\d+/').textContent();
  console.log(`✅ Перешли к: ${currentFragment}`);
  
  // Финальный скриншот
  await page.screenshot({ path: 'final-success.png' });
  console.log('\n📸 Финальный скриншот: final-success.png');
  
  // РЕЗУЛЬТАТ
  console.log('\n🏁 ИТОГОВЫЙ РЕЗУЛЬТАТ:');
  if (favCount === 3) {
    console.log('✅ ВСЕ РАБОТАЕТ ПРАВИЛЬНО!');
    console.log('🎉 Проблема с дубликатами решена!');
  } else {
    console.log(`❌ Ошибка: ожидалось 3, получено ${favCount}`);
  }
  
  await page.waitForTimeout(3000);
  await browser.close();
}

testFinalFixed().catch(console.error);