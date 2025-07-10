# 🔄 Система бэкапа SCUD Portal

## 📋 Обзор

Эта система обеспечивает надежное резервное копирование всего проекта SCUD Portal, включая:
- Код backend и frontend
- База данных PostgreSQL
- Конфигурационные файлы
- Инструкции по восстановлению

## 🚀 Быстрый старт

### Создание бэкапа базы данных
```bash
backup-database.bat
```

### Создание полного бэкапа проекта
```bash
backup-project.bat
```

### Восстановление из бэкапа
```bash
restore-project.bat
```

## 📁 Структура бэкапов

```
backups/
├── scud_database_2024-01-15_14-30-25.sql    # Бэкап только БД
└── scud_project_2024-01-15_14-30-25/        # Полный бэкап
    ├── backend/                              # Backend код
    ├── frontend/                             # Frontend код
    ├── database_backup.sql                   # Бэкап БД
    ├── docker-compose.yml                    # Docker конфиг
    ├── backup-database.bat                   # Скрипты бэкапа
    ├── backup-project.bat
    └── README_BACKUP.txt                     # Инструкции
```

## 🔧 Ручные команды

### Бэкап базы данных
```bash
pg_dump -h localhost -U postgres -d scudsystem > backup.sql
```

### Восстановление базы данных
```bash
psql -h localhost -U postgres -d scudsystem < backup.sql
```

### Бэкап кода (Git)
```bash
git add .
git commit -m "Backup: $(date)"
git push origin main
```

## ⚠️ Важные моменты

### Перед бэкапом
1. Убедитесь, что PostgreSQL запущен
2. Остановите серверы (если нужно)
3. Проверьте свободное место на диске

### После восстановления
1. Установите зависимости: `npm install`
2. Примените миграции: `npx prisma migrate deploy`
3. Проверьте переменные окружения в `.env`
4. Запустите серверы

## 🔄 Автоматизация

### Планировщик задач Windows
1. Откройте "Планировщик задач"
2. Создайте новую задачу
3. Укажите путь к `backup-project.bat`
4. Установите расписание (например, ежедневно в 2:00)

### PowerShell скрипт для автоматизации
```powershell
# Создать бэкап и отправить на внешний диск
$backup_script = "C:\scud-portal\backup-project.bat"
$external_drive = "D:\backups\"

# Запустить бэкап
& $backup_script

# Скопировать на внешний диск
$latest_backup = Get-ChildItem "C:\scud-portal\backups" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Copy-Item $latest_backup.FullName $external_drive -Recurse
```

## 🛡️ Безопасность

### Рекомендации
- Храните бэкапы на отдельном диске
- Используйте шифрование для чувствительных данных
- Регулярно тестируйте восстановление
- Документируйте изменения в системе

### Критические файлы
- `.env` - переменные окружения
- `database_backup.sql` - данные пользователей
- `prisma/schema.prisma` - структура БД

## 📞 Поддержка

При проблемах с бэкапом:
1. Проверьте логи PostgreSQL
2. Убедитесь в правах доступа
3. Проверьте свободное место
4. Обратитесь к документации Prisma

## 🔄 Версионирование

Рекомендуется создавать бэкапы:
- **Ежедневно** - для активной разработки
- **Еженедельно** - для стабильных версий
- **Перед релизом** - для продакшена
- **После важных изменений** - для безопасности 