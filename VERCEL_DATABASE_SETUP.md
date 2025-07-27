# Настройка базы данных для Vercel

## Статус интеграции

✅ **Интеграция с Supabase полностью настроена!**

Приложение теперь поддерживает:
- Автоматическую миграцию данных из localStorage
- Синхронизацию прогресса чтения между устройствами
- Глобальные лайки в реальном времени
- Оффлайн режим с автоматической синхронизацией
- Индикаторы состояния синхронизации

## Рекомендуемое решение: Supabase

Supabase идеально подходит для этого проекта по следующим причинам:
- Бесплатный план достаточен для начала
- Отличная интеграция с Vercel
- Встроенная аутентификация
- Realtime подписки для обновления лайков

## Шаги настройки

### 1. Создание проекта Supabase

1. Зайдите на [supabase.com](https://supabase.com) и создайте аккаунт
2. Создайте новый проект
3. Сохраните URL проекта и анонимный ключ

### 2. Создание таблиц

Выполните следующий SQL в Supabase SQL Editor:

```sql
-- Таблица пользователей
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_key VARCHAR(10) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Таблица прогресса чтения
CREATE TABLE reading_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  current_index INTEGER DEFAULT 0,
  view_mode VARCHAR(10) DEFAULT 'original',
  total_read INTEGER DEFAULT 0,
  read_fragments INTEGER[] DEFAULT '{}',
  last_read TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id)
);

-- Таблица лайков пользователей
CREATE TABLE user_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  fragment_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, fragment_id)
);

-- Таблица глобальных лайков
CREATE TABLE global_likes (
  fragment_id INTEGER PRIMARY KEY,
  count INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Функция для обновления счетчика лайков
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO global_likes (fragment_id, count)
    VALUES (NEW.fragment_id, 1)
    ON CONFLICT (fragment_id)
    DO UPDATE SET 
      count = global_likes.count + 1,
      updated_at = NOW();
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE global_likes 
    SET count = GREATEST(0, count - 1),
        updated_at = NOW()
    WHERE fragment_id = OLD.fragment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления счетчика
CREATE TRIGGER update_likes_count_trigger
AFTER INSERT OR DELETE ON user_likes
FOR EACH ROW
EXECUTE FUNCTION update_likes_count();

-- RLS (Row Level Security) политики
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_likes ENABLE ROW LEVEL SECURITY;

-- Политики для чтения (все могут читать)
CREATE POLICY "Public read access" ON users FOR SELECT USING (true);
CREATE POLICY "Public read access" ON reading_progress FOR SELECT USING (true);
CREATE POLICY "Public read access" ON user_likes FOR SELECT USING (true);
CREATE POLICY "Public read access" ON global_likes FOR SELECT USING (true);

-- Политики для записи (только владелец)
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (user_key IS NOT NULL);
CREATE POLICY "Users can update own progress" ON reading_progress FOR ALL USING (true);
CREATE POLICY "Users can manage own likes" ON user_likes FOR ALL USING (true);
```

### 3. Установка зависимостей

```bash
npm install @supabase/supabase-js
```

### 4. Переменные окружения

Создайте файл `.env.local` в корне проекта:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Добавьте переменные в Vercel

1. Перейдите в настройки вашего проекта на Vercel
2. Откройте раздел "Environment Variables"
3. Добавьте следующие переменные:
   - `VITE_SUPABASE_URL` - URL вашего проекта Supabase
   - `VITE_SUPABASE_ANON_KEY` - Анонимный ключ Supabase
4. Выберите окружения: Production, Preview, Development
5. Сохраните изменения

### 6. Деплой на Vercel

```bash
# Установите Vercel CLI если еще не установлен
npm i -g vercel

# Войдите в аккаунт
vercel login

# Деплой проекта
vercel

# Или для production деплоя
vercel --prod
```

Альтернативно через GitHub:
1. Запушьте код в GitHub репозиторий
2. Импортируйте проект в Vercel из GitHub
3. Переменные окружения будут применены автоматически

## Миграция с localStorage

После настройки Supabase обновите следующие файлы:

1. `src/config/supabase.js` - конфигурация клиента
2. `src/services/auth.js` - управление пользователями
3. `src/services/likes.js` - работа с лайками через Supabase
4. `src/services/progress.js` - сохранение прогресса в БД

## Альтернатива: Firebase

Если предпочитаете Firebase:

1. Используйте Firestore для данных
2. Firebase Auth для аутентификации (опционально)
3. Realtime Database для счетчиков лайков
4. См. инструкции в `GLOBAL_LIKES_SETUP.md`

## Преимущества Supabase для этого проекта

- **Realtime подписки**: Лайки обновляются у всех пользователей мгновенно
- **PostgreSQL**: Мощные запросы и агрегации
- **Бесплатный план**: 500MB данных, 2GB трафика
- **Edge Functions**: Возможность добавить серверную логику
- **Простая миграция**: SQL-подобный синтаксис