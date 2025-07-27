-- Проверка текущего состояния триггеров и функций

-- 1. Посмотрим все триггеры на таблице user_likes
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'user_likes';

-- 2. Проверим текст функции update_global_likes
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'update_global_likes';

-- 3. Проверим структуру таблицы global_likes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'global_likes' 
ORDER BY ordinal_position;

-- 4. Проверим есть ли данные в global_likes
SELECT * FROM global_likes LIMIT 5;