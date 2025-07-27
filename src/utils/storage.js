const STORAGE_PREFIX = 'frankl_';

export const storage = {
  getUserKey: () => {
    return localStorage.getItem(`${STORAGE_PREFIX}userKey`);
  },

  setUserKey: (key) => {
    localStorage.setItem(`${STORAGE_PREFIX}userKey`, key);
  },

  getProgress: (userKey) => {
    const data = localStorage.getItem(`${STORAGE_PREFIX}${userKey}`);
    if (!data) {
      return {
        currentIndex: 0,
        viewMode: 'original',
        lastRead: Date.now(),
        totalRead: 0,
        readFragments: [],
        likes: []
      };
    }
    const progress = JSON.parse(data);
    // Обратная совместимость: если нет readFragments, создаем из totalRead
    if (!progress.readFragments && progress.totalRead > 0) {
      progress.readFragments = Array.from({ length: progress.totalRead }, (_, i) => i + 1);
    } else if (!progress.readFragments) {
      progress.readFragments = [];
    }
    return progress;
  },

  saveProgress: (userKey, progress) => {
    localStorage.setItem(`${STORAGE_PREFIX}${userKey}`, JSON.stringify({
      ...progress,
      lastRead: Date.now()
    }));
  },

  clearProgress: (userKey) => {
    localStorage.removeItem(`${STORAGE_PREFIX}${userKey}`);
  },

  hasExistingSession: () => {
    return !!storage.getUserKey();
  }
};