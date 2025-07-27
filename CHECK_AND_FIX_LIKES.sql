-- Проверка и исправление проблемы с лайками

-- 1. Посмотрим какие лайки есть у пользователя FRNK-WP46
SELECT 
    ul.fragment_id,
    ul.created_at,
    u.user_key
FROM user_likes ul
JOIN users u ON u.id = ul.user_id
WHERE u.user_key = 'FRNK-WP46'
ORDER BY ul.fragment_id;

-- 2. Проверим конкретно fragment_id = 5
SELECT COUNT(*) as likes_count
FROM user_likes ul
JOIN users u ON u.id = ul.user_id
WHERE u.user_key = 'FRNK-WP46' AND ul.fragment_id = 5;

-- 3. Если нужно, удалим дубликаты для этого пользователя
DELETE FROM user_likes
WHERE user_id IN (SELECT id FROM users WHERE user_key = 'FRNK-WP46');

-- 4. Проверим что все удалено
SELECT 'После очистки:' as status;
SELECT COUNT(*) as total_likes
FROM user_likes ul
JOIN users u ON u.id = ul.user_id
WHERE u.user_key = 'FRNK-WP46';