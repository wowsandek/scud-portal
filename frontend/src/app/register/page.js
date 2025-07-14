"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../config/api';

export default function RegisterPage() {
  const router = useRouter();
  const [availableStores, setAvailableStores] = useState([]);
  const [storeId, setStoreId] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStores, setLoadingStores] = useState(true);

  // Загружаем доступные магазины при загрузке страницы
  useEffect(() => {
    fetchAvailableStores();
  }, []);

  const fetchAvailableStores = async () => {
    try {
      setLoadingStores(true);
      const response = await axios.get(`${API_BASE_URL}/api/auth/available-stores`);
      setAvailableStores(response.data);
    } catch (err) {
      console.error('Error fetching available stores:', err);
      setMessage('Ошибка загрузки списка магазинов');
    } finally {
      setLoadingStores(false);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    if (!phone) return true; // Телефон опциональный
    const phoneRegex = /^[\d\s\-+()]{7,20}$/;
    return phoneRegex.test(phone);
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      setMessage('');

      // Валидация на клиенте
      if (!storeId || !password || !email || !contactPerson) {
        setMessage('Пожалуйста, заполните все обязательные поля');
        return;
      }

      if (!validateEmail(email)) {
        setMessage('Пожалуйста, введите корректный email');
        return;
      }

      if (!validatePhone(phone)) {
        setMessage('Пожалуйста, введите корректный номер телефона');
        return;
      }

      if (password.length < 6) {
        setMessage('Пароль должен содержать минимум 6 символов');
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        storeId: parseInt(storeId),
        password,
        email,
        phone: phone || null,
        contactPerson
      });

      setMessage('Регистрация отправлена на рассмотрение! Дождитесь одобрения администратора.');
      
      // Очищаем форму
      setStoreId('');
      setPassword('');
      setEmail('');
      setPhone('');
      setContactPerson('');

      // Обновляем список доступных магазинов
      fetchAvailableStores();

    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-100 flex flex-col items-center justify-center p-4">
      {/* Логотип над карточкой */}
      <img
        src="/kazanmall-logo.png"
        alt="KazanMall"
        className="w-[90px] max-w-xs h-auto object-contain drop-shadow-xl mb-6 mt-2"
        draggable="false"
      />
      <div className="w-full max-w-md bg-white/90 rounded-3xl shadow-2xl p-8 md:p-10 flex flex-col items-center space-y-6 border border-gray-100">
        <h1 className="text-3xl font-extrabold text-center bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent tracking-tight">
          Регистрация
        </h1>
        <p className="text-center text-gray-500 text-base mb-2">Портал KazanMall</p>

        {message && (
          <div className={`w-full px-4 py-2 text-center rounded-lg font-medium ${message.startsWith('Регистрация отправлена') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'} animate-shake`}>
            {message}
          </div>
        )}

        {loadingStores ? (
          <div className="w-full text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="text-gray-500 mt-2">Загрузка доступных магазинов...</p>
          </div>
        ) : availableStores.length === 0 ? (
          <div className="w-full text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет доступных магазинов</h3>
            <p className="text-gray-500 text-sm">В данный момент нет магазинов, доступных для регистрации</p>
          </div>
        ) : (
          <div className="w-full space-y-4">
            {/* Выбор магазина */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              <select
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 pl-11 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base bg-white appearance-none"
                required
              >
                <option value="">Выберите магазин</option>
                {availableStores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Email */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (например, example@mail.com)"
                className="w-full border border-gray-300 rounded-lg p-3 pl-11 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base bg-white"
                required
              />
            </div>

            {/* Телефон */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Телефон (опционально)"
                className="w-full border border-gray-300 rounded-lg p-3 pl-11 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base bg-white"
              />
            </div>

            {/* ФИО контактного лица */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              <input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="ФИО (полностью)"
                className="w-full border border-gray-300 rounded-lg p-3 pl-11 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base bg-white"
                required
              />
            </div>

            {/* Пароль */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль"
                className="w-full border border-gray-300 rounded-lg p-3 pl-11 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base bg-white"
                required
              />
            </div>

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-lg p-3 font-semibold shadow-lg transition text-lg mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </div>
        )}

        <button
          onClick={() => router.push('/login')}
          className="w-full bg-white border border-orange-300 hover:bg-orange-50 text-orange-600 rounded-lg p-3 font-medium shadow transition mt-2"
        >
          Уже есть аккаунт? Войти
        </button>
        <p className="text-gray-400 text-xs text-center mt-6 select-none">
          © {new Date().getFullYear()} KazanMall
        </p>
      </div>
    </div>
  );
}
