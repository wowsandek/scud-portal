# 🚀 Деплой SCUD Portal

## 📁 Файлы конфигурации

### `docker-compose.dev.yml` - Локальная разработка
- Использует `localhost` адреса
- Для разработки на локальной машине

### `docker-compose.prod.yml` - Продакшен
- Использует IP сервера `82.202.140.145`
- Для деплоя на продакшен сервер

## 🛠️ Команды для разработки

### Запуск в режиме разработки:
```bash
./dev.sh
```
или
```bash
docker compose -f docker-compose.dev.yml up -d
```

### Остановка:
```bash
docker compose -f docker-compose.dev.yml down
```

## 🚀 Команды для продакшена

### Автоматический деплой:
```bash
./deploy.sh
```

### Ручной деплой:
```bash
# Остановка
docker compose down

# Получение обновлений
git pull origin main

# Пересборка и запуск
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

## 🗑️ Очистка базы данных

### Удаление volume с БД:
```bash
sudo docker volume rm scud-portal_postgres_data
```

### Полная очистка (включая БД):
```bash
docker compose down
sudo docker volume rm scud-portal_postgres_data
docker compose -f docker-compose.prod.yml up -d
```

## 📋 Проверка работы

### Статус контейнеров:
```bash
docker compose -f docker-compose.prod.yml ps
```

### Логи:
```bash
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend
```

### Проверка API:
```bash
curl http://82.202.140.145:3001/health
```

## 🌐 Доступные адреса

### Продакшен:
- **Сайт:** http://82.202.140.145:3000
- **API:** http://82.202.140.145:3001
- **База данных:** localhost:5432

### Разработка:
- **Сайт:** http://localhost:3000
- **API:** http://localhost:3001
- **База данных:** localhost:5432

## ⚠️ Важные моменты

1. **Всегда используйте правильный файл конфигурации:**
   - `docker-compose.dev.yml` для разработки
   - `docker-compose.prod.yml` для продакшена

2. **При изменении IP сервера** обновите `docker-compose.prod.yml`

3. **При проблемах с БД** используйте полную очистку

4. **Скрипт `deploy.sh`** автоматически спросит про удаление БД 