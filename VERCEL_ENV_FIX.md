# 🚨 СРОЧНО: Исправление ошибки 401 на продакшене

## Проблема
На продакшене приложение не может подключиться к Supabase из-за отсутствующих переменных окружения. Ошибка: **401 Unauthorized - Invalid API key**.

## Решение

### Вариант 1: Через Vercel Dashboard (Рекомендуется)

1. **Откройте Vercel Dashboard**
   - Перейдите на https://vercel.com/dashboard
   - Выберите проект `frankl-reader`

2. **Перейдите в Settings → Environment Variables**

3. **Добавьте три переменные** (нажмите "Add New" для каждой):

   **Переменная 1:**
   - Key: `VITE_SUPABASE_URL`
   - Value: `https://nfayxrcrzsdxlwpumnwb.supabase.co`
   - Environment: ✅ Production ✅ Preview ✅ Development

   **Переменная 2:**
   - Key: `VITE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mYXl4cmNyenNkeGx3cHVtbndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDkyMDUsImV4cCI6MjA2OTE4NTIwNX0.ThWlkSh69luGZPLg_y9FOzc56qp3tvhHB8lUWhmeKvI`
   - Environment: ✅ Production ✅ Preview ✅ Development

   **Переменная 3:**
   - Key: `VITE_USE_LOCAL_STORAGE`
   - Value: `false`
   - Environment: ✅ Production ✅ Preview ✅ Development

4. **Передеплойте приложение**
   - Нажмите на вкладку "Deployments"
   - Нажмите на три точки рядом с последним деплоем
   - Выберите "Redeploy"

### Вариант 2: Через CLI (если есть доступ)

```bash
# В директории проекта выполните:
chmod +x setup-vercel-env.sh
./setup-vercel-env.sh

# Следуйте инструкциям скрипта
```

### Вариант 3: Ручная установка через CLI

```bash
# Установите Vercel CLI если нет
npm i -g vercel

# Установите переменные
vercel env add VITE_SUPABASE_URL production preview development
# Введите: https://nfayxrcrzsdxlwpumnwb.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production preview development
# Введите ключ из .env.local

vercel env add VITE_USE_LOCAL_STORAGE production preview development
# Введите: false

# Передеплойте
vercel --prod
```

## Проверка

После деплоя откройте консоль браузера на продакшене. Вы должны увидеть:
- ✅ VITE_SUPABASE_URL: https://nfayxrcrzsdxlwpumnwb.supabase.co
- ✅ VITE_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5c...
- ✅ VITE_USE_LOCAL_STORAGE: false

Вместо:
- ❌ VITE_SUPABASE_URL: NOT SET
- ❌ VITE_SUPABASE_ANON_KEY: NOT SET

## Почему это произошло?

Vercel не читает переменные из файлов `.env` автоматически. Переменные должны быть установлены через:
- Vercel Dashboard
- Vercel CLI
- GitHub интеграцию с секретами

Поле `env` в `vercel.json` не поддерживается для установки переменных окружения.