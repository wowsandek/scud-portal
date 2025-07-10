@echo off
echo ========================================
echo SCUD Portal - Database Backup Script
echo ========================================

:: Создаем папку для бэкапов если её нет
if not exist "backups" mkdir backups

:: Получаем текущую дату и время
set datetime=%date:~-4,4%-%date:~-7,2%-%date:~-10,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set datetime=%datetime: =0%

:: Имя файла бэкапа
set backup_file=backups\scud_database_%datetime%.sql

echo Creating backup: %backup_file%

:: Создаем бэкап базы данных
pg_dump -h localhost -U postgres -d scudsystem > %backup_file%

if %errorlevel% equ 0 (
    echo ✅ Database backup created successfully!
    echo 📁 Backup location: %backup_file%
) else (
    echo ❌ Backup failed! Check your PostgreSQL connection.
)

echo.
echo Press any key to continue...
pause > nul 