import { useState } from 'react';
import { motion } from 'framer-motion';

export const KeyDisplay = ({ userKey, onContinue }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(userKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-center px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-md w-full">
        <motion.h2
          className="text-3xl font-serif mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Ваш ключ доступа
        </motion.h2>

        <motion.div
          className="bg-gray-50 rounded-lg p-8 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-3xl font-mono text-center mb-4 select-all">
            {userKey}
          </div>
          
          <button
            onClick={handleCopy}
            className="w-full py-3 px-4 border border-border-light rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="8" y="8" width="8" height="10" rx="1" />
              <path d="M12 8V6a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h2" />
            </svg>
            {copied ? 'Скопировано!' : 'Скопировать ключ'}
          </button>
        </motion.div>

        <motion.div
          className="text-sm text-text-secondary text-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="mb-2">
            Сохраните этот ключ, чтобы продолжить чтение с любого устройства
          </p>
          <p className="text-xs">
            Ваш прогресс и избранные фрагменты будут сохранены
          </p>
        </motion.div>

        <motion.button
          onClick={onContinue}
          className="w-full py-4 px-6 bg-text-primary text-bg-primary rounded-lg font-medium hover:opacity-90 transition-opacity"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Начать чтение
        </motion.button>
      </div>
    </motion.div>
  );
};