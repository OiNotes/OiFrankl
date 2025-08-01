import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTextSize } from '../hooks/useTextSize';
import { useUnifiedLikes } from '../hooks/useUnifiedLikes';
import { contentFull } from '../data/contentFull';

export const ParagraphView = ({ paragraph, viewMode, isLiked, swipeHandlers, userKey, onToggleLike }) => {
  const text = viewMode === 'original' ? paragraph.original : paragraph.analogy;
  const { fontSize, lineHeight, isVeryLong, mobileOptimized } = useTextSize(text);
  // Используем унифицированный хук для лайков
  // ВАЖНО: используем индекс + 1 как уникальный ID, так как в contentFull есть дубликаты id
  const fragmentId = contentFull.indexOf(paragraph) + 1;
  const { count: globalLikes, isLikedByUser, toggleLike } = useUnifiedLikes(fragmentId, userKey);
  const [optimisticLiked, setOptimisticLiked] = useState(isLikedByUser);
  const [optimisticCount, setOptimisticCount] = useState(globalLikes);

  const isAnalogy = viewMode === 'analogy';
  
  // Обновляем оптимистичные значения при изменении реальных
  useEffect(() => {
    setOptimisticLiked(isLikedByUser);
    setOptimisticCount(globalLikes);
    
    // // Отладка для проверки глобальных лайков
    // if (fragmentId && globalLikes > 0) {
    //   console.log(`[ParagraphView] Fragment ${fragmentId}: ${globalLikes} likes, isLikedByUser: ${isLikedByUser}`);
    // }
  }, [isLikedByUser, globalLikes, paragraph.id, fragmentId]);
  
  const handleLikeClick = async () => {
    // Оптимистичное обновление UI
    const newLikedState = !optimisticLiked;
    setOptimisticLiked(newLikedState);
    setOptimisticCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));
    
    // Вибрация при лайке
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
    
    // Реальное обновление через родительский компонент
    if (onToggleLike) {
      await onToggleLike();
    }
    
    // Также обновляем глобальные лайки
    await toggleLike();
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className={`flex-1 flex items-center justify-center ${mobileOptimized.padding} py-8 ${isVeryLong ? 'overflow-y-auto' : ''}`} {...swipeHandlers}>
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.2, 
              ease: 'easeInOut'
            }}
            className="w-full max-w-2xl"
            style={{ transform: `scale(${mobileOptimized.scale})` }}
          >
            <div className="relative">
              {paragraph.chapter && (
                <h3 className="text-xs sm:text-sm text-text-secondary text-center mb-4 uppercase tracking-wider">
                  {paragraph.chapter}
                </h3>
              )}
              <p 
                className={`
                  text-content text-center
                  ${fontSize} ${lineHeight}
                  ${isAnalogy ? 'text-accent-purple' : 'text-text-primary'}
                `}
              >
                {text}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="pb-8 px-8">
        <button
          onClick={handleLikeClick}
          className="mx-auto flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <motion.svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill={optimisticLiked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            whileTap={{ scale: 1.4 }}
            animate={optimisticLiked ? {
              scale: [1, 1.3, 1],
              rotate: [0, -5, 5, 0],
            } : {}}
            transition={{ duration: 0.3 }}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </motion.svg>
          {optimisticCount > 0 && (
            <motion.span 
              className="text-sm font-medium"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              key={optimisticCount}
            >
              {optimisticCount}
            </motion.span>
          )}
        </button>
      </div>
    </div>
  );
};