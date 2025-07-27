# Проверка настройки Supabase

## Проблема
Переменные окружения работают, но запросы к базе данных возвращают ошибки.

## Что нужно проверить в Supabase Dashboard

### 1. Проверьте статус проекта
- Откройте https://app.supabase.com
- Выберите проект `nfayxrcrzsdxlwpumnwb`
- Убедитесь, что проект **активен** (не приостановлен)

### 2. Проверьте настройки аутентификации
**Settings → API → Project API keys:**
- Убедитесь, что `anon` ключ совпадает с тем, что в Vercel
- Проверьте, что ключ активен

### 3. Проверьте RLS политики
**Table Editor → выберите таблицу → RLS Policies:**

Для таблицы **users**:
- ✅ Должна быть политика для SELECT (чтение)
- ✅ Должна быть политика для INSERT (создание)
- Политики должны разрешать анонимный доступ

Для таблицы **user_likes**:
- ✅ Политики для SELECT, INSERT, DELETE

Для таблицы **global_likes**:
- ✅ Политики для SELECT, INSERT, UPDATE

### 4. Проверьте CORS настройки
**Settings → API → CORS:**
- Добавьте ваш домен Vercel в разрешенные источники
- Или используйте `*` для разрешения всех источников (временно для теста)

### 5. Проверьте таблицы
**Table Editor:**
- Убедитесь, что таблицы существуют:
  - `users` (columns: id, user_key, created_at)
  - `user_likes` (columns: id, user_id, fragment_id, created_at)
  - `global_likes` (columns: id, fragment_id, like_count, updated_at)

## Быстрый тест

1. Откройте `test-supabase-prod.html` в браузере
2. Нажмите кнопки тестов по порядку
3. Посмотрите, какие именно ошибки возникают

## Если RLS блокирует запросы

Выполните в SQL Editor Supabase:

```sql
-- Временно отключить RLS для тестирования
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE global_likes DISABLE ROW LEVEL SECURITY;

-- После теста включить обратно
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_likes ENABLE ROW LEVEL SECURITY;
```

## Правильные RLS политики

```sql
-- Политики для users
CREATE POLICY "Anyone can read users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create users" ON users
  FOR INSERT WITH CHECK (true);

-- Политики для user_likes
CREATE POLICY "Anyone can read likes" ON user_likes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can manage their likes" ON user_likes
  FOR ALL USING (true);

-- Политики для global_likes
CREATE POLICY "Anyone can read global likes" ON global_likes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update global likes" ON global_likes
  FOR ALL USING (true);
```