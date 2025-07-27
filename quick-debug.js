import { chromium } from '@playwright/test';

async function quickDebug() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Логи
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[LikedParagraphs]')) {
      console.log(text);
    }
  });
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  
  // Быстрый старт с существующим пользователем
  const hasReader = await page.locator('.text-content').isVisible().catch(() => false);
  if (!hasReader) {
    await page.click('button:has-text("Начать")');
    await page.waitForTimeout(1000);
    await page.locator('button').filter({ hasText: 'чтение' }).click();
    await page.waitForTimeout(1000);
  }
  
  // Сразу открываем избранное
  await page.locator('button').filter({ has: page.locator('svg[width="20"]') }).first().click();
  await page.waitForTimeout(2000);
  
  // Закрываем через 5 секунд
  setTimeout(() => browser.close(), 5000);
}

quickDebug().catch(console.error);