import { motion } from 'framer-motion';

export const NavigationTrigger = ({ onClick }) => {
  return (
    <motion.button
      className="fixed bottom-6 right-6 z-30 p-3 bg-white shadow-lg hover:shadow-xl rounded-full transition-all"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="4" r="1.5" fill="currentColor" />
        <circle cx="10" cy="10" r="1.5" fill="currentColor" />
        <circle cx="10" cy="16" r="1.5" fill="currentColor" />
      </svg>
    </motion.button>
  );
};