"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '../../../../config/api';
import apiClient from '../../../../lib/api-client';

export default function ProfilePage() {
  const params = useParams();
  const tenantId = params.tenantId;
  const router = useRouter();

  const [tenant, setTenant] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactMessage, setContactMessage] = useState({ type: '', text: '' });

  const fetchTenant = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/tenants/${tenantId}`);
      setTenant(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      if (decoded.role !== 'tenant' || String(decoded.tenantId) !== String(tenantId)) {
        router.push('/login');
        return;
      }
    } catch (err) {
      router.push('/login');
      return;
    }

    if (tenantId) {
      fetchTenant();
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenant) {
      setEmail(tenant.email || '');
      setPhone(tenant.phone || '');
      setContactPerson(tenant.contactPerson || '');
    }
  }, [tenant]);

  const validateEmail = (value) => {
    if (!value) return true;
    // Простая email-валидация
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
  };

  const validatePhone = (value) => {
    if (!value) return true;
    // Примитивная валидация: только цифры, +, -, пробелы, скобки
    return /^[\d\s\-+()]{7,20}$/.test(value);
  };

  const handleContactSave = async (e) => {
    e.preventDefault();
    setContactMessage({ type: '', text: '' });
    if (email && !validateEmail(email)) {
      setContactMessage({ type: 'error', text: 'Некорректный email' });
      return;
    }
    if (phone && !validatePhone(phone)) {
      setContactMessage({ type: 'error', text: 'Некорректный телефон' });
      return;
    }
    try {
      const res = await apiClient.put(`${API_BASE_URL}/api/tenants/${tenantId}`, {
        email: email.trim() || null,
        phone: phone.trim() || null,
        contactPerson: contactPerson.trim() || null,
      });
      setContactMessage({ type: 'success', text: 'Контактные данные успешно обновлены!' });
      setTenant(res); // обновить tenant
    } catch (err) {
      setContactMessage({ type: 'error', text: err.response?.data?.error || 'Ошибка при сохранении' });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Новые пароли не совпадают' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Новый пароль должен содержать минимум 6 символов' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await apiClient.put(`${API_BASE_URL}/api/auth/change-password`, {
        currentPassword,
        newPassword
      });

      setMessage({ type: 'success', text: 'Пароль успешно изменен!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'Ошибка при изменении пароля' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SCUD Portal</h1>
                <p className="text-sm text-gray-500">Профиль арендатора</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push(`/tenant/${tenantId}`)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Назад</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Выйти</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Информация о профиле</h2>
              <p className="text-gray-500">Управление настройками аккаунта</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Название арендатора</h3>
              <p className="text-gray-700">{tenant?.name || 'Загрузка...'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">ID арендатора</h3>
              <p className="text-gray-700">#{tenantId}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Статус аккаунта</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                tenant?.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {tenant?.status === 'active' ? 'Активен' : 'Ожидает активации'}
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">API ключ</h3>
              <p className="text-gray-700 font-mono text-sm">{tenant?.apiKey || 'Загрузка...'}</p>
            </div>
          </div>
          {/* Новая форма контактных данных */}
          <form onSubmit={handleContactSave} className="mt-6 space-y-4 max-w-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Контактные данные</h3>
            {contactMessage.text && (
              <div className={`p-3 rounded-lg mb-2 ${contactMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>{contactMessage.text}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="example@email.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="+7 999 123-45-67"
                autoComplete="tel"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Контактное лицо</label>
              <input
                type="text"
                value={contactPerson}
                onChange={e => setContactPerson(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="ФИО контактного лица"
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition-all"
            >
              Сохранить контактные данные
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Изменить пароль</h2>
          </div>

          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <div className="flex items-center">
                {message.type === 'success' ? (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span>{message.text}</span>
              </div>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Текущий пароль
              </label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Введите текущий пароль"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Новый пароль
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Введите новый пароль (минимум 6 символов)"
              />
              <p className="mt-1 text-sm text-gray-500">
                Минимум 6 символов
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Подтвердите новый пароль
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Повторите новый пароль"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
              <span className="font-semibold">
                {isLoading ? 'Изменение пароля...' : 'Изменить пароль'}
              </span>
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-800">Рекомендации по безопасности</h4>
                <ul className="mt-2 text-sm text-blue-700 space-y-1">
                  <li>• Используйте пароль длиной не менее 8 символов</li>
                  <li>• Включите буквы, цифры и специальные символы</li>
                  <li>• Не используйте личную информацию в пароле</li>
                  <li>• Регулярно меняйте пароль</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>© 2024 SCUD Portal. Система управления доступом торгового центра.</p>
            <p className="mt-1">Версия 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
} 