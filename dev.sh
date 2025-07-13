#!/bin/bash

echo "🛠️  Запуск SCUD Portal в режиме разработки..."

# Остановка контейнеров
echo "📦 Останавливаем контейнеры..."
docker compose down

# Пересборка контейнеров
echo "🔨 Пересобираем контейнеры..."
docker compose -f docker-compose.dev.yml build --no-cache

# Запуск контейнеров
echo "🚀 Запускаем контейнеры для разработки..."
docker compose -f docker-compose.dev.yml up -d

# Проверка статуса
echo "✅ Проверяем статус..."
docker compose -f docker-compose.dev.yml ps

echo "🎉 Проект запущен в режиме разработки!"
echo "🌐 Сайт доступен по адресу: http://localhost:3000"
echo "🔧 API доступен по адресу: http://localhost:3001"
echo "🗄️  База данных доступна по адресу: localhost:5432" 