// Конфигурация API
const getApiUrl = () => {
  // Если мы в браузере, используем текущий хост
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    const port = '3001'; // Порт backend
    
    // Если хост localhost, используем localhost для API
    if (host === 'localhost' || host === '127.0.0.1') {
      return `${protocol}//${host}:${port}`;
    }
    
    // Иначе используем тот же хост, но с портом backend
    return `${protocol}//${host}:${port}`;
  }
  
  // Для SSR используем переменную окружения или localhost
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};

export const API_BASE_URL = getApiUrl();
