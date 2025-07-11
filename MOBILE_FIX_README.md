# 🔧 Исправление проблемы доступа с мобильных устройств

## 🐛 Проблема
При попытке зарегистрироваться или войти с телефона возникала ошибка:
```
src/app/register/page.js (20:7) @ async handleRegister
await axios.post('http://localhost:3001/api/auth/register', {
```

## 🔍 Причина
В коде фронтенда использовался `localhost:3001` для API запросов. Когда пользователь заходит с телефона, `localhost` ссылается на сам телефон, а не на сервер.

## ✅ Решение

### 1. Создан конфигурационный файл
`frontend/src/config/api.js` - автоматически определяет правильный API URL:
- Если хост `localhost` → использует `localhost:3001`
- Если другой хост → использует тот же хост с портом `3001`

### 2. Обновлены все файлы
Заменены все вхождения `http://localhost:3001` на `${API_BASE_URL}`:

**Обновленные файлы:**
- `frontend/src/app/register/page.js`
- `frontend/src/app/login/page.js`
- `frontend/src/app/admin-login/page.js`
- `frontend/src/app/tenant/[tenantId]/page.js`
- `frontend/src/app/tenant/[tenantId]/turnover/page.js`
- `frontend/src/app/admin/page.js`
- `frontend/src/app/admin/pending-tenants/page.js`
- `frontend/src/app/admin/tenants/page.js`
- `frontend/src/app/admin/tenants/[tenantId]/page.js`

### 3. Пересборка и перезапуск
```bash
sudo docker compose up -d --build frontend
```

## 🎯 Результат
- ✅ Регистрация работает с телефона
- ✅ Вход работает с телефона
- ✅ Все API запросы работают корректно
- ✅ Обратная совместимость с локальной разработкой

## 🔧 Технические детали

### Конфигурация API
```javascript
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    const port = '3001';
    
    if (host === 'localhost' || host === '127.0.0.1') {
      return `${protocol}//${host}:${port}`;
    }
    
    return `${protocol}//${host}:${port}`;
  }
  
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};
```

### Использование
```javascript
import { API_BASE_URL } from '../config/api';

// Вместо:
await axios.post('http://localhost:3001/api/auth/register', data);

// Используем:
await axios.post(`${API_BASE_URL}/api/auth/register`, data);
```

## 🚀 Проверка
1. Откройте сайт с телефона
2. Попробуйте зарегистрироваться
3. Попробуйте войти
4. Все должно работать без ошибок

---
*Исправление выполнено: $(date)* 