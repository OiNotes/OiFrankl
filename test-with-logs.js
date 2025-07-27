import { chromium } from '@playwright/test';

async function testWithLogs() {
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--window-size=400,800']
  });
  const page = await browser.newPage({ viewport: { width: 400, height: 800 } });
  
  console.log('🔍 Тест с подробными логами\n');
  
  // Включаем все логи
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[') && text.includes(']')) {
      console.log(text);
    }
  });
  
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
  await page.locator('button').filter({ hasText: 'чтение' }).click();
  await page.waitForTimeout(2000);
  
  console.log('\n🚀 Начинаем тестирование лайков\n');
  
  // Лайкаем первый фрагмент
  console.log('1️⃣ Лайкаем первый фрагмент');
  await page.locator('button').filter({ has: page.locator('svg[width="24"]') }).click();
  await page.waitForTimeout(1000);
  
  // Проверяем localStorage
  const check1 = await page.evaluate(() => {
    const userKey = localStorage.getItem('frankl_user_key');
    const progressKey = `frankl_user_progress_${userKey}`;
    const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
    return {
      userKey,
      likes: progress.likes || []
    };
  });
  
  console.log(`\nПосле первого лайка:`);
  console.log(`Ключ: ${check1.userKey}`);
  console.log(`Лайки: [${check1.likes.join(', ')}]`);
  
  // Идем ко второму фрагменту
  console.log('\n2️⃣ Переходим ко второму фрагменту');
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(1000);
  
  // Лайкаем второй
  console.log('Лайкаем второй фрагмент');
  await page.locator('button').filter({ has: page.locator('svg[width="24"]') }).click();
  await page.waitForTimeout(1000);
  
  // Проверяем снова
  const check2 = await page.evaluate(() => {
    const userKey = localStorage.getItem('frankl_user_key');
    const progressKey = `frankl_user_progress_${userKey}`;
    const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
    return {
      likes: progress.likes || []
    };
  });
  
  console.log(`\nПосле второго лайка:`);
  console.log(`Лайки: [${check2.likes.join(', ')}]`);
  
  // Открываем избранное
  console.log('\n3️⃣ Открываем избранное');
  await page.locator('button').filter({ has: page.locator('svg[width="20"]') }).first().click();
  await page.waitForTimeout(1500);
  
  const favCount = await page.locator('.space-y-4 > div').count();
  console.log(`\nВ избранном: ${favCount} элементов`);
  
  await page.screenshot({ path: 'debug-favorites.png' });
  console.log('📸 Скриншот: debug-favorites.png');
  
  await browser.close();
}

testWithLogs().catch(console.error);