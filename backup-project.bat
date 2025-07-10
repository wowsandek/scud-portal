@echo off
echo ========================================
echo SCUD Portal - Full Project Backup
echo ========================================

:: Создаем папку для бэкапов если её нет
if not exist "backups" mkdir backups

:: Получаем текущую дату и время
set datetime=%date:~-4,4%-%date:~-7,2%-%date:~-10,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set datetime=%datetime: =0%

:: Имя папки бэкапа
set backup_folder=backups\scud_project_%datetime%

echo Creating project backup: %backup_folder%

:: Создаем папку для бэкапа
mkdir %backup_folder%

:: Копируем основные папки проекта
echo Copying backend...
xcopy /E /I /Y backend %backup_folder%\backend

echo Copying frontend...
xcopy /E /I /Y frontend %backup_folder%\frontend

:: Копируем конфигурационные файлы
echo Copying config files...
copy docker-compose.yml %backup_folder%\
copy backup-database.bat %backup_folder%\
copy backup-project.bat %backup_folder%\

:: Создаем бэкап базы данных
echo Creating database backup...
pg_dump -h localhost -U postgres -d scudsystem > %backup_folder%\database_backup.sql

:: Создаем README с информацией о бэкапе
echo Creating backup info...
(
echo SCUD Portal Backup
echo ==================
echo.
echo Backup created: %date% %time%
echo.
echo Contents:
echo - Backend code
echo - Frontend code  
echo - Database dump
echo - Configuration files
echo.
echo To restore:
echo 1. Install dependencies: npm install in backend/ and frontend/
echo 2. Restore database: psql -h localhost -U postgres -d scudsystem ^< database_backup.sql
echo 3. Run migrations: npx prisma migrate deploy
echo 4. Start servers: node server.js and npm run dev
) > %backup_folder%\README_BACKUP.txt

echo.
echo ✅ Full project backup created successfully!
echo 📁 Backup location: %backup_folder%
echo.

:: Показываем размер бэкапа
for /f "tokens=3" %%a in ('dir /s "%backup_folder%" ^| find "File(s)"') do set size=%%a
echo 📊 Backup size: %size%

echo.
echo Press any key to continue...
pause > nul 