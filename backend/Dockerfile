# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Установка зависимостей
COPY package*.json ./
RUN npm install

# Копирование всех файлов
COPY . .

# Явное копирование init-db.sh (на случай, если .dockerignore блокирует)
COPY init-db.sh ./

# Создание папки для загрузок
RUN mkdir -p uploads/turnover

# Установка прав на скрипт
RUN chmod +x init-db.sh

# Генерация Prisma клиента
RUN npx prisma generate

# Установка LibreOffice для конвертации документов в PDF
RUN apk add --no-cache libreoffice
# Установка кириллических и универсальных шрифтов
RUN apk add --no-cache font-noto ttf-dejavu ttf-liberation

EXPOSE 3001

# Запуск инициализации и сервера напрямую (используем db push вместо migrate deploy)
CMD ["sh", "-c", "npx prisma db push && npx prisma generate && npm run seed && node server.js"]
