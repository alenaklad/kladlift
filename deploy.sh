#!/bin/bash

echo "🚀 Деплой на Railway..."

if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
  echo "❌ Ошибка: GITHUB_PERSONAL_ACCESS_TOKEN не найден в секретах"
  exit 1
fi

REMOTE_URL="https://${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/alenaklad/kladlift.git"

git add .
git commit -m "deploy: $(date '+%Y-%m-%d %H:%M')" 2>/dev/null || echo "Нет новых изменений для коммита"

echo "📥 Синхронизация с GitHub..."
git pull "$REMOTE_URL" main --rebase --autostash

echo "📤 Отправка изменений..."
git push "$REMOTE_URL" main

echo "✅ Готово! Railway автоматически обновит приложение через 1-2 минуты"
