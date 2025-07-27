import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipe } from '../hooks/useSwipe';
import { useSupabaseProgress } from '../hooks/useSupabaseProgress';
import { contentFull } from '../data/contentFull';
import { Progress } from './Progress';
import { ParagraphView } from './ParagraphView';
import { LikedParagraphs } from './LikedParagraphs';
import { Navigation } from './Navigation';
import { NavigationTrigger } from './NavigationTrigger';
import { SyncIndicator } from './SyncIndicator';

export const Reader = ({ userKey, onLogout }) => {
  const {
    progress,
    updateIndex,
    toggleViewMode,
    toggleLike,
    syncStatus
  } = useSupabaseProgress(userKey);

  const [direction, setDirection] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showLiked, setShowLiked] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const currentParagraph = contentFull[progress.currentIndex];
  const isLiked = progress.likes.includes(currentParagraph?.id);
  
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
    // Сбрасываем флаг после начала анимации
    requestAnimationFrame(() => {
      setIsTransitioning(false);
    });
  }, [progress.currentIndex, updateIndex, isTransitioning]);

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
    // Сбрасываем флаг после начала анимации
    requestAnimationFrame(() => {
      setIsTransitioning(false);
    });
  }, [progress.currentIndex, updateIndex, isTransitioning]);

  const handleTap = useCallback(() => {
    toggleViewMode();
  }, [toggleViewMode]);

  const swipeHandlers = useSwipe({
    onSwipeUp: handleSwipeUp,
    onSwipeDown: handleSwipeDown,
    onTap: handleTap,
  });

  // Клавиатурная навигация
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp') handleSwipeDown();
      if (e.key === 'ArrowDown') handleSwipeUp();
      if (e.key === ' ') {
        e.preventDefault();
        handleTap();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSwipeUp, handleSwipeDown, handleTap]);

  const slideVariants = {
    enter: (direction) => ({
      y: direction > 0 ? '50%' : '-50%',
      opacity: 0.3,
      scale: 0.95
    }),
    center: {
      y: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction) => ({
      y: direction > 0 ? '-30%' : '30%',
      opacity: 0,
      scale: 0.95
    }),
  };

  return (
    <div className="w-full h-full relative">
      <SyncIndicator syncStatus={syncStatus} />
      <Progress current={progress.currentIndex + 1} total={contentFull.length} />
      
      <AnimatePresence mode="popLayout" custom={direction}>
        <motion.div
          key={progress.currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            y: { 
              type: 'tween', 
              duration: 0.18,
              ease: [0.32, 0, 0.67, 0] // ease-out для быстрого старта
            },
            opacity: { 
              duration: 0.08,
              ease: 'linear'
            },
            scale: {
              duration: 0.15,
              ease: [0.32, 0, 0.67, 0]
            }
          }}
          className="absolute inset-0"
        >
          <ParagraphView
            paragraph={currentParagraph}
            viewMode={progress.viewMode}
            isLiked={isLiked}
            onToggleLike={() => toggleLike(currentParagraph.id)}
            swipeHandlers={swipeHandlers}
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
        <div className="text-xs text-text-secondary mb-1">
          {progress.viewMode === 'analogy' ? 'Аналогия' : 'Оригинал'}
        </div>
        <button
          onClick={async () => {
            if (showKey) {
              try {
                await navigator.clipboard.writeText(userKey);
                setCopiedKey(true);
                setTimeout(() => setCopiedKey(false), 2000);
              } catch (err) {
                console.error('Failed to copy:', err);
              }
            } else {
              setShowKey(true);
            }
          }}
          className="text-xs font-mono text-text-secondary/60 hover:text-text-secondary transition-colors"
        >
          {showKey ? (copiedKey ? 'Скопировано!' : userKey) : 'Показать ключ'}
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
            userKey={userKey}
            onClose={() => setShowLiked(false)}
            onNavigateTo={navigateTo}
          />
        )}
      </AnimatePresence>
    </div>
  );
};