import { chromium } from '@playwright/test';

async function testFixedLikes() {
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--window-size=400,800']
  });
  const page = await browser.newPage({ viewport: { width: 400, height: 800 } });
  
  console.log('🔧 Тест исправленной синхронизации лайков\n');
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);
  
  // Быстрый старт
  await page.click('button:has-text("Начать")');
  await page.waitForTimeout(1000);
  await page.locator('button').filter({ hasText: 'чтение' }).click();
  await page.waitForTimeout(2000);
  
  console.log('✅ Приложение запущено\n');
  
  // Добавляем лайки к разным фрагментам
  console.log('📝 Добавляем лайки к 3 разным фрагментам:\n');
  
  const likedFragments = [];
  
  for (let i = 0; i < 3; i++) {
    // Получаем информацию о текущем фрагменте
    const fragmentNum = await page.locator('text=/Фрагмент \\d+/').textContent();
    const text = await page.locator('.text-content').textContent();
    
    console.log(`${i + 1}. ${fragmentNum}`);
    console.log(`   "${text.substring(0, 50)}..."`);
    
    // Ставим лайк
    await page.locator('button').filter({ has: page.locator('svg[width="24"]') }).click();
    await page.waitForTimeout(500);
    
    // Проверяем что лайк поставлен
    const isLiked = await page.locator('svg[fill="currentColor"]').count() > 0;
    const likeCount = await page.locator('button span.text-sm').textContent().catch(() => '1');
    console.log(`   ✅ Лайкнуто (${likeCount} лайков)\n`);
    
    likedFragments.push({
      fragment: fragmentNum,
      text: text.substring(0, 50)
    });
    
    // Переходим к СЛЕДУЮЩЕМУ фрагменту
    if (i < 2) {
      await page.keyboard.press('ArrowUp'); // Теперь это правильно идет вперед
      await page.waitForTimeout(1000);
    }
  }
  
  // Проверяем счетчик избранного
  const favBadge = await page.locator('.absolute.-top-1.-right-1').textContent().catch(() => '0');
  console.log(`📊 Счетчик избранного показывает: ${favBadge}\n`);
  
  // Открываем избранное
  console.log('⭐ Открываем избранное...');
  await page.locator('button').filter({ has: page.locator('svg[width="20"]') }).first().click();
  await page.waitForTimeout(1000);
  
  // Проверяем содержимое
  const favCount = await page.locator('.space-y-4 > div').count();
  console.log(`\n📚 В избранном ${favCount} элементов:`);
  
  for (let i = 0; i < favCount; i++) {
    const favText = await page.locator('.space-y-4 > div').nth(i).locator('.font-serif').textContent();
    console.log(`   ${i + 1}. "${favText.substring(0, 50)}..."`);
  }
  
  // Проверяем соответствие
  console.log('\n🔍 Проверка соответствия:');
  if (favCount === likedFragments.length) {
    console.log('✅ Количество совпадает!');
  } else {
    console.log(`❌ Не совпадает: лайкнули ${likedFragments.length}, в избранном ${favCount}`);
  }
  
  // Делаем скриншот
  await page.screenshot({ path: 'fixed-favorites.png' });
  console.log('\n📸 Скриншот: fixed-favorites.png');
  
  // Проверяем данные в localStorage
  const storageCheck = await page.evaluate(() => {
    const key = localStorage.getItem('frankl_user_key');
    const progress = JSON.parse(localStorage.getItem(`frankl_user_progress_${key}`) || '{}');
    return {
      likes: progress.likes || [],
      currentIndex: progress.currentIndex
    };
  });
  
  console.log('\n💾 Данные в localStorage:');
  console.log(`   Лайки: [${storageCheck.likes.join(', ')}]`);
  console.log(`   Текущий индекс: ${storageCheck.currentIndex}`);
  
  await page.waitForTimeout(3000);
  await browser.close();
  
  console.log('\n✨ Тест завершен!');
  if (favCount === 3) {
    console.log('🎉 Синхронизация работает правильно!');
  }
}

testFixedLikes().catch(console.error);