#!/bin/sh

# Ждем, пока база данных будет готова
echo "Waiting for database to be ready..."
npx prisma db push

# Применяем миграции
echo "Applying migrations..."
npx prisma migrate deploy

# Генерируем Prisma клиент
echo "Generating Prisma client..."
npx prisma generate

# Запускаем seed для создания админского пользователя
echo "Running seed script..."
npm run seed

echo "Database initialization completed!" 