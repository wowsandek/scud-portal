"use client";

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../config/api';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async () => {
    try {
      if (!name || !password) {
        setMessage('Пожалуйста, заполните все поля');
        return;
      }

      await axios.post(`${API_BASE_URL}/api/auth/register`, {
        name,
        password
      });

      setMessage('Регистрация успешна! Дождитесь одобрения администратора.');
      setName('');
      setPassword('');
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || 'Ошибка регистрации');
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
          <div className={`w-full px-4 py-2 text-center rounded-lg font-medium ${message.startsWith('Регистрация успешна') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'} animate-shake`}>
            {message}
          </div>
        )}

        <div className="w-full space-y-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название магазина"
              className="w-full border border-gray-300 rounded-lg p-3 pl-11 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base bg-white"
              autoFocus
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.105.895-2 2-2s2 .895 2 2v1a2 2 0 01-2 2h-2a2 2 0 01-2-2v-1z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 11V7a5 5 0 00-10 0v4" />
              </svg>
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              className="w-full border border-gray-300 rounded-lg p-3 pl-11 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base bg-white"
            />
          </div>
          <button
            onClick={handleRegister}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-lg p-3 font-semibold shadow-lg transition text-lg mt-2"
          >
            Зарегистрироваться
          </button>
        </div>
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
