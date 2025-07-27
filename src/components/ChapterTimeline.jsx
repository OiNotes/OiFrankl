import { motion } from 'framer-motion';
import { getCurrentChapter } from '../utils/chapters';
import { contentFull } from '../data/contentFull';

export const ChapterTimeline = ({ currentIndex, onNavigate }) => {
  const currentChapter = getCurrentChapter(currentIndex);
  
  if (!currentChapter) return null;
  
  const chapterFragments = [];
  for (let i = currentChapter.startIndex; i <= currentChapter.endIndex; i++) {
    chapterFragments.push(i);
  }
  
  const currentPosition = currentIndex - currentChapter.startIndex;
  const percentage = (currentPosition / (chapterFragments.length - 1)) * 100;

  return (
    <motion.div 
      className="fixed bottom-0 left-0 right-0 px-6 pb-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-xs text-text-secondary mb-2 flex justify-between">
          <span>{currentChapter.name}</span>
          <span>{currentPosition + 1} / {chapterFragments.length}</span>
        </div>
        
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickPercentage = clickX / rect.width;
            const targetIndex = Math.round(clickPercentage * (chapterFragments.length - 1));
            onNavigate(currentChapter.startIndex + targetIndex);
          }}
        >
          {/* Progress */}
          <motion.div 
            className="absolute left-0 top-0 h-full bg-text-primary/20"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
          
          {/* Dots for each fragment */}
          <div className="absolute inset-0 flex items-center justify-between px-1">
            {chapterFragments.map((index, i) => (
              <div
                key={index}
                className={`w-1 h-1 rounded-full transition-colors ${
                  i <= currentPosition ? 'bg-text-primary' : 'bg-gray-400'
                }`}
              />
            ))}
          </div>
          
          {/* Current position indicator */}
          <motion.div
            className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-accent-warm rounded-full shadow-sm"
            animate={{ left: `${percentage}%` }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>
    </motion.div>
  );
};