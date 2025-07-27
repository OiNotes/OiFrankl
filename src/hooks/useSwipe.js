import { useSwipeable } from 'react-swipeable';
import { useCallback } from 'react';

export const useSwipe = ({ onSwipeUp, onSwipeDown, onTap }) => {
  const handlers = useSwipeable({
    onSwipedUp: () => {
      if (onSwipeUp) onSwipeUp();
    },
    onSwipedDown: () => {
      if (onSwipeDown) onSwipeDown();
    },
    onTap: () => {
      if (onTap) onTap();
    },
    preventScrollOnSwipe: true,
    trackMouse: false,
    delta: 25, // Уменьшенное расстояние для более быстрого отклика
    swipeDuration: 300, // Более быстрое распознавание свайпа
    velocity: 0.3, // Минимальная скорость для регистрации свайпа
  });

  return handlers;
};