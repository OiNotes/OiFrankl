import { chromium } from '@playwright/test';

async function quickTest() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Подробный лог консоли
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('supabase') || text.includes('userId') || text.includes('migration') || text.includes('Supabase')) {
      console.log(`[CONSOLE] ${text}`);
    }
  });
  
  console.log('🚀 Открываем приложение...');
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);
  
  // Начинаем чтение
  const welcomeButton = page.locator('button:has-text("Начать чтение")');
  if (await welcomeButton.isVisible()) {
    console.log('📱 Нажимаем "Начать чтение"...');
    await welcomeButton.click();
    await page.waitForTimeout(1000);
    
    // Должен появиться экран с ключом
    const keyDisplay = await page.locator('text="Ваш ключ для продолжения чтения"').isVisible();
    if (keyDisplay) {
      console.log('🔑 Видим экран с ключом');
      const key = await page.locator('div.font-mono.text-2xl').textContent();
      console.log('🔑 Сгенерированный ключ:', key);
      
      // Нажимаем продолжить
      await page.locator('button:has-text("Продолжить чтение")').click();
      await page.waitForTimeout(3000);
    }
  }
  
  // Проверяем localStorage
  const storageData = await page.evaluate(() => {
    return {
      userKey: localStorage.getItem('frankl_user_key'),
      progress: localStorage.getItem('frankl_progress')
    };
  });
  
  console.log('\n📦 localStorage:');
  console.log('User Key:', storageData.userKey);
  console.log('Progress:', storageData.progress ? 'есть' : 'нет');
  
  // Ждем еще немного для загрузки всех логов
  await page.waitForTimeout(5000);
  
  await browser.close();
  console.log('\n✨ Готово!');
}

quickTest().catch(console.error);