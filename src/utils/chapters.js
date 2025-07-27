// Утилиты для работы с главами
import { contentFull } from '../data/contentFull';

// Получить уникальные главы с их границами
export const getChapters = () => {
  const chapters = [];
  const chapterMap = new Map();
  
  contentFull.forEach((item, index) => {
    if (!chapterMap.has(item.chapter)) {
      chapterMap.set(item.chapter, {
        name: item.chapter,
        startIndex: index,
        endIndex: index,
        fragmentCount: 1
      });
    } else {
      const chapter = chapterMap.get(item.chapter);
      chapter.endIndex = index;
      chapter.fragmentCount++;
    }
  });
  
  // Преобразуем в массив и сортируем по порядку появления
  chapterMap.forEach((value) => {
    chapters.push(value);
  });
  
  return chapters;
};

// Получить прогресс чтения по главам
export const getChapterProgress = (readFragments = []) => {
  const chapters = getChapters();
  const progress = {};
  
  chapters.forEach(chapter => {
    const chapterFragmentIds = [];
    for (let i = chapter.startIndex; i <= chapter.endIndex; i++) {
      chapterFragmentIds.push(contentFull[i].id);
    }
    
    const readCount = chapterFragmentIds.filter(id => 
      readFragments.includes(id)
    ).length;
    
    progress[chapter.name] = {
      read: readCount,
      total: chapter.fragmentCount,
      percentage: Math.round((readCount / chapter.fragmentCount) * 100)
    };
  });
  
  return progress;
};

// Получить текущую главу по индексу
export const getCurrentChapter = (currentIndex) => {
  const chapters = getChapters();
  
  for (const chapter of chapters) {
    if (currentIndex >= chapter.startIndex && currentIndex <= chapter.endIndex) {
      return chapter;
    }
  }
  
  return null;
};