-- Исправление структуры таблицы global_likes

-- Сначала удаляем старую таблицу (если она существует с неправильной структурой)
DROP TABLE IF EXISTS global_likes CASCADE;

-- Создаем таблицу заново с правильной структурой
CREATE TABLE global_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fragment_id INTEGER UNIQUE NOT NULL,
  like_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Включаем RLS
ALTER TABLE global_likes ENABLE ROW LEVEL SECURITY;

-- Политики для таблицы global_likes
CREATE POLICY "Anyone can read global likes" ON global_likes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert global likes" ON global_likes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update global likes" ON global_likes
  FOR UPDATE USING (true);

-- Создаем индекс
CREATE INDEX idx_global_likes_fragment_id ON global_likes(fragment_id);

-- Пересоздаем триггер
DROP TRIGGER IF EXISTS update_global_likes_trigger ON user_likes;

-- Функция для обновления счетчика глобальных лайков
CREATE OR REPLACE FUNCTION update_global_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO global_likes (fragment_id, like_count, updated_at)
    VALUES (NEW.fragment_id, 1, NOW())
    ON CONFLICT (fragment_id)
    DO UPDATE SET 
      like_count = global_likes.like_count + 1,
      updated_at = NOW();
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE global_likes
    SET like_count = GREATEST(0, like_count - 1),
        updated_at = NOW()
    WHERE fragment_id = OLD.fragment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер
CREATE TRIGGER update_global_likes_trigger
AFTER INSERT OR DELETE ON user_likes
FOR EACH ROW
EXECUTE FUNCTION update_global_likes_count();

-- Пересчитываем текущие лайки
INSERT INTO global_likes (fragment_id, like_count)
SELECT fragment_id, COUNT(*) as like_count
FROM user_likes
GROUP BY fragment_id
ON CONFLICT (fragment_id) DO UPDATE
SET like_count = EXCLUDED.like_count,
    updated_at = NOW();