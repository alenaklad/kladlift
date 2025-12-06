#!/bin/bash

echo "🚀 Деплой на Railway..."

if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
  echo "❌ Ошибка: GITHUB_PERSONAL_ACCESS_TOKEN не найден в секретах"
  exit 1
fi

git add .
git commit -m "deploy: $(date '+%Y-%m-%d %H:%M')" 2>/dev/null || echo "Нет изменений для коммита"

git push https://${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/alenaklad/kladlift.git main

echo "✅ Готово! Railway автоматически обновит приложение через 1-2 минуты"
