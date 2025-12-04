#!/bin/bash

echo "🚀 Деплой на Railway..."

git add .
git commit -m "deploy: $(date '+%Y-%m-%d %H:%M')" 2>/dev/null || echo "Нет изменений для коммита"
git push origin main 2>/dev/null || git push origin master

echo "✅ Готово! Railway автоматически обновит приложение через 1-2 минуты"
