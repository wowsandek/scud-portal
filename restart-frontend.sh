#!/bin/bash
echo "🔄 Перезапуск фронтенда..."
cd /home/sandek/scud-portal
docker compose -f docker-compose.prod.yml restart frontend
echo "✅ Фронтенд перезапущен!"
echo "🌐 Сайт: http://82.202.140.145:3000" 