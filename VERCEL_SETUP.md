# Настройка Vercel и Supabase

## 1. Настройка базы данных Supabase

1. Зайдите в панель управления Supabase: https://app.supabase.com/project/nfayxrcrzsdxlwpumnwb

2. Перейдите в SQL Editor и выполните скрипт из файла `fix-global-likes.sql`

3. Проверьте, что все таблицы созданы:
   - users
   - user_likes
   - reading_progress
   - global_likes

## 2. Настройка переменных окружения в Vercel

1. Зайдите в настройки проекта на Vercel

2. Перейдите в Settings → Environment Variables

3. Добавьте следующие переменные:

```
VITE_SUPABASE_URL=https://nfayxrcrzsdxlwpumnwb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mYXl4cmNyenNkeGx3cHVtbndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDkyMDUsImV4cCI6MjA2OTE4NTIwNX0.ThWlkSh69luGZPLg_y9FOzc56qp3tvhHB8lUWhmeKvI
VITE_USE_LOCAL_STORAGE=false
```

4. Убедитесь, что переменные добавлены для всех окружений (Production, Preview, Development)

## 3. Деплой

1. Сделайте коммит и пуш в GitHub:
```bash
git add .
git commit -m "Настройка Supabase для продакшена"
git push origin main
```

2. Vercel автоматически задеплоит изменения

## 4. Проверка

После деплоя проверьте:
1. Генерация ключа пользователя работает
2. Лайки сохраняются в базу данных
3. Избранное показывает только те абзацы, которые вы лайкнули
4. Глобальные лайки отображаются корректно

## Отладка

Если что-то не работает:

1. Проверьте логи в Vercel: Functions → Logs
2. Проверьте логи в Supabase: Logs → API
3. Убедитесь, что RLS политики настроены правильно
4. Проверьте, что переменные окружения доступны в браузере (они должны начинаться с VITE_)