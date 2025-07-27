import { chromium } from '@playwright/test';

async function testFinalLikes() {
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--window-size=400,800']
  });
  const page = await browser.newPage({ viewport: { width: 400, height: 800 } });
  
  console.log('✅ Финальный тест системы лайков\n');
  
  // Включаем логи для отладки
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[LikedParagraphs]')) {
      console.log(text);
    }
  });
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);
  
  // Быстрый старт с новым пользователем (очистим старые данные)
  await page.evaluate(() => {
    // Очищаем все данные для чистого теста
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.includes('frankl_user_')) {
        localStorage.removeItem(key);
      }
    }
  });
  
  await page.reload();
  await page.waitForTimeout(1000);
  
  await page.click('button:has-text("Начать")');
  await page.waitForTimeout(1000);
  await page.locator('button').filter({ hasText: 'чтение' }).click();
  await page.waitForTimeout(2000);
  
  console.log('🚀 Начинаем с чистого листа\n');
  
  // Лайкаем 3 конкретных фрагмента
  const likedData = [];
  
  console.log('❤️ Добавляем лайки:\n');
  
  for (let i = 0; i < 3; i++) {
    // Запоминаем текущий фрагмент
    const fragmentNum = await page.locator('text=/Фрагмент \\d+/').textContent();
    const text = await page.locator('.text-content').textContent();
    const shortText = text.substring(0, 40) + '...';
    
    console.log(`${i + 1}. ${fragmentNum}`);
    console.log(`   Текст: "${shortText}"`);
    
    // Ставим лайк
    await page.locator('button').filter({ has: page.locator('svg[width="24"]') }).click();
    await page.waitForTimeout(500);
    
    // Проверяем что лайк поставлен
    const hasHeart = await page.locator('svg[fill="currentColor"]').count() > 0;
    console.log(`   ✅ Лайк поставлен: ${hasHeart}\n`);
    
    likedData.push({ num: fragmentNum, text: shortText });
    
    // Идем к следующему
    if (i < 2) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(1000);
    }
  }
  
  // Проверяем счетчик
  const badge = await page.locator('.absolute.-top-1.-right-1').textContent().catch(() => '0');
  console.log(`📊 Счетчик избранного: ${badge}\n`);
  
  // Открываем избранное
  console.log('⭐ Открываем избранное...\n');
  await page.locator('button').filter({ has: page.locator('svg[width="20"]') }).first().click();
  await page.waitForTimeout(1500);
  
  // Проверяем содержимое
  const favCount = await page.locator('.space-y-4 > div').count();
  console.log(`📚 В избранном ${favCount} элементов\n`);
  
  // Сравниваем тексты
  if (favCount > 0) {
    console.log('Проверяем соответствие текстов:');
    for (let i = 0; i < Math.min(favCount, 3); i++) {
      const favText = await page.locator('.space-y-4 > div').nth(i).locator('.font-serif').textContent();
      const shortFavText = favText.substring(0, 40) + '...';
      
      // Ищем соответствие в лайкнутых
      const match = likedData.find(item => item.text === shortFavText);
      if (match) {
        console.log(`✅ ${i + 1}. Найдено соответствие для ${match.num}`);
      } else {
        console.log(`❌ ${i + 1}. Не найдено: "${shortFavText}"`);
      }
    }
  }
  
  // Делаем скриншот
  await page.screenshot({ path: 'test-final-favorites.png' });
  console.log('\n📸 Скриншот: test-final-favorites.png');
  
  // Финальная проверка
  console.log('\n🏁 РЕЗУЛЬТАТ:');
  if (favCount === 3) {
    console.log('✅ Количество элементов в избранном правильное!');
  } else {
    console.log(`❌ Ошибка: ожидалось 3, получено ${favCount}`);
  }
  
  await page.waitForTimeout(3000);
  await browser.close();
}

testFinalLikes().catch(console.error);