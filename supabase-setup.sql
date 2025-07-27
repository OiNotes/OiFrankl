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

-- Политики для записи
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (user_key IS NOT NULL);
CREATE POLICY "Users can update own progress" ON reading_progress FOR ALL USING (true);
CREATE POLICY "Users can manage own likes" ON user_likes FOR ALL USING (true);