import { contentFull } from './src/data/contentFull.js';

console.log('Проверка contentFull на дубликаты ID:\n');

// Собираем все ID
const allIds = contentFull.map(item => item.id);
const uniqueIds = [...new Set(allIds)];

console.log(`Всего элементов: ${contentFull.length}`);
console.log(`Уникальных ID: ${uniqueIds.length}`);

if (allIds.length !== uniqueIds.length) {
  console.log('\n❌ НАЙДЕНЫ ДУБЛИКАТЫ!\n');
  
  // Находим дубликаты
  const idCounts = {};
  allIds.forEach(id => {
    idCounts[id] = (idCounts[id] || 0) + 1;
  });
  
  const duplicates = Object.entries(idCounts)
    .filter(([id, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);
  
  console.log('Дубликаты ID:');
  duplicates.forEach(([id, count]) => {
    console.log(`  ID ${id}: встречается ${count} раз`);
  });
  
  // Показываем первые несколько дубликатов
  console.log('\nПримеры дубликатов:');
  const exampleId = duplicates[0][0];
  const examples = contentFull.filter(item => item.id == exampleId);
  examples.forEach((item, index) => {
    console.log(`\n  Дубликат ${index + 1} (ID ${item.id}):`);
    console.log(`    Глава: ${item.chapter || 'не указана'}`);
    console.log(`    Текст: "${item.original.substring(0, 50)}..."`);
  });
} else {
  console.log('\n✅ Дубликатов не найдено');
}

// Проверяем первые несколько элементов
console.log('\nПервые 10 элементов:');
contentFull.slice(0, 10).forEach(item => {
  console.log(`  ID ${item.id}: ${item.original.substring(0, 30)}...`);
});