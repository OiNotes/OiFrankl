# Инструкции по запуску проекта

## 1. Загрузка на GitHub

Я уже подготовил проект к загрузке. Теперь вам нужно:

1. Убедитесь, что у вас есть доступ к репозиторию https://github.com/OiNotes/OiFrankl
2. Выполните в терминале:

```bash
cd /Users/sile/Documents/Book\ Frankl/frankl-reader

# Если нужно изменить URL репозитория:
git remote set-url origin https://github.com/OiNotes/OiFrankl.git

# Загрузите код (может попросить логин/пароль GitHub):
git push -u origin main
```

Альтернативно через GitHub Desktop:
1. Откройте GitHub Desktop
2. Add → Add Existing Repository
3. Выберите папку `/Users/sile/Documents/Book Frankl/frankl-reader`
4. Publish repository

## 2. Настройка Supabase

1. Зайдите в ваш проект Supabase
2. Откройте SQL Editor
3. Скопируйте и выполните этот SQL:

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

4. В Settings → API скопируйте:
   - Project URL (начинается с https://)
   - Anon public key

## 3. Настройка Vercel

### Вариант А: Через интерфейс Vercel

1. Зайдите на vercel.com
2. New Project → Import Git Repository
3. Выберите репозиторий OiFrankl
4. В Environment Variables добавьте:
   - `VITE_SUPABASE_URL` = ваш URL из Supabase
   - `VITE_SUPABASE_ANON_KEY` = ваш ключ из Supabase
5. Deploy

### Вариант Б: Через Vercel CLI

```bash
# Установите Vercel CLI
npm i -g vercel

# В папке проекта
cd /Users/sile/Documents/Book\ Frankl/frankl-reader

# Логин
vercel login

# Деплой
vercel

# Следуйте инструкциям:
# - Set up and deploy: Y
# - Which scope: выберите ваш аккаунт
# - Link to existing project: N
# - Project name: oifrankl (или любое другое)
# - Directory: ./
# - Override settings: N
```

После первого деплоя добавьте переменные:

```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Повторный деплой с переменными
vercel --prod
```

## 4. Проверка

1. Откройте ваш сайт на Vercel
2. Создайте новый ключ
3. Прочитайте несколько фрагментов
4. Поставьте лайки
5. Откройте сайт с другого устройства с тем же ключом
6. Убедитесь, что прогресс синхронизировался

## Возможные проблемы

### "Permission denied" при push на GitHub
- Убедитесь, что вы владелец репозитория OiNotes
- Или добавьте себя как collaborator в Settings репозитория

### Не работает Supabase
- Проверьте, что SQL выполнился без ошибок
- Проверьте правильность URL и ключа
- Убедитесь, что переменные добавлены в Vercel

### Сайт не открывается
- Проверьте логи в Vercel Dashboard
- Убедитесь, что build прошел успешно