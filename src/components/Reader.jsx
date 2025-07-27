import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipe } from '../hooks/useSwipe';
import { useUnifiedProgress } from '../hooks/useUnifiedProgress';
import { contentFull } from '../data/contentFull';
import { Progress } from './Progress';
import { ParagraphView } from './ParagraphView';
import { LikedParagraphs } from './LikedParagraphs';
import { Navigation } from './Navigation';
import { NavigationTrigger } from './NavigationTrigger';

export const Reader = ({ userKey, onLogout }) => {
  const {
    progress,
    updateIndex,
    toggleViewMode,
    toggleLike,
    syncStatus
  } = useUnifiedProgress(userKey);

  const [direction, setDirection] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showLiked, setShowLiked] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showTapHint, setShowTapHint] = useState(true);

  const currentParagraph = contentFull[progress.currentIndex];
  // Используем индекс как уникальный идентификатор
  const currentFragmentId = progress.currentIndex + 1;
  const isLiked = progress.likes.includes(currentFragmentId);
  
  const navigateTo = useCallback((index) => {
    if (index >= 0 && index < contentFull.length && index !== progress.currentIndex) {
      updateIndex(index);
    }
  }, [progress.currentIndex, updateIndex]);

  const handleSwipeUp = useCallback(() => {
    if (isTransitioning || progress.currentIndex >= contentFull.length - 1) {
      // Вибрация при достижении конца
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      return;
    }
    
    setDirection(1);
    setIsTransitioning(true);
    updateIndex(progress.currentIndex + 1);
    
    // Если был в режиме аналогии, переключаем на оригинал
    if (progress.viewMode === 'analogy') {
      toggleViewMode();
    }
    
    // Легкая вибрация при переключении
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    // Сбрасываем флаг после начала анимации
    requestAnimationFrame(() => {
      setIsTransitioning(false);
    });
  }, [progress.currentIndex, updateIndex, isTransitioning, progress.viewMode, toggleViewMode]);

  const handleSwipeDown = useCallback(() => {
    if (isTransitioning || progress.currentIndex <= 0) {
      // Вибрация при достижении начала
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      return;
    }
    
    setDirection(-1);
    setIsTransitioning(true);
    updateIndex(progress.currentIndex - 1);
    
    // Если был в режиме аналогии, переключаем на оригинал
    if (progress.viewMode === 'analogy') {
      toggleViewMode();
    }
    
    // Легкая вибрация при переключении
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    // Сбрасываем флаг после начала анимации
    requestAnimationFrame(() => {
      setIsTransitioning(false);
    });
  }, [progress.currentIndex, updateIndex, isTransitioning, progress.viewMode, toggleViewMode]);

  const handleTap = useCallback(() => {
    toggleViewMode();
    // Убираем подсказку после первого тапа
    if (showTapHint) {
      setShowTapHint(false);
    }
  }, [toggleViewMode, showTapHint]);

  const swipeHandlers = useSwipe({
    onSwipeUp: handleSwipeUp,      // Свайп вверх (вверх пальцем) = следующий (как в TikTok) 
    onSwipeDown: handleSwipeDown,  // Свайп вниз (вниз пальцем) = предыдущий (как в TikTok)
    onTap: handleTap,
  });

  // Клавиатурная навигация
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp') handleSwipeUp();     // Стрелка вверх = следующий (как TikTok)
      if (e.key === 'ArrowDown') handleSwipeDown(); // Стрелка вниз = предыдущий (как TikTok)
      if (e.key === ' ') {
        e.preventDefault();
        handleTap();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSwipeUp, handleSwipeDown, handleTap]);

  const slideVariants = {
    enter: {
      opacity: 0
    },
    center: {
      opacity: 1
    },
    exit: {
      opacity: 0
    }
  };

  return (
    <div className="w-full h-full relative">
      <Progress current={progress.currentIndex + 1} total={contentFull.length} />
      
      {/* Подсказка про тап */}
      <AnimatePresence>
        {showTapHint && progress.currentIndex === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 1, duration: 0.4 }}
            className="absolute top-24 left-0 right-0 z-10 flex justify-center px-8"
          >
            <div className="bg-text-primary text-bg-primary px-4 py-2 rounded-full text-sm">
              👆 Тапните для современной аналогии
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={progress.currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            opacity: { 
              duration: 0.3,
              ease: 'easeInOut'
            }
          }}
          className="absolute inset-0"
        >
          <ParagraphView
            paragraph={currentParagraph}
            viewMode={progress.viewMode}
            isLiked={isLiked}
            swipeHandlers={swipeHandlers}
            userKey={userKey}
            onToggleLike={() => toggleLike(currentFragmentId)}
          />
        </motion.div>
      </AnimatePresence>

      {/* Индикатор свайпа на первом экране */}
      {progress.currentIndex === 0 && (
        <motion.div
          className="absolute bottom-24 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 0.7, y: -8 }}
          transition={{
            repeat: Infinity,
            repeatType: 'reverse',
            duration: 1.2,
            ease: 'easeInOut'
          }}
        >
          <div className="text-text-secondary text-sm">
            Свайп вверх для начала
          </div>
        </motion.div>
      )}

      {/* Верхние кнопки */}
      <div className="absolute top-4 right-4 flex gap-2">
        {/* Кнопка избранного */}
        <button
          onClick={() => setShowLiked(true)}
          className="p-2 text-text-secondary hover:text-text-primary transition-colors relative"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17.367 3.633a4.5 4.5 0 0 0-6.364 0L10 4.636l-1.003-1.003a4.5 4.5 0 0 0-6.364 6.364l1.003 1.003L10 17.364 16.364 11l1.003-1.003a4.5 4.5 0 0 0 0-6.364z" />
          </svg>
          {progress.likes.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-accent-purple text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {progress.likes.length}
            </span>
          )}
        </button>
        
        {/* Кнопка выхода */}
        <button
          onClick={onLogout}
          className="p-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 5L5 15M5 5L15 15" />
          </svg>
        </button>
      </div>

      {/* Индикатор режима просмотра и ключ */}
      <div className="absolute top-4 left-4">
        <div className="flex items-baseline gap-3 mb-1">
          <div className="text-sm font-medium text-text-primary">
            Фрагмент {progress.currentIndex + 1} из {contentFull.length}
          </div>
          <div className="text-xs text-text-secondary">
            {progress.viewMode === 'analogy' ? 'Аналогия' : 'Оригинал'}
          </div>
        </div>
        <button
          onClick={async () => {
            if (showKey) {
              try {
                // Для мобильных устройств используем альтернативный метод
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  await navigator.clipboard.writeText(userKey);
                } else {
                  // Fallback для старых браузеров
                  const textArea = document.createElement('textarea');
                  textArea.value = userKey;
                  textArea.style.position = 'fixed';
                  textArea.style.left = '-999999px';
                  document.body.appendChild(textArea);
                  textArea.focus();
                  textArea.select();
                  document.execCommand('copy');
                  document.body.removeChild(textArea);
                }
                
                setCopiedKey(true);
                // Вибрация на мобильных при успешном копировании
                if ('vibrate' in navigator) {
                  navigator.vibrate(50);
                }
                setTimeout(() => setCopiedKey(false), 2000);
              } catch (err) {
                console.error('Failed to copy:', err);
                // Показываем ключ если не удалось скопировать
                alert(`Ваш ключ: ${userKey}`);
              }
            } else {
              setShowKey(true);
            }
          }}
          className="text-xs font-mono text-text-secondary/60 hover:text-text-secondary transition-colors"
        >
          {showKey ? (copiedKey ? '✓ Скопировано!' : userKey) : 'Показать ключ'}
        </button>
      </div>

      
      {/* Кнопка навигации */}
      <NavigationTrigger onClick={() => setShowNavigation(true)} />
      
      {/* Панель навигации */}
      <Navigation
        isOpen={showNavigation}
        onClose={() => setShowNavigation(false)}
        currentIndex={progress.currentIndex}
        progress={progress}
        onNavigate={navigateTo}
      />
      
      
      {/* Экран избранного */}
      <AnimatePresence>
        {showLiked && (
          <LikedParagraphs
            progress={progress}
            onClose={() => setShowLiked(false)}
            onNavigateTo={navigateTo}
          />
        )}
      </AnimatePresence>
    </div>
  );
};