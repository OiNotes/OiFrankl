-- ВРЕМЕННОЕ РЕШЕНИЕ: Отключаем все триггеры

-- 1. Удаляем ВСЕ триггеры на user_likes
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

-- 2. Удаляем ВСЕ функции связанные с global_likes
DROP FUNCTION IF EXISTS update_global_likes() CASCADE;
DROP FUNCTION IF EXISTS update_global_likes_count() CASCADE;
DROP FUNCTION IF EXISTS sync_global_likes() CASCADE;
DROP FUNCTION IF EXISTS sync_global_likes_correctly() CASCADE;

-- 3. Проверяем что триггеров больше нет
SELECT 'Триггеры после удаления:' as status;
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'user_likes';

-- 4. Теперь приложение должно работать без ошибок (но без автоматического подсчета в global_likes)