import { useMemo, useEffect, useState } from 'react';

export const useTextSize = (text) => {
  const [isVeryLong, setIsVeryLong] = useState(false);
  
  const fontSize = useMemo(() => {
    const length = text.length;
    
    // Более детальная градация размеров для лучшей адаптивности
    if (length < 80) return 'text-2xl sm:text-3xl md:text-4xl';
    if (length < 150) return 'text-xl sm:text-2xl md:text-3xl';
    if (length < 250) return 'text-lg sm:text-xl md:text-2xl';
    if (length < 400) return 'text-base sm:text-lg md:text-xl';
    if (length < 600) return 'text-sm sm:text-base md:text-lg';
    return 'text-xs sm:text-sm md:text-base';
  }, [text]);

  const lineHeight = useMemo(() => {
    const length = text.length;
    
    if (length < 150) return 'leading-relaxed';
    if (length < 400) return 'leading-loose';
    return 'leading-loose';
  }, [text]);
  
  // Определяем, нужен ли скролл для очень длинных текстов
  useEffect(() => {
    setIsVeryLong(text.length > 800);
  }, [text]);
  
  // Расчет оптимального размера для мобильных устройств
  const mobileOptimized = useMemo(() => {
    const length = text.length;
    // Для очень коротких текстов (цитаты) - крупный шрифт
    if (length < 50) return { scale: 1.2, padding: 'px-8' };
    // Для средних текстов - стандартный размер
    if (length < 300) return { scale: 1, padding: 'px-6' };
    // Для длинных текстов - уменьшенный размер и меньше отступов
    return { scale: 0.9, padding: 'px-4' };
  }, [text]);

  return { 
    fontSize, 
    lineHeight, 
    isVeryLong,
    mobileOptimized
  };
};