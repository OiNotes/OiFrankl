-- ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ ВСЕХ ПРОБЛЕМ

-- 1. Сначала проверим текущее состояние
SELECT 'Текущие лайки пользователя FRNK-WP46:' as info;
SELECT ul.fragment_id, ul.created_at
FROM user_likes ul
JOIN users u ON u.id = ul.user_id
WHERE u.user_key = 'FRNK-WP46'
ORDER BY ul.fragment_id;

-- 2. Очищаем все лайки для этого пользователя (для чистого старта)
DELETE FROM user_likes
WHERE user_id IN (SELECT id FROM users WHERE user_key = 'FRNK-WP46');

-- 3. Проверяем что триггеры удалены
SELECT 'Текущие триггеры:' as info;
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'user_likes';

-- 4. Если есть триггеры - удаляем их
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT trigger_name 
              FROM information_schema.triggers 
              WHERE event_object_table = 'user_likes')
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.trigger_name || ' ON user_likes CASCADE';
    END LOOP;
END $$;

-- 5. Удаляем все функции связанные с триггерами
DROP FUNCTION IF EXISTS update_global_likes() CASCADE;
DROP FUNCTION IF EXISTS update_global_likes_count() CASCADE;
DROP FUNCTION IF EXISTS sync_global_likes() CASCADE;
DROP FUNCTION IF EXISTS sync_global_likes_correctly() CASCADE;

-- 6. Проверяем итоговое состояние
SELECT 'ФИНАЛЬНАЯ ПРОВЕРКА:' as status;
SELECT 'Лайки пользователя:' as info, COUNT(*) as count
FROM user_likes ul
JOIN users u ON u.id = ul.user_id
WHERE u.user_key = 'FRNK-WP46';

SELECT 'Триггеры на user_likes:' as info, COUNT(*) as count
FROM information_schema.triggers
WHERE event_object_table = 'user_likes';

SELECT 'Готово! Теперь приложение должно работать без ошибок.' as message;