import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getChapters, getChapterProgress, getCurrentChapter } from '../utils/chapters';

export const Navigation = ({ isOpen, onClose, currentIndex, progress, onNavigate }) => {
  const [chapters, setChapters] = useState([]);
  const [chapterProgress, setChapterProgress] = useState({});
  const [currentChapter, setCurrentChapter] = useState(null);

  useEffect(() => {
    setChapters(getChapters());
  }, []);

  useEffect(() => {
    setChapterProgress(getChapterProgress(progress.readFragments || []));
    setCurrentChapter(getCurrentChapter(currentIndex));
  }, [currentIndex, progress.readFragments]);

  // Закрытие по ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleChapterClick = (chapter) => {
    onNavigate(chapter.startIndex);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/20 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Navigation Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed right-0 top-0 h-full w-80 bg-bg-primary shadow-xl z-50 overflow-hidden"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="h-full flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border-light">
                <h2 className="text-lg font-serif text-text-primary">Навигация по главам</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M15 5L5 15M5 5L15 15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Chapters List */}
              <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y" 
                   style={{ 
                     maxHeight: 'calc(100vh - 200px)',
                     WebkitOverflowScrolling: 'touch',
                     scrollbarWidth: 'thin'
                   }}>
                {chapters.map((chapter, index) => {
                  const progressData = chapterProgress[chapter.name] || { percentage: 0, read: 0, total: 0 };
                  const isCurrent = currentChapter?.name === chapter.name;

                  return (
                    <div
                      key={chapter.name}
                      className={`border-b border-border-light cursor-pointer transition-colors ${
                        isCurrent ? 'bg-accent-warm/5' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleChapterClick(chapter)}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className={`font-serif ${isCurrent ? 'text-accent-warm' : 'text-text-primary'}`}>
                            {chapter.name}
                          </h3>
                          {isCurrent && (
                            <span className="text-xs text-accent-warm uppercase tracking-wider">
                              Текущая
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm text-text-secondary mb-2">
                          {progressData.read} из {progressData.total} фрагментов
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent-warm/40 transition-all duration-300"
                              style={{ width: `${progressData.percentage}%` }}
                            />
                          </div>
                          
                          {/* Range slider only for current chapter */}
                          {isCurrent && (
                            <div className="mt-3">
                              <input
                                type="range"
                                min={0}
                                max={progressData.total - 1}
                                value={currentIndex - chapter.startIndex}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  const newIndex = chapter.startIndex + parseInt(e.target.value);
                                  onNavigate(newIndex);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full cursor-pointer"
                              />
                              <div className="text-xs text-text-secondary mt-1 text-center">
                                Фрагмент {currentIndex - chapter.startIndex + 1} из {progressData.total}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer Stats */}
              <div className="flex-shrink-0 p-6 border-t border-border-light bg-gray-50">
                <div className="text-sm text-text-secondary">
                  <div className="flex justify-between mb-1">
                    <span>Общий прогресс</span>
                    <span className="font-medium text-text-primary">
                      {Math.round((currentIndex / 559) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Фрагмент</span>
                    <span className="font-medium text-text-primary">
                      {currentIndex + 1} из 560
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};