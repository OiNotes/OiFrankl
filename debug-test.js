import { chromium } from '@playwright/test';

async function debugTest() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  console.log('🔍 Отладочный тест...\n');
  
  // Подробный лог
  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', error => console.error('[ERROR]', error));
  
  await page.goto('http://localhost:5173');
  console.log('✅ Страница загружена');
  
  // Ждем и делаем скриншот
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'debug-1-welcome.png' });
  console.log('📸 Скриншот 1: debug-1-welcome.png');
  
  // Пробуем начать чтение
  const hasWelcomeButton = await page.locator('button:has-text("Начать")').isVisible().catch(() => false);
  if (hasWelcomeButton) {
    console.log('✅ Кнопка "Начать чтение" найдена');
    await page.locator('button:has-text("Начать")').click();
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'debug-2-key.png' });
    console.log('📸 Скриншот 2: debug-2-key.png');
    
    // Продолжаем
    const hasContinueButton = await page.locator('button:has-text("Продолжить")').isVisible().catch(() => false);
    if (hasContinueButton) {
      await page.locator('button:has-text("Продолжить")').click();
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'debug-3-reader.png' });
      console.log('📸 Скриншот 3: debug-3-reader.png');
    }
  }
  
  // Проверяем что есть на странице
  const elements = {
    textContent: await page.locator('.text-content').count(),
    paragraphs: await page.locator('p').count(),
    buttons: await page.locator('button').count(),
    svgs: await page.locator('svg').count()
  };
  
  console.log('\n📊 Элементы на странице:', elements);
  
  // Проверяем localStorage
  const storage = await page.evaluate(() => {
    const result = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.includes('frankl')) {
        result[key] = localStorage.getItem(key);
      }
    }
    return result;
  });
  
  console.log('\n💾 localStorage:');
  Object.entries(storage).forEach(([key, value]) => {
    console.log(`  ${key}: ${value?.substring(0, 100)}...`);
  });
  
  await page.waitForTimeout(5000);
  await browser.close();
}

debugTest().catch(console.error);