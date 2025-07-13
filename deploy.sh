#!/bin/bash

echo "🚀 Начинаем деплой SCUD Portal на продакшен..."

# Остановка контейнеров
echo "📦 Останавливаем контейнеры..."
docker compose down

# Получение обновлений с GitHub
echo "📥 Получаем обновления с GitHub..."
git pull origin main

# Удаление старой базы данных (опционально)
read -p "🗑️  Удалить базу данных? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Удаляем базу данных..."
    sudo docker volume rm scud-portal_postgres_data 2>/dev/null || true
fi

# Пересборка контейнеров
echo "🔨 Пересобираем контейнеры..."
docker compose -f docker-compose.prod.yml build --no-cache

# Запуск контейнеров
echo "🚀 Запускаем обновлённые контейнеры..."
docker compose -f docker-compose.prod.yml up -d

# Проверка статуса
echo "✅ Проверяем статус..."
docker compose -f docker-compose.prod.yml ps

# Проверка логов
echo "📋 Проверяем логи backend..."
docker compose -f docker-compose.prod.yml logs backend --tail=20

echo "🎉 Деплой завершён!"
echo "🌐 Сайт доступен по адресу: http://82.202.140.145:3000"
echo "🔧 API доступен по адресу: http://82.202.140.145:3001" 