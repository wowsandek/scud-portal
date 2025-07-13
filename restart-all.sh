#!/bin/bash
echo "🔄 Перезапуск всех сервисов..."
cd /home/sandek/scud-portal
docker compose -f docker-compose.prod.yml restart
echo "✅ Все сервисы перезапущены!"
echo "🌐 Сайт: http://82.202.140.145:3000"
echo "🔧 API: http://82.202.140.145:3001" 