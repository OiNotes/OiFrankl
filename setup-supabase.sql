-- Создание таблиц для Frankl Reader

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица лайков пользователей
CREATE TABLE IF NOT EXISTS user_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  fragment_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, fragment_id)
);

-- Таблица прогресса чтения
CREATE TABLE IF NOT EXISTS reading_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  current_index INTEGER DEFAULT 0,
  view_mode TEXT DEFAULT 'original',
  total_read INTEGER DEFAULT 0,
  read_fragments INTEGER[] DEFAULT '{}',
  last_read TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица глобальных лайков
CREATE TABLE IF NOT EXISTS global_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fragment_id INTEGER UNIQUE NOT NULL,
  like_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Включаем RLS для всех таблиц
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_likes ENABLE ROW LEVEL SECURITY;

-- Политики для таблицы users
-- Разрешаем анонимным пользователям создавать новых пользователей
CREATE POLICY "Anyone can create users" ON users
  FOR INSERT WITH CHECK (true);

-- Разрешаем чтение всех пользователей
CREATE POLICY "Anyone can read users" ON users
  FOR SELECT USING (true);

-- Политики для таблицы user_likes
-- Разрешаем пользователям добавлять лайки
CREATE POLICY "Anyone can insert likes" ON user_likes
  FOR INSERT WITH CHECK (true);

-- Разрешаем чтение всех лайков
CREATE POLICY "Anyone can read likes" ON user_likes
  FOR SELECT USING (true);

-- Разрешаем удаление лайков
CREATE POLICY "Anyone can delete likes" ON user_likes
  FOR DELETE USING (true);

-- Политики для таблицы reading_progress
-- Разрешаем вставку прогресса
CREATE POLICY "Anyone can insert progress" ON reading_progress
  FOR INSERT WITH CHECK (true);

-- Разрешаем чтение прогресса
CREATE POLICY "Anyone can read progress" ON reading_progress
  FOR SELECT USING (true);

-- Разрешаем обновление прогресса
CREATE POLICY "Anyone can update progress" ON reading_progress
  FOR UPDATE USING (true);

-- Политики для таблицы global_likes
-- Разрешаем чтение глобальных лайков
CREATE POLICY "Anyone can read global likes" ON global_likes
  FOR SELECT USING (true);

-- Разрешаем вставку глобальных лайков
CREATE POLICY "Anyone can insert global likes" ON global_likes
  FOR INSERT WITH CHECK (true);

-- Разрешаем обновление глобальных лайков
CREATE POLICY "Anyone can update global likes" ON global_likes
  FOR UPDATE USING (true);

-- Создаем индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_user_likes_user_id ON user_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_fragment_id ON user_likes(fragment_id);
CREATE INDEX IF NOT EXISTS idx_users_user_key ON users(user_key);
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_global_likes_fragment_id ON global_likes(fragment_id);

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

-- Создаем триггер для автоматического обновления глобальных лайков
DROP TRIGGER IF EXISTS update_global_likes_trigger ON user_likes;
CREATE TRIGGER update_global_likes_trigger
AFTER INSERT OR DELETE ON user_likes
FOR EACH ROW
EXECUTE FUNCTION update_global_likes_count();