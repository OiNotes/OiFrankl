import { useState } from 'react';
import { motion } from 'framer-motion';
import { generateKey, validateKey } from '../utils/keyGenerator';
import { KeyDisplay } from './KeyDisplay';

export const Welcome = ({ onStart }) => {
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [showKeyDisplay, setShowKeyDisplay] = useState(false);
  const [generatedKey, setGeneratedKey] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');

  const handleNewReader = () => {
    const newKey = generateKey();
    setGeneratedKey(newKey);
    setShowKeyDisplay(true);
  };

  const handleContinueReading = () => {
    onStart(generatedKey);
  };

  const handleExistingKey = () => {
    if (validateKey(inputKey)) {
      onStart(inputKey);
    } else {
      setError('Неверный формат ключа. Пример: FRNK-A1B2');
    }
  };

  if (showKeyDisplay) {
    return (
      <KeyDisplay 
        userKey={generatedKey} 
        onContinue={handleContinueReading}
      />
    );
  }

  return (
    <motion.div 
      className="w-full h-full flex flex-col items-center justify-center px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-sm w-full">
        {/* Book title and author */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <h2 className="text-lg text-text-secondary mb-2">Виктор Франкл</h2>
          <h1 className="text-4xl font-serif">Человек в поисках смысла</h1>
        </motion.div>

        {!showKeyInput ? (
          <div className="space-y-4">
            <button
              onClick={handleNewReader}
              className="w-full py-4 px-6 bg-text-primary text-bg-primary rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Начать читать
            </button>

            <button
              onClick={() => setShowKeyInput(true)}
              className="w-full py-4 px-6 border border-border-light rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              У меня есть ключ
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <input
              type="text"
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="FRNK-XXXX"
              className="w-full py-4 px-6 border border-border-light rounded-lg font-mono text-center focus:outline-none focus:border-text-primary transition-colors"
              maxLength={9}
            />

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowKeyInput(false);
                  setInputKey('');
                  setError('');
                }}
                className="flex-1 py-4 px-6 border border-border-light rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Назад
              </button>

              <button
                onClick={handleExistingKey}
                className="flex-1 py-4 px-6 bg-text-primary text-bg-primary rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Продолжить
              </button>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Bottom section with mascot and telegram */}
      <motion.div 
        className="absolute bottom-8 left-0 right-0 flex flex-col items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {/* Mascot Image */}
        <img 
          src="/frankl-mascot.png" 
          alt="Frankl Mascot" 
          className="w-20 h-20 object-contain mb-3"
        />
        
        {/* Telegram Link */}
        <a
          href="https://t.me/noteoi"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-1.908 7.648-2.159 8.061-.106.174-.314.23-.511.135-.264-.129-.368-.211-1.344-.983l-1.844-1.45c-.123-.098-.132-.268-.022-.38l4.329-4.33c.19-.19-.042-.295-.293-.105l-5.388 3.391c-.351.221-.67.208-1.053.062-.577-.221-1.153-.356-1.153-.356s-.428-.265.304-.544c0 0 5.812-2.38 5.885-2.408.299-.115.711-.05.831.095.085.102.108.237.074.529z"/>
          </svg>
          <span className="text-sm">Канал создателя</span>
        </a>
      </motion.div>
    </motion.div>
  );
};