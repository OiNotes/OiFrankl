#!/bin/bash

# Скрипт для настройки переменных окружения в Vercel
# Использование: ./setup-vercel-env.sh

echo "🚀 Настройка переменных окружения для Vercel"
echo "============================================"

# Проверяем, установлен ли Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI не установлен!"
    echo "Установите его командой: npm i -g vercel"
    exit 1
fi

# Проверяем, есть ли файл .env.local
if [ ! -f ".env.local" ]; then
    echo "❌ Файл .env.local не найден!"
    exit 1
fi

echo "📋 Читаем переменные из .env.local..."

# Читаем переменные из .env.local
source .env.local

# Проверяем, что все переменные установлены
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Не все переменные найдены в .env.local!"
    exit 1
fi

echo ""
echo "Найдены переменные:"
echo "  VITE_SUPABASE_URL = ${VITE_SUPABASE_URL}"
echo "  VITE_SUPABASE_ANON_KEY = ${VITE_SUPABASE_ANON_KEY:0:20}..."
echo "  VITE_USE_LOCAL_STORAGE = ${VITE_USE_LOCAL_STORAGE:-false}"
echo ""

# Спрашиваем подтверждение
read -p "Продолжить установку этих переменных в Vercel? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Отменено пользователем"
    exit 0
fi

echo ""
echo "🔧 Устанавливаем переменные окружения в Vercel..."
echo ""

# Устанавливаем переменные
echo "1. Устанавливаем VITE_SUPABASE_URL..."
echo "$VITE_SUPABASE_URL" | vercel env add VITE_SUPABASE_URL production preview development

echo ""
echo "2. Устанавливаем VITE_SUPABASE_ANON_KEY..."
echo "$VITE_SUPABASE_ANON_KEY" | vercel env add VITE_SUPABASE_ANON_KEY production preview development

echo ""
echo "3. Устанавливаем VITE_USE_LOCAL_STORAGE..."
echo "${VITE_USE_LOCAL_STORAGE:-false}" | vercel env add VITE_USE_LOCAL_STORAGE production preview development

echo ""
echo "✅ Переменные окружения успешно установлены!"
echo ""
echo "Теперь вы можете:"
echo "1. Выполнить деплой: vercel --prod"
echo "2. Или дождаться автоматического деплоя после push в GitHub"
echo ""
echo "После деплоя проверьте консоль браузера на продакшене."