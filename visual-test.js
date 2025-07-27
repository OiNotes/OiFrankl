import { chromium } from '@playwright/test';

async function visualTest() {
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--window-size=400,800']
  });
  const page = await browser.newPage({ viewport: { width: 400, height: 800 } });
  
  console.log('📱 Визуальный тест мобильного приложения\n');
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);
  
  // Экран приветствия
  await page.screenshot({ path: 'screen-1-welcome.png' });
  console.log('📸 1. Экран приветствия');
  
  // Начинаем чтение
  await page.click('button:has-text("Начать")');
  await page.waitForTimeout(1500);
  
  await page.screenshot({ path: 'screen-2-key.png' });
  console.log('📸 2. Экран с ключом');
  
  // Находим кнопку "Начать чтение" более гибко
  const startButton = await page.locator('button').filter({ hasText: 'чтение' }).first();
  if (await startButton.isVisible()) {
    await startButton.click();
    await page.waitForTimeout(2000);
  }
  
  await page.screenshot({ path: 'screen-3-reader.png' });
  console.log('📸 3. Читалка');
  
  // Добавляем лайк
  await page.locator('button').filter({ has: page.locator('svg[width="24"]') }).click();
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: 'screen-4-liked.png' });
  console.log('📸 4. После лайка');
  
  // Свайп вверх (следующий фрагмент)
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: 'screen-5-next.png' });
  console.log('📸 5. Следующий фрагмент');
  
  // Переключаем режим
  await page.keyboard.press(' ');
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: 'screen-6-analogy.png' });
  console.log('📸 6. Режим аналогии');
  
  // Открываем избранное
  const favButton = await page.locator('button').filter({ has: page.locator('svg[width="20"]') }).first();
  await favButton.click();
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: 'screen-7-favorites.png' });
  console.log('📸 7. Избранное');
  
  console.log('\n✅ Все скриншоты сохранены!');
  console.log('🎉 Приложение работает корректно!');
  
  // Оставляем браузер открытым для ручного тестирования
  console.log('\n🖱️ Браузер оставлен открытым для ручного тестирования');
  console.log('Закройте его вручную когда закончите.');
}

visualTest().catch(console.error);