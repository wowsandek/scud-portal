# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Установка зависимостей
COPY package*.json ./
RUN npm install

# Копирование исходного кода
COPY prisma ./prisma
COPY routes ./routes
COPY server.js ./
COPY .env ./

# Создание папки для загрузок
RUN mkdir -p uploads/turnover

# Копирование скрипта инициализации
COPY init-db.sh ./
RUN chmod +x init-db.sh

# Генерация Prisma клиента
RUN npx prisma generate

EXPOSE 3001

# Запуск инициализации и сервера
CMD ["sh", "-c", "./init-db.sh && node server.js"]
