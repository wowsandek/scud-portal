"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '../../../../config/api';
import apiClient from '../../../../lib/api-client';

export default function TenantDetailPage() {
  const router = useRouter();
  const { tenantId } = useParams();

  const [tenant, setTenant] = useState(null);
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [turnovers, setTurnovers] = useState([]);
  const [loadingTurnovers, setLoadingTurnovers] = useState(false);
  
  // Фильтры для отчётов
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  const [newFullName, setNewFullName] = useState('');
  const [newCardNumber, setNewCardNumber] = useState('');

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactMessage, setContactMessage] = useState({ type: '', text: '' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      if (decoded.role !== 'admin') {
        router.push('/login');
        return;
      }
    } catch (err) {
      router.push('/login');
      return;
    }

    if (!tenantId) return;
    fetchTenant();
    fetchUsers();
    fetchRequests();
    fetchTurnovers();
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
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
  };
  const validatePhone = (value) => {
    if (!value) return true;
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
      setTenant(res);
    } catch (err) {
      setContactMessage({ type: 'error', text: err.response?.data?.error || 'Ошибка при сохранении' });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Новые пароли не совпадают' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Новый пароль должен содержать минимум 6 символов' });
      return;
    }
    setIsPasswordLoading(true);
    try {
      await apiClient.put(`${API_BASE_URL}/api/tenants/${tenantId}/change-password`, {
        newPassword
      });
      setPasswordMessage({ type: 'success', text: 'Пароль успешно изменен!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.response?.data?.error || 'Ошибка при изменении пароля' });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleResetAccount = async () => {
    if (!window.confirm(
      `Вы уверены, что хотите сбросить аккаунт "${tenant?.name}"?\n\n` +
      'Это действие:\n' +
      '• Очистит все контактные данные\n' +
      '• Удалит пароль\n' +
      '• Вернет магазин в состояние "доступен для регистрации"\n\n' +
      'Пользователи смогут снова зарегистрироваться под этим магазином.'
    )) {
      return;
    }

    setContactMessage({ type: '', text: '' });
    try {
      const updatedTenant = await apiClient.post(`${API_BASE_URL}/api/tenants/${tenantId}/reset-account`);
      setTenant(updatedTenant);
      setEmail('');
      setPhone('');
      setContactPerson('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setContactMessage({ 
        type: 'success', 
        text: 'Аккаунт успешно сброшен! Магазин теперь доступен для новой регистрации.' 
      });
    } catch (err) {
      setContactMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'Ошибка при сбросе аккаунта' 
      });
    }
  };

  const fetchTenant = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/tenants/${tenantId}`);
      setTenant(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/users/${tenantId}`);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/requests/tenant/${tenantId}`);
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTurnovers = async () => {
    try {
      setLoadingTurnovers(true);
      const res = await axios.get(`${API_BASE_URL}/api/turnover/tenant/${tenantId}`);
      setTurnovers(res.data);
    } catch (err) {
      console.error('Ошибка при загрузке отчётов:', err);
    } finally {
      setLoadingTurnovers(false);
    }
  };

  // Функция для скачивания файла
  const handleDownload = (turnover) => {
    const downloadUrl = `${API_BASE_URL}/api/turnover/${turnover.id}/download`;
    window.open(downloadUrl, '_blank');
  };

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const addUser = async () => {
    if (!newFullName.trim() || !newCardNumber.trim()) {
      alert("Заполните все поля");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/api/users`, {
        tenantId: parseInt(tenantId),
        fullName: newFullName,
        cardNumber: newCardNumber
      });
      setNewFullName('');
      setNewCardNumber('');
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  // Фильтрация отчётов
  const filteredTurnovers = turnovers.filter(turnover => {
    // Фильтр по году
    if (filterYear && turnover.year !== parseInt(filterYear)) return false;
    
    // Фильтр по месяцу
    if (filterMonth && turnover.month !== parseInt(filterMonth)) return false;
    
    // Фильтр по статусу
    if (filterStatus && turnover.approvalStatus !== filterStatus) return false;
    
    // Поиск по названию файла
    if (filterSearch && !turnover.fileName.toLowerCase().includes(filterSearch.toLowerCase())) return false;
    
    return true;
  });

  // Получение уникальных годов из отчётов
  const availableYears = [...new Set(turnovers.map(t => t.year))].sort((a, b) => b - a);
  
  // Получение уникальных месяцев из отчётов
  const availableMonths = [...new Set(turnovers.map(t => t.month))].sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SCUD Portal</h1>
                <p className="text-sm text-gray-500">Просмотр арендатора</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/admin/tenants"
                className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>К арендаторам</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tenant ? (
          <>
            {/* Tenant Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{tenant.name}</h1>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      tenant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {tenant.status === 'active' ? 'Активен' : 'Неактивен'}
                    </span>
                    <span className="text-sm text-gray-500">ID: {tenant.id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Сотрудников</p>
                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Лимит</p>
                    <p className="text-2xl font-bold text-gray-900">{tenant.maxStaff ?? '∞'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Заявок</p>
                    <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Использование</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {tenant.maxStaff ? `${Math.round((users.length / tenant.maxStaff) * 100)}%` : '∞'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {tenant.maxStaff && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Использование лимита сотрудников</h3>
                  <span className="text-sm text-gray-600">{users.length} / {tenant.maxStaff}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all ${
                      users.length / tenant.maxStaff > 0.8 
                        ? 'bg-red-500' 
                        : users.length / tenant.maxStaff > 0.6 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((users.length / tenant.maxStaff) * 100, 100)}%` }}
                  ></div>
                </div>
                {users.length / tenant.maxStaff > 0.8 && (
                  <p className="text-sm text-red-600 mt-2">⚠️ Лимит почти исчерпан!</p>
                )}
              </div>
            )}

            {/* Profile Management Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Contact Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Контактные данные</h2>
                </div>

                {contactMessage.text && (
                  <div className={`mb-4 p-4 rounded-lg border ${
                    contactMessage.type === 'success' 
                      ? 'bg-green-50 border-green-200 text-green-700' 
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    <div className="flex items-center">
                      {contactMessage.type === 'success' ? (
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      <span>{contactMessage.text}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleContactSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="example@email.com"
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Телефон
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="+7 999 123-45-67"
                      autoComplete="tel"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Контактное лицо
                    </label>
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={e => setContactPerson(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="ФИО контактного лица"
                      autoComplete="off"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold shadow-lg transition-all duration-200 hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Сохранить контактные данные</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleResetAccount}
                      className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-semibold shadow-lg transition-all duration-200 hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Сбросить аккаунт</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Password Management */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Смена пароля</h2>
                </div>

                {passwordMessage.text && (
                  <div className={`mb-4 p-4 rounded-lg border ${
                    passwordMessage.type === 'success' 
                      ? 'bg-green-50 border-green-200 text-green-700' 
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    <div className="flex items-center">
                      {passwordMessage.type === 'success' ? (
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      <span>{passwordMessage.text}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Новый пароль
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="Введите новый пароль (минимум 6 символов)"
                      minLength={6}
                    />
                    <p className="mt-1 text-sm text-gray-500">Минимум 6 символов</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Подтвердите новый пароль
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="Повторите новый пароль"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isPasswordLoading}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-semibold shadow-lg transition-all duration-200 hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
                  >
                    {isPasswordLoading ? (
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
                      {isPasswordLoading ? 'Изменение пароля...' : 'Изменить пароль'}
                    </span>
                  </button>
                </form>

                <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-amber-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-amber-800">Внимание</h4>
                      <p className="text-sm text-amber-700 mt-1">Новый пароль будет установлен для арендатора. Убедитесь, что пароль соответствует требованиям безопасности.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Staff Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <span>Сотрудники ({users.length})</span>
                  </h2>
                </div>
                
                <div className="p-6">
                  {users.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500">Сотрудников пока нет</p>
                    </div>
                  ) : (
                    <div className="space-y-3 mb-6">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user.fullName}</p>
                              <p className="text-sm text-gray-500">{user.cardNumber}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="flex items-center space-x-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Удалить</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add User Form */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Добавить сотрудника</h3>
                    <div className="space-y-3">
                      <input
                        value={newFullName}
                        onChange={(e) => setNewFullName(e.target.value)}
                        placeholder="ФИО сотрудника"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                      <input
                        value={newCardNumber}
                        onChange={(e) => setNewCardNumber(e.target.value)}
                        placeholder="Номер телефона"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                      <button
                        onClick={addUser}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Добавить сотрудника</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requests Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Заявки ({requests.length})</span>
                  </h2>
                </div>
                
                <div className="p-6">
                  {requests.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <p className="text-gray-500">Заявок пока нет</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {requests.map((req) => (
                        <div
                          key={req.id}
                          className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                            req.status === 'approved'
                              ? 'bg-green-50 border-green-200'
                              : req.status === 'rejected'
                              ? 'bg-red-50 border-red-200'
                              : 'bg-yellow-50 border-yellow-200'
                          }`}
                        >
                                                     <div className="flex items-start justify-between mb-3">
                             <div className="flex items-center space-x-2">
                               <div className={`w-3 h-3 rounded-full ${
                                 req.status === 'approved' ? 'bg-green-500' :
                                 req.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                               }`}></div>
                               <h3 className="font-semibold text-gray-900">Заявка #{req.id}</h3>
                             </div>
                             <div className="text-right">
                               <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                 req.status === 'approved' ? 'bg-green-100 text-green-800' :
                                 req.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                               }`}>
                                 {req.status === 'approved' ? 'Одобрено' :
                                  req.status === 'rejected' ? 'Отклонено' : 'Ожидает'}
                               </span>
                               <p className="text-xs text-gray-500 mt-1">
                                 {new Date(req.createdAt).toLocaleString('ru-RU', { 
                                   timeZone: 'Europe/Moscow',
                                   year: 'numeric',
                                   month: '2-digit',
                                   day: '2-digit',
                                   hour: '2-digit',
                                   minute: '2-digit'
                                 })}
                               </p>
                             </div>
                           </div>
                          
                          {req.comment && (
                            <p className="text-sm text-gray-700 mb-3 bg-white p-2 rounded border">
                              {req.comment}
                            </p>
                          )}
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {req.additions && req.additions.length > 0 && (
                              <div className="bg-green-50 rounded p-3">
                                <div className="flex items-center space-x-2 mb-2">
                                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                  <span className="text-sm font-medium text-green-800">Добавить</span>
                                </div>
                                <div className="space-y-1">
                                  {req.additions.map((a, idx) => (
                                    <div key={idx} className="text-sm text-green-700">
                                      • {a.fullName} ({a.cardNumber})
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {req.removals && req.removals.length > 0 && (
                              <div className="bg-red-50 rounded p-3">
                                <div className="flex items-center space-x-2 mb-2">
                                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                  </svg>
                                  <span className="text-sm font-medium text-red-800">Удалить</span>
                                </div>
                                <div className="space-y-1">
                                  {req.removals.map((r, idx) => (
                                    <div key={idx} className="text-sm text-red-700">
                                      • {r.fullName} ({r.cardNumber})
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Turnover Reports Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>История отчётов товарооборота ({turnovers.length})</span>
                    </h2>
                    <button
                      onClick={fetchTurnovers}
                      disabled={loadingTurnovers}
                      className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>{loadingTurnovers ? "Обновление..." : "Обновить"}</span>
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  {/* Фильтры */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Фильтры</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Фильтр по году */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Год</label>
                        <select
                          value={filterYear}
                          onChange={(e) => setFilterYear(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <option value="">Все годы</option>
                          {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Фильтр по месяцу */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Месяц</label>
                        <select
                          value={filterMonth}
                          onChange={(e) => setFilterMonth(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <option value="">Все месяцы</option>
                          {availableMonths.map(month => (
                            <option key={month} value={month}>{monthNames[month - 1]}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Фильтр по статусу */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Статус</label>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <option value="">Все статусы</option>
                          <option value="pending">На утверждении</option>
                          <option value="approved">Утвержден</option>
                          <option value="rejected">Не утвержден</option>
                          <option value="not_approved">Не утвержден (заменен)</option>
                        </select>
                      </div>
                      
                      {/* Поиск по названию файла */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Поиск по файлу</label>
                        <input
                          type="text"
                          value={filterSearch}
                          onChange={(e) => setFilterSearch(e.target.value)}
                          placeholder="Название файла..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                    
                    {/* Кнопка сброса фильтров */}
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => {
                          setFilterYear('');
                          setFilterMonth('');
                          setFilterStatus('');
                          setFilterSearch('');
                        }}
                        className="flex items-center space-x-1 px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-xs transition-colors duration-200"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Сбросить фильтры</span>
                      </button>
                    </div>
                  </div>

                  {/* Счетчик результатов */}
                  <div className="mb-4 text-sm text-gray-600">
                    Показано {filteredTurnovers.length} из {turnovers.length} отчётов
                  </div>

                  {loadingTurnovers ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Загрузка истории...</p>
                    </div>
                  ) : turnovers.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500">История товарооборота пуста</p>
                      <p className="text-sm text-gray-400">Арентдатор ещё не загружал отчёты</p>
                    </div>
                  ) : filteredTurnovers.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500">По вашему запросу ничего не найдено</p>
                      <p className="text-sm text-gray-400">Попробуйте изменить фильтры</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredTurnovers.map((turnover) => (
                        <div key={turnover.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:border-blue-300 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4 mb-3">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                  </svg>
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {monthNames[turnover.month - 1]} {turnover.year}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    Загружено {new Date(turnover.createdAt).toLocaleDateString('ru-RU', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                    {turnover.updatedAt && turnover.updatedAt !== turnover.createdAt && (
                                      <span className="ml-2 text-orange-600">
                                        • Обновлено {new Date(turnover.updatedAt).toLocaleDateString('ru-RU', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="bg-white rounded-lg p-3 border border-gray-200">
                                  <p className="text-xs text-gray-500 mb-1">Без НДС</p>
                                  <p className="text-lg font-bold text-blue-600">
                                    {turnover.amountNoVat.toLocaleString('ru-RU')} ₽
                                  </p>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-gray-200">
                                  <p className="text-xs text-gray-500 mb-1">С НДС</p>
                                  <p className="text-lg font-bold text-green-600">
                                    {turnover.amountWithVat.toLocaleString('ru-RU')} ₽
                                  </p>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-gray-200">
                                  <p className="text-xs text-gray-500 mb-1">Чеков</p>
                                  <p className="text-lg font-bold text-purple-600">
                                    {turnover.receiptsCount.toLocaleString('ru-RU')}
                                  </p>
                                </div>
                              </div>

                              {/* Статус утверждения */}
                              <div className="mb-4">
                                {turnover.approvalStatus === 'pending' && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    На утверждении
                                  </span>
                                )}
                                {turnover.approvalStatus === 'approved' && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Утвержден
                                  </span>
                                )}
                                {turnover.approvalStatus === 'rejected' && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Не утвержден
                                  </span>
                                )}
                                {turnover.approvalStatus === 'not_approved' && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Не утвержден (заменен)
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                  </svg>
                                  <span className="text-sm text-gray-600">{turnover.fileName}</span>
                                  <span className="text-xs text-gray-400">
                                    ({(turnover.fileSize / 1024 / 1024).toFixed(2)} МБ)
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleDownload(turnover)}
                                  className="flex items-center space-x-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs transition-colors duration-200"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span>Скачать</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Загрузка данных...</h3>
            <p className="text-gray-500">Пожалуйста, подождите</p>
          </div>
        )}
      </div>
    </div>
  );
}
