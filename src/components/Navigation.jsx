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
                <h2 className="text-lg font-serif text-text-primary">Навигация</h2>
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
                    <motion.div
                      key={chapter.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`border-b border-border-light cursor-pointer hover:bg-gray-50 transition-colors ${
                        isCurrent ? 'bg-gray-50' : ''
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

                        {/* Progress Bar with slider */}
                        <div className="relative mt-3">
                          {/* Visual progress bar */}
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                            <motion.div
                              className="h-full bg-text-primary/30"
                              initial={{ width: 0 }}
                              animate={{ width: `${progressData.percentage}%` }}
                              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            />
                          </div>
                          
                          {/* Range slider */}
                          <input
                            type="range"
                            min={0}
                            max={progressData.total - 1}
                            value={isCurrent ? currentIndex - chapter.startIndex : 0}
                            onChange={(e) => {
                              e.stopPropagation();
                              const newIndex = chapter.startIndex + parseInt(e.target.value);
                              onNavigate(newIndex);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full h-2 bg-transparent cursor-pointer appearance-none"
                            style={{
                              background: `linear-gradient(to right, rgb(251 146 60 / 0.3) 0%, rgb(251 146 60 / 0.3) ${progressData.percentage}%, rgb(229 231 235) ${progressData.percentage}%, rgb(229 231 235) 100%)`
                            }}
                          />
                          
                          {/* Fragment dots */}
                          <div className="flex justify-between mt-2">
                            {Array.from({ length: Math.min(10, progressData.total) }).map((_, i) => {
                              const fragmentIndex = Math.floor(i * progressData.total / Math.min(10, progressData.total));
                              const globalIndex = chapter.startIndex + fragmentIndex;
                              const isActive = currentIndex === globalIndex;
                              return (
                                <button
                                  key={i}
                                  className={`w-2 h-2 rounded-full transition-all ${
                                    isActive ? 'bg-accent-warm scale-125' : 'bg-gray-300 hover:bg-gray-400'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigate(globalIndex);
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </motion.div>
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