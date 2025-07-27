import { chromium } from '@playwright/test';

async function checkApp() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Логируем все консольные сообщения
  page.on('console', msg => {
    console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
  });
  
  // Логируем все ошибки
  page.on('pageerror', error => {
    console.error(`[PAGE ERROR]`, error);
  });
  
  console.log('📱 Открываем приложение...');
  await page.goto('http://localhost:5173');
  
  // Ждем загрузки
  await page.waitForTimeout(2000);
  
  // Проверяем, есть ли экран приветствия или читалка
  const welcomeVisible = await page.isVisible('text="Начать чтение"');
  
  if (welcomeVisible) {
    console.log('✅ Видим экран приветствия, начинаем чтение...');
    await page.click('text="Начать чтение"');
    await page.waitForTimeout(1000);
  }
  
  // Проверяем наличие текста
  const hasText = await page.isVisible('.text-content');
  console.log('📖 Текст виден:', hasText);
  
  // Проверяем кнопку лайка
  const likeButton = await page.locator('svg[width="24"][height="24"]').first();
  if (await likeButton.isVisible()) {
    console.log('❤️ Кнопка лайка видна');
    
    // Кликаем лайк
    await likeButton.click();
    console.log('👆 Кликнули лайк');
    await page.waitForTimeout(1000);
    
    // Проверяем, появился ли счетчик
    const likeCount = await page.textContent('span.text-sm.font-medium');
    console.log('🔢 Количество лайков:', likeCount);
  }
  
  // Делаем скриншот
  await page.screenshot({ path: 'app-check.png', fullPage: true });
  console.log('📸 Скриншот сохранен как app-check.png');
  
  // Получаем данные из localStorage
  const localStorageData = await page.evaluate(() => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('frankl')) {
        data[key] = localStorage.getItem(key);
      }
    }
    return data;
  });
  
  console.log('\n📦 Данные из localStorage:');
  console.log(JSON.stringify(localStorageData, null, 2));
  
  // Проверяем Supabase через консоль
  const supabaseInfo = await page.evaluate(() => {
    return {
      hasSupabase: typeof window.supabase !== 'undefined',
      env: {
        url: import.meta.env.VITE_SUPABASE_URL,
        hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
      }
    };
  });
  
  console.log('\n🔌 Информация о Supabase:');
  console.log(JSON.stringify(supabaseInfo, null, 2));
  
  await page.waitForTimeout(3000);
  await browser.close();
}

checkApp().catch(console.error);