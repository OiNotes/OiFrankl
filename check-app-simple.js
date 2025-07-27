import { chromium } from '@playwright/test';

async function checkApp() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Логируем все консольные сообщения
  page.on('console', msg => {
    console.log(`[CONSOLE] ${msg.type()}: ${msg.text()}`);
  });
  
  // Логируем все ошибки
  page.on('pageerror', error => {
    console.error(`[ERROR]`, error.message);
  });
  
  console.log('🚀 Открываем приложение...');
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(3000);
  
  // Проверяем, есть ли экран приветствия
  const welcomeButton = page.locator('text="Начать чтение"');
  if (await welcomeButton.isVisible()) {
    console.log('📱 Нажимаем "Начать чтение"...');
    await welcomeButton.click();
    await page.waitForTimeout(2000);
  }
  
  // Теперь должны быть в читалке
  console.log('\n🔍 Проверяем состояние приложения...');
  
  // Проверяем наличие текста
  const paragraphText = await page.locator('.text-content').first().textContent().catch(() => null);
  if (paragraphText) {
    console.log('✅ Текст виден:', paragraphText.substring(0, 50) + '...');
  } else {
    console.log('❌ Текст не найден');
  }
  
  // Проверяем кнопку лайка
  const likeButton = page.locator('button svg[width="24"][height="24"]').first();
  if (await likeButton.isVisible()) {
    console.log('✅ Кнопка лайка видна');
    
    // Смотрим, есть ли уже счетчик лайков
    const likesCountBefore = await page.locator('button span.text-sm').textContent().catch(() => '0');
    console.log('📊 Лайков до клика:', likesCountBefore || '0');
    
    // Кликаем лайк
    await likeButton.click();
    await page.waitForTimeout(1000);
    
    // Проверяем счетчик после клика
    const likesCountAfter = await page.locator('button span.text-sm').textContent().catch(() => '0');
    console.log('📊 Лайков после клика:', likesCountAfter || '0');
  }
  
  // Проверяем навигацию свайпами
  console.log('\n🔄 Проверяем навигацию...');
  
  // Свайп вверх (следующий фрагмент)
  await page.locator('.text-content').first().dispatchEvent('touchstart', {
    touches: [{ clientX: 200, clientY: 400 }]
  });
  await page.locator('.text-content').first().dispatchEvent('touchend', {
    changedTouches: [{ clientX: 200, clientY: 200 }]
  });
  await page.waitForTimeout(1000);
  
  const newText = await page.locator('.text-content').first().textContent().catch(() => null);
  if (newText && newText !== paragraphText) {
    console.log('✅ Навигация работает, новый текст:', newText.substring(0, 50) + '...');
  }
  
  // Проверяем избранное
  console.log('\n⭐ Проверяем избранное...');
  const menuButton = page.locator('button').filter({ hasText: '•••' });
  if (await menuButton.isVisible()) {
    await menuButton.click();
    await page.waitForTimeout(500);
    
    const favoritesButton = page.locator('text="Избранное"');
    if (await favoritesButton.isVisible()) {
      await favoritesButton.click();
      await page.waitForTimeout(1000);
      
      const likedItems = await page.locator('.space-y-4 > div').count();
      console.log('📚 Элементов в избранном:', likedItems);
      
      // Закрываем избранное
      const closeButton = page.locator('button').filter({ hasText: '✕' });
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }
    }
  }
  
  // Делаем финальный скриншот
  await page.screenshot({ path: 'app-state.png', fullPage: true });
  console.log('\n📸 Скриншот сохранен как app-state.png');
  
  await page.waitForTimeout(2000);
  await browser.close();
  console.log('\n✨ Проверка завершена!');
}

checkApp().catch(console.error);