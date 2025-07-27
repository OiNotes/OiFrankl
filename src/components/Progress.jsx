import { motion } from 'framer-motion';

export const Progress = ({ current, total }) => {
  const percentage = (current / total) * 100;

  return (
    <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
      <motion.div
        className="h-full bg-text-primary opacity-20"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      />
    </div>
  );
};