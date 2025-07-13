@echo off
echo ========================================
echo   Запуск SCUD Portal в режиме разработки
echo ========================================

echo.
echo 1. Остановка контейнеров...
docker compose down

echo.
echo 2. Пересборка контейнеров...
docker compose -f docker-compose.dev.yml build --no-cache

echo.
echo 3. Запуск контейнеров для разработки...
docker compose -f docker-compose.dev.yml up -d

echo.
echo 4. Проверка статуса...
docker compose -f docker-compose.dev.yml ps

echo.
echo ========================================
echo   Проект запущен в режиме разработки!
echo ========================================
echo.
echo Сайт доступен: http://localhost:3000
echo API доступен: http://localhost:3001
echo База данных: localhost:5432
echo.
pause 