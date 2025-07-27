import { motion, AnimatePresence } from 'framer-motion';

export const SyncIndicator = ({ syncStatus }) => {
  const { isOnline, hasPendingSync, syncInProgress, isMigrating } = syncStatus;
  
  // Не показываем индикатор если всё синхронизировано и онлайн
  if (isOnline && !hasPendingSync && !syncInProgress && !isMigrating) {
    return null;
  }
  
  const getStatusText = () => {
    if (isMigrating) return 'Переносим данные...';
    if (!isOnline) return 'Оффлайн режим';
    if (syncInProgress) return 'Синхронизация...';
    if (hasPendingSync) return 'Ожидание синхронизации';
    return '';
  };
  
  const getStatusColor = () => {
    if (!isOnline) return 'bg-yellow-500';
    if (isMigrating || syncInProgress) return 'bg-blue-500';
    if (hasPendingSync) return 'bg-orange-500';
    return 'bg-green-500';
  };
  
  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        <div className={`px-3 py-1 rounded-full text-white text-xs flex items-center gap-2 ${getStatusColor()}`}>
          {(syncInProgress || isMigrating) && (
            <motion.div
              className="w-3 h-3 border-2 border-white border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          )}
          {!isOnline && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          )}
          <span>{getStatusText()}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};