import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Кэш для запросов
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

// Создаем экземпляр axios с настройками
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 секунд таймаут
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления токена
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor для обработки ответов
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Токен истек, перенаправляем на логин
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Функция для кэширования GET запросов
const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

// Оптимизированные методы API
export const api = {
  // GET с кэшированием
  async get(url, useCache = true) {
    if (useCache) {
      const cached = getCachedData(url);
      if (cached) return cached;
    }
    
    const response = await apiClient.get(url);
    if (useCache) {
      setCachedData(url, response.data);
    }
    return response.data;
  },

  // POST без кэширования
  async post(url, data) {
    const response = await apiClient.post(url, data);
    // Инвалидируем кэш при изменении данных
    cache.clear();
    return response.data;
  },

  // PUT без кэширования
  async put(url, data) {
    const response = await apiClient.put(url, data);
    cache.clear();
    return response.data;
  },

  // DELETE без кэширования
  async delete(url) {
    const response = await apiClient.delete(url);
    cache.clear();
    return response.data;
  },

  // Загрузка файлов
  async upload(url, formData) {
    const response = await apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    cache.clear();
    return response.data;
  },

  // Очистка кэша
  clearCache() {
    cache.clear();
  },
};

export default apiClient; 