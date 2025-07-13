@echo off
echo ========================================
echo   Деплой SCUD Portal на продакшен
echo ========================================

echo.
echo 1. Остановка контейнеров...
docker compose down

echo.
echo 2. Получение обновлений с GitHub...
git pull origin main

echo.
set /p delete_db="Удалить базу данных? (y/n): "
if /i "%delete_db%"=="y" (
    echo Удаляем базу данных...
    docker volume rm scud-portal_postgres_data 2>nul
)

echo.
echo 3. Пересборка контейнеров...
docker compose -f docker-compose.prod.yml build --no-cache

echo.
echo 4. Запуск обновлённых контейнеров...
docker compose -f docker-compose.prod.yml up -d

echo.
echo 5. Проверка статуса...
docker compose -f docker-compose.prod.yml ps

echo.
echo ========================================
echo   Деплой завершён!
echo ========================================
echo.
echo Сайт доступен: http://82.202.140.145:3000
echo API доступен: http://82.202.140.145:3001
echo.
pause 