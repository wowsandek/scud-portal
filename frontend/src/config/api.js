// Конфигурация API
const getApiUrl = () => {
  // Если есть переменная окружения, используем её
  if (process.env.NEXT_PUBLIC_API_URL) {
    console.log('Using environment API URL:', process.env.NEXT_PUBLIC_API_URL);
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Если мы в браузере, используем текущий хост
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    const port = '3001'; // Порт backend
    
    console.log('API Config Debug:', { protocol, host, port });
    
    // Если хост localhost, используем localhost для API
    if (host === 'localhost' || host === '127.0.0.1') {
      const url = `${protocol}//${host}:${port}`;
      console.log('Using localhost API URL:', url);
      return url;
    }
    
    // Иначе используем тот же хост, но с портом backend
    const url = `${protocol}//${host}:${port}`;
    console.log('Using server API URL:', url);
    return url;
  }
  
  // Для SSR используем localhost по умолчанию
  const url = 'http://localhost:3001';
  console.log('Using default SSR API URL:', url);
  return url;
};

export const API_BASE_URL = getApiUrl();
