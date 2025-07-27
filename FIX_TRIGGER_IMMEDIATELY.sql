-- ИСПРАВЛЕНИЕ ТРИГГЕРА ДЛЯ global_likes
-- Проблема: триггер использует "count" вместо "like_count"

-- 1. Удаляем старый триггер
DROP TRIGGER IF EXISTS update_global_likes_on_insert ON user_likes;
DROP TRIGGER IF EXISTS update_global_likes_on_delete ON user_likes;
DROP FUNCTION IF EXISTS update_global_likes();

-- 2. Создаем правильную функцию
CREATE OR REPLACE FUNCTION update_global_likes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO global_likes (fragment_id, like_count)
    VALUES (NEW.fragment_id, 1)
    ON CONFLICT (fragment_id)
    DO UPDATE SET
      like_count = global_likes.like_count + 1,
      updated_at = CURRENT_TIMESTAMP;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE global_likes
    SET 
      like_count = GREATEST(like_count - 1, 0),
      updated_at = CURRENT_TIMESTAMP
    WHERE fragment_id = OLD.fragment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Создаем триггеры
CREATE TRIGGER update_global_likes_on_insert
AFTER INSERT ON user_likes
FOR EACH ROW EXECUTE FUNCTION update_global_likes();

CREATE TRIGGER update_global_likes_on_delete
AFTER DELETE ON user_likes
FOR EACH ROW EXECUTE FUNCTION update_global_likes();

-- 4. Пересчитываем текущие лайки
INSERT INTO global_likes (fragment_id, like_count)
SELECT fragment_id, COUNT(*) as like_count
FROM user_likes
GROUP BY fragment_id
ON CONFLICT (fragment_id)
DO UPDATE SET 
  like_count = EXCLUDED.like_count,
  updated_at = CURRENT_TIMESTAMP;