-- ПОЛНАЯ ОЧИСТКА И ПЕРЕСОЗДАНИЕ ТРИГГЕРОВ

-- 1. Удаляем ВСЕ связанные триггеры
DROP TRIGGER IF EXISTS update_global_likes_on_insert ON user_likes CASCADE;
DROP TRIGGER IF EXISTS update_global_likes_on_delete ON user_likes CASCADE;
DROP TRIGGER IF EXISTS update_global_likes_count ON user_likes CASCADE;
DROP TRIGGER IF EXISTS sync_global_likes ON user_likes CASCADE;

-- 2. Удаляем ВСЕ связанные функции
DROP FUNCTION IF EXISTS update_global_likes() CASCADE;
DROP FUNCTION IF EXISTS update_global_likes_count() CASCADE;
DROP FUNCTION IF EXISTS sync_global_likes() CASCADE;

-- 3. Очищаем таблицу global_likes для чистого старта
TRUNCATE TABLE global_likes;

-- 4. Создаем НОВУЮ функцию с правильным именем колонки
CREATE OR REPLACE FUNCTION sync_global_likes_correctly()
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

-- 5. Создаем новые триггеры с уникальными именами
CREATE TRIGGER sync_likes_on_insert
AFTER INSERT ON user_likes
FOR EACH ROW EXECUTE FUNCTION sync_global_likes_correctly();

CREATE TRIGGER sync_likes_on_delete
AFTER DELETE ON user_likes
FOR EACH ROW EXECUTE FUNCTION sync_global_likes_correctly();

-- 6. Пересчитываем все лайки из user_likes
INSERT INTO global_likes (fragment_id, like_count)
SELECT fragment_id, COUNT(*) as like_count
FROM user_likes
GROUP BY fragment_id
ON CONFLICT (fragment_id)
DO UPDATE SET 
  like_count = EXCLUDED.like_count,
  updated_at = CURRENT_TIMESTAMP;

-- 7. Проверяем результат
SELECT 'Триггеры пересозданы. Текущие лайки:' as status;
SELECT fragment_id, like_count FROM global_likes ORDER BY fragment_id;