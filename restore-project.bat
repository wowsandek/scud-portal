@echo off
echo ========================================
echo SCUD Portal - Project Restore
echo ========================================

:: Проверяем наличие папки backups
if not exist "backups" (
    echo ❌ No backups folder found!
    pause
    exit /b 1
)

:: Показываем доступные бэкапы
echo Available backups:
echo.
dir /B /AD backups\scud_project_* 2>nul
if %errorlevel% neq 0 (
    echo ❌ No project backups found!
    pause
    exit /b 1
)

echo.
set /p backup_name="Enter backup folder name (without 'backups\'): "

:: Проверяем существование указанного бэкапа
if not exist "backups\%backup_name%" (
    echo ❌ Backup folder not found: backups\%backup_name%
    pause
    exit /b 1
)

echo.
echo ⚠️  WARNING: This will overwrite current project files!
echo.
set /p confirm="Are you sure? (y/N): "
if /i not "%confirm%"=="y" (
    echo Restore cancelled.
    pause
    exit /b 0
)

echo.
echo Restoring from: backups\%backup_name%

:: Останавливаем серверы если запущены
echo Stopping servers...
taskkill /f /im node.exe 2>nul

:: Восстанавливаем backend
echo Restoring backend...
if exist "backend" rmdir /s /q backend
xcopy /E /I /Y "backups\%backup_name%\backend" backend

:: Восстанавливаем frontend  
echo Restoring frontend...
if exist "frontend" rmdir /s /q frontend
xcopy /E /I /Y "backups\%backup_name%\frontend" frontend

:: Восстанавливаем конфигурационные файлы
echo Restoring config files...
copy "backups\%backup_name%\docker-compose.yml" . 2>nul
copy "backups\%backup_name%\backup-database.bat" . 2>nul
copy "backups\%backup_name%\backup-project.bat" . 2>nul

:: Восстанавливаем базу данных
echo Restoring database...
if exist "backups\%backup_name%\database_backup.sql" (
    psql -h localhost -U postgres -d scudsystem < "backups\%backup_name%\database_backup.sql"
    if %errorlevel% equ 0 (
        echo ✅ Database restored successfully!
    ) else (
        echo ⚠️  Database restore failed. You may need to restore manually.
    )
) else (
    echo ⚠️  No database backup found in this backup.
)

echo.
echo ✅ Project restored successfully!
echo.
echo Next steps:
echo 1. Install dependencies: npm install in backend/ and frontend/
echo 2. Run migrations: npx prisma migrate deploy
echo 3. Start servers: node server.js and npm run dev
echo.

pause 