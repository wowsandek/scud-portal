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

# Ждем запуска базы данных
echo "⏳ Ждем запуска базы данных..."
sleep 10

# Инициализация админа
echo "🔐 Инициализируем админа..."
docker compose -f docker-compose.dev.yml exec backend node scripts/init-admin.js

# Проверка статуса
echo "✅ Проверяем статус..."
docker compose -f docker-compose.dev.yml ps

echo "🎉 Проект запущен в режиме разработки!"
echo "🌐 Сайт доступен по адресу: http://localhost:3000"
echo "🔧 API доступен по адресу: http://localhost:3001"
echo "🔐 Админ-панель: http://localhost:3000/admin-login" 