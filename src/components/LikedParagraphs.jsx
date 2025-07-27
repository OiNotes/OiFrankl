import { motion, AnimatePresence } from 'framer-motion';
import { contentFull } from '../data/contentFull';

export const LikedParagraphs = ({ progress, onClose, onNavigateTo }) => {
  // Используем только те лайки, которые есть в progress.likes
  // ВАЖНО: progress.likes содержит индексы + 1 (не id из contentFull, так как там дубликаты)
  const likedParagraphs = progress.likes?.map(likedIndex => {
    const paragraph = contentFull[likedIndex - 1]; // -1 так как индексы с 1
    return paragraph;
  }).filter(Boolean) || [];

  return (
    <motion.div
      className="fixed inset-0 bg-bg-primary z-50"
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25 }}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-light">
          <h2 className="text-lg font-medium">Избранное</h2>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 5L5 15M5 5L15 15" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {likedParagraphs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-text-secondary">
              <p className="text-center px-8">
                Вы еще не добавили ни одной цитаты в избранное.<br />
                Нажмите на сердечко под понравившимся текстом.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {likedParagraphs.map((paragraph, mapIndex) => {
                // Находим реальный индекс в contentFull
                const likedIndex = progress.likes[mapIndex] - 1;
                return (
                  <motion.div
                    key={`liked-${likedIndex}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: mapIndex * 0.05 }}
                    className="bg-white rounded-lg p-4 shadow-sm border border-border-light cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      onNavigateTo(likedIndex);
                      onClose();
                    }}
                  >
                  {paragraph.chapter && (
                    <p className="text-xs text-text-secondary mb-2 uppercase tracking-wider">
                      {paragraph.chapter}
                    </p>
                  )}
                  <p className="text-text-primary font-serif leading-relaxed mb-3">
                    {paragraph.original}
                  </p>
                  <p className="text-accent-purple text-sm italic">
                    {paragraph.analogy}
                  </p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};