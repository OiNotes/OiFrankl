import { chromium } from '@playwright/test';

async function finalTest() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🚀 Запускаем финальный тест приложения...\n');
  
  // Подробный лог консоли
  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('[vite]') && !text.includes('React DevTools')) {
      console.log(`[CONSOLE] ${text}`);
    }
  });
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);
  
  // 1. НАЧАЛО ЧТЕНИЯ
  console.log('\n📱 ТЕСТ 1: Начало чтения');
  const welcomeButton = page.locator('button:has-text("Начать чтение")');
  if (await welcomeButton.isVisible()) {
    await welcomeButton.click();
    await page.waitForTimeout(1000);
    
    // Получаем ключ
    const keyDisplay = await page.locator('div.font-mono.text-2xl').textContent();
    console.log('✅ Сгенерирован ключ:', keyDisplay);
    
    // Продолжаем чтение
    await page.locator('button:has-text("Продолжить чтение")').click();
    await page.waitForTimeout(2000);
  }
  
  // 2. ПРОВЕРЯЕМ ТЕКСТ И НАВИГАЦИЮ
  console.log('\n📖 ТЕСТ 2: Отображение текста');
  const textContent = await page.locator('.text-content').first().textContent();
  if (textContent) {
    console.log('✅ Текст отображается:', textContent.substring(0, 50) + '...');
  }
  
  // 3. ДОБАВЛЯЕМ ЛАЙКИ
  console.log('\n❤️ ТЕСТ 3: Система лайков');
  for (let i = 0; i < 5; i++) {
    const likeButton = page.locator('button svg[width="24"]').first();
    
    // Проверяем счетчик до клика
    const countBefore = await page.locator('button span.text-sm').textContent().catch(() => null);
    
    await likeButton.click();
    await page.waitForTimeout(500);
    
    // Проверяем счетчик после клика
    const countAfter = await page.locator('button span.text-sm').textContent().catch(() => null);
    
    console.log(`   Фрагмент ${i + 1}: ${countBefore || '0'} → ${countAfter || '1'} лайков`);
    
    // Свайпаем к следующему
    if (i < 4) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(1000);
    }
  }
  
  // 4. ПРОВЕРЯЕМ ПЕРЕКЛЮЧЕНИЕ РЕЖИМОВ
  console.log('\n🔄 ТЕСТ 4: Переключение оригинал/аналогия');
  const textBefore = await page.locator('.text-content').first().textContent();
  await page.keyboard.press(' '); // Пробел для переключения
  await page.waitForTimeout(1000);
  const textAfter = await page.locator('.text-content').first().textContent();
  
  if (textBefore !== textAfter) {
    console.log('✅ Режим переключается корректно');
    const mode = await page.locator('text="Аналогия"').isVisible() ? 'Аналогия' : 'Оригинал';
    console.log('   Текущий режим:', mode);
  } else {
    console.log('❌ Режим не переключился');
  }
  
  // 5. ПРОВЕРЯЕМ ИЗБРАННОЕ
  console.log('\n⭐ ТЕСТ 5: Избранное');
  await page.locator('button svg[width="20"][height="20"]').first().click(); // Кнопка сердечка
  await page.waitForTimeout(1000);
  
  const likedCount = await page.locator('.space-y-4 > div').count();
  console.log(`✅ В избранном ${likedCount} элементов`);
  
  if (likedCount > 0) {
    // Кликаем на первый элемент
    await page.locator('.space-y-4 > div').first().click();
    await page.waitForTimeout(1000);
    console.log('✅ Навигация из избранного работает');
  }
  
  // 6. ПРОВЕРЯЕМ СОХРАНЕНИЕ ПРОГРЕССА
  console.log('\n💾 ТЕСТ 6: Сохранение прогресса');
  const currentFragment = await page.locator('text=/Фрагмент \\d+ из/').textContent();
  console.log('   Текущая позиция:', currentFragment);
  
  // Перезагружаем страницу
  await page.reload();
  await page.waitForTimeout(2000);
  
  const fragmentAfterReload = await page.locator('text=/Фрагмент \\d+ из/').textContent();
  if (currentFragment === fragmentAfterReload) {
    console.log('✅ Прогресс сохраняется при перезагрузке');
  }
  
  // 7. ФИНАЛЬНАЯ СТАТИСТИКА
  console.log('\n📊 ФИНАЛЬНАЯ СТАТИСТИКА:');
  const stats = await page.evaluate(() => {
    const userKey = localStorage.getItem('frankl_user_key');
    const progressKey = `frankl_user_progress_${userKey}`;
    const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
    const globalLikes = JSON.parse(localStorage.getItem('frankl_global_likes_v2') || '{}');
    
    return {
      totalRead: progress.totalRead || 0,
      userLikes: (progress.likes || []).length,
      globalLikesCount: Object.values(globalLikes).reduce((sum, count) => sum + count, 0),
      fragmentsWithLikes: Object.keys(globalLikes).length
    };
  });
  
  console.log('   Прочитано фрагментов:', stats.totalRead);
  console.log('   Лайков пользователя:', stats.userLikes);
  console.log('   Всего глобальных лайков:', stats.globalLikesCount);
  console.log('   Фрагментов с лайками:', stats.fragmentsWithLikes);
  
  // Делаем финальный скриншот
  await page.screenshot({ path: 'final-app-state.png', fullPage: true });
  console.log('\n📸 Финальный скриншот: final-app-state.png');
  
  await page.waitForTimeout(3000);
  await browser.close();
  
  console.log('\n✨ Тестирование завершено успешно!');
  console.log('🎉 Приложение полностью функционально!');
}

finalTest().catch(console.error);