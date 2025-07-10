# SCUD Portal - Docker Setup

## 🐳 Запуск в Docker

### Предварительные требования
- Docker
- Docker Compose

### Быстрый запуск

1. **Клонируйте репозиторий и перейдите в папку:**
```bash
cd scud-portal
```

2. **Запустите все сервисы:**
```bash
docker-compose up -d
```

3. **Откройте приложение:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- База данных: localhost:5432

### Структура сервисов

- **Frontend** (порт 3000) - Next.js приложение
- **Backend** (порт 3001) - Node.js API с Prisma
- **Database** (порт 5432) - PostgreSQL

### Volumes (данные)

- `postgres_data` - данные базы данных
- `uploads_data` - загруженные файлы товарооборота

### Полезные команды

**Просмотр логов:**
```bash
# Все сервисы
docker-compose logs

# Конкретный сервис
docker-compose logs backend
docker-compose logs frontend
```

**Остановка:**
```bash
docker-compose down
```

**Пересборка:**
```bash
docker-compose up -d --build
```

**Очистка данных:**
```bash
docker-compose down -v
```

### Первоначальная настройка

После первого запуска:

1. **Создайте первого арендатора** через API или напрямую в базе
2. **Загрузите тестовые данные** товарооборота
3. **Проверьте работу графиков** на странице товарооборота

### Troubleshooting

**Если база данных не подключается:**
```bash
docker-compose restart backend
```

**Если файлы не загружаются:**
```bash
docker-compose exec backend ls -la uploads/turnover
```

**Проверка логов:**
```bash
docker-compose logs backend | grep -i error
``` 