#!/bin/bash
echo "🔄 Перезапуск бэкенда..."
cd /home/sandek/scud-portal
docker compose -f docker-compose.prod.yml restart backend
echo "✅ Бэкенд перезапущен!"
echo "🌐 API: http://82.202.140.145:3001" 