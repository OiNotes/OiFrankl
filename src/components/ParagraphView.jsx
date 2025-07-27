import { motion, AnimatePresence } from 'framer-motion';
import { useTextSize } from '../hooks/useTextSize';
import { useSupabaseGlobalLikes } from '../services/supabase-likes';

export const ParagraphView = ({ paragraph, viewMode, isLiked, onToggleLike, swipeHandlers }) => {
  const text = viewMode === 'original' ? paragraph.original : paragraph.analogy;
  const { fontSize, lineHeight, isVeryLong, mobileOptimized } = useTextSize(text);
  const { count: globalLikes, isLikedByUser, toggleLike } = useSupabaseGlobalLikes(paragraph.globalId || 0);

  const isAnalogy = viewMode === 'analogy';
  
  const handleLikeClick = async () => {
    await toggleLike();
    onToggleLike();
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className={`flex-1 flex items-center justify-center ${mobileOptimized.padding} py-8 ${isVeryLong ? 'overflow-y-auto' : ''}`} {...swipeHandlers}>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, scale: 0.98, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -5 }}
            transition={{ 
              duration: 0.12, 
              ease: [0.25, 0, 0.5, 1]
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
            fill={isLikedByUser ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            whileTap={{ scale: 1.4 }}
            animate={isLikedByUser ? {
              scale: [1, 1.3, 1],
              rotate: [0, -5, 5, 0],
            } : {}}
            transition={{ duration: 0.3 }}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </motion.svg>
          {globalLikes > 0 && (
            <motion.span 
              className="text-sm font-medium"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              key={globalLikes}
            >
              {globalLikes}
            </motion.span>
          )}
        </button>
      </div>
    </div>
  );
};