"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

export default function TenantPage() {
  const params = useParams();
  const tenantId = params.tenantId;
  const router = useRouter();

  const [tenant, setTenant] = useState(null);
  const [users, setUsers] = useState([]);
  const [myRequests, setMyRequests] = useState([]);

  const [fullName, setFullName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [comment, setComment] = useState('');
  const [additions, setAdditions] = useState([]);
  const [removals, setRemovals] = useState([]);

  const fetchTenant = async () => {
    try {
      const res = await axios.get(`http://localhost:3001/api/tenants/${tenantId}`);
      setTenant(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`http://localhost:3001/api/users/${tenantId}`);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`http://localhost:3001/api/requests/tenant/${tenantId}`);
      setMyRequests(res.data);
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
      fetchUsers();
      fetchRequests();
    }
  }, [tenantId]);

  const addUser = async () => {
    if (tenant && tenant.maxStaff != null && users.length >= tenant.maxStaff) {
      alert(`Вы достигли лимита сотрудников (${tenant.maxStaff}). Удалите кого-то, чтобы добавить нового.`);
      return;
    }
    if (!fullName.trim() || !cardNumber.trim()) {
      alert('Пожалуйста, заполните все поля');
      return;
    }
    try {
      await axios.post(`http://localhost:3001/api/users`, {
        tenantId: parseInt(tenantId),
        fullName,
        cardNumber
      });
      setFullName('');
      setCardNumber('');
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/api/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const addAdditionField = () => setAdditions([...additions, { fullName: '', cardNumber: '' }]);
  const addRemovalField = () => setRemovals([...removals, { userId: '' }]);

  const handleAdditionChange = (index, field, value) => {
    const newAdditions = [...additions];
    newAdditions[index][field] = value;
    setAdditions(newAdditions);
  };

  const handleRemovalSelectChange = (index, userId) => {
    const newRemovals = [...removals];
    newRemovals[index] = { userId: parseInt(userId) };
    setRemovals(newRemovals);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const submitRequest = async () => {
    if (tenant && tenant.maxStaff != null && users.length + additions.length - removals.length > tenant.maxStaff) {
      alert(`В результате изменений список превысит лимит (${tenant.maxStaff}). Проверьте состав заявки.`);
      return;
    }
    try {
      await axios.post(`http://localhost:3001/api/requests`, {
        tenantId: parseInt(tenantId),
        additions,
        removals: removals.map(r => {
          const user = users.find(u => u.id === r.userId);
          return {
            fullName: user?.fullName || '',
            cardNumber: user?.cardNumber || '',
          };
        }),
        comment
      });
      setComment('');
      setAdditions([]);
      setRemovals([]);
      fetchRequests();
      alert('Заявка отправлена!');
    } catch (err) {
      console.error(err);
      alert('Ошибка при отправке заявки');
    }
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SCUD Portal</h1>
                <p className="text-sm text-gray-500">Личный кабинет арендатора</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push(`/tenant/${tenantId}/turnover`)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>Товарооборот</span>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Активных заявок</p>
                <p className="text-2xl font-bold text-gray-900">
                  {myRequests.filter(req => req.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Лимит</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tenant?.maxStaff ? `${users.length}/${tenant.maxStaff}` : '∞'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Employees Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Employees List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Ваши сотрудники</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Всего:</span>
                  <span className="text-lg font-bold text-blue-600">{users.length}</span>
                </div>
              </div>
              
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">Пока сотрудников нет</p>
                  <p className="text-sm text-gray-400">Добавьте первого сотрудника через заявку</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {users.map((user, index) => (
                    <div key={user.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{user.fullName}</p>
                          <p className="text-sm text-gray-500">Карта: {user.cardNumber}</p>
                        </div>
                        <div className="text-xs text-gray-400">
                          #{index + 1}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Staff Limit Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Лимит сотрудников</h3>
              
              {tenant && tenant.maxStaff ? (
                <>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Использовано</span>
                      <span className="text-sm font-medium text-gray-900">{users.length} / {tenant.maxStaff}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          users.length >= tenant.maxStaff 
                            ? 'bg-red-500' 
                            : users.length >= tenant.maxStaff * 0.8 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((users.length / tenant.maxStaff) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-green-700">Доступно мест</span>
                      <span className="font-bold text-green-800">{Math.max(0, tenant.maxStaff - users.length)}</span>
                    </div>
                    
                    {users.length >= tenant.maxStaff * 0.8 && users.length < tenant.maxStaff && (
                      <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                        <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-sm text-yellow-700">Приближаетесь к лимиту</span>
                      </div>
                    )}
                    
                    {users.length >= tenant.maxStaff && (
                      <div className="flex items-center p-3 bg-red-50 rounded-lg">
                        <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-red-700">Лимит достигнут</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <p className="text-gray-500">Лимит не установлен</p>
                </div>
              )}
            </div>
          </div>
        </div>

       

        {/* Request Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Новая заявка</h2>
          </div>

          {/* Available Slots Info */}
          {tenant && tenant.maxStaff && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-green-700 font-medium">Доступно мест</p>
                    <p className="text-lg font-bold text-green-800">{Math.max(0, tenant.maxStaff - users.length)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-600">Можете добавить</p>
                  <p className="text-sm font-medium text-green-700">новых сотрудников</p>
                </div>
              </div>
            </div>
          )}

          {/* Comment Field */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Комментарий к заявке</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Опишите причину изменений..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              rows="3"
            />
          </div>

          {/* Additions Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Добавляемые сотрудники</h3>
              <button
                onClick={addAdditionField}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Добавить</span>
              </button>
            </div>
            
            {additions.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-gray-500">Нет добавляемых сотрудников</p>
                <p className="text-sm text-gray-400">Нажмите "Добавить" чтобы создать заявку</p>
              </div>
            ) : (
              <div className="space-y-3">
                {additions.map((a, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-green-600">+</span>
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          value={a.fullName}
                          onChange={(e) => handleAdditionChange(idx, 'fullName', e.target.value)}
                          placeholder="ФИО сотрудника"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        />
                        <input
                          value={a.cardNumber}
                          onChange={(e) => handleAdditionChange(idx, 'cardNumber', e.target.value)}
                          placeholder="Номер карты доступа"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Removals Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Удаляемые сотрудники</h3>
              <button
                onClick={addRemovalField}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Добавить</span>
              </button>
            </div>
            
            {removals.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <p className="text-gray-500">Нет удаляемых сотрудников</p>
                <p className="text-sm text-gray-400">Нажмите "Добавить" чтобы выбрать сотрудника</p>
              </div>
            ) : (
              <div className="space-y-3">
                {removals.map((r, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-red-600">-</span>
                      </div>
                      <select
                        value={r.userId || ''}
                        onChange={(e) => handleRemovalSelectChange(idx, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      >
                        <option value="">Выберите сотрудника для удаления</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.fullName} (Карта: {user.cardNumber})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={submitRequest}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span className="font-semibold">Отправить заявку</span>
          </button>
        </div>

        {/* Requests History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">История заявок</h2>
          </div>

          {myRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500">Пока нет отправленных заявок</p>
              <p className="text-sm text-gray-400">Создайте первую заявку выше</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myRequests.map((req) => (
                <div
                  key={req.id}
                  className={`p-6 rounded-xl border transition-all duration-200 hover:shadow-md ${
                    req.status === 'approved'
                      ? 'bg-green-50 border-green-200 hover:border-green-300'
                      : req.status === 'rejected'
                      ? 'bg-red-50 border-red-200 hover:border-red-300'
                      : 'bg-yellow-50 border-yellow-200 hover:border-yellow-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        req.status === 'approved'
                          ? 'bg-green-100'
                          : req.status === 'rejected'
                          ? 'bg-red-100'
                          : 'bg-yellow-100'
                      }`}>
                        {req.status === 'approved' ? (
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : req.status === 'rejected' ? (
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Заявка #{req.id}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(req.createdAt).toLocaleString('ru-RU', { 
                            timeZone: 'Europe/Moscow',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        req.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : req.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {req.status === 'approved' ? 'Одобрена' : 
                       req.status === 'rejected' ? 'Отклонена' : 
                       req.status === 'pending' ? 'На рассмотрении' : req.status}
                    </span>
                  </div>

                  {req.comment && (
                    <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Комментарий:</span> {req.comment}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Additions */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-green-600">+</span>
                        </div>
                        <h4 className="font-semibold text-gray-900">Добавляемые</h4>
                      </div>
                      {req.additions && req.additions.length > 0 ? (
                        <ul className="space-y-2">
                          {req.additions.map((a, idx) => (
                            <li key={idx} className="flex items-center space-x-2 text-sm">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-gray-700">{a.fullName}</span>
                              <span className="text-gray-500">({a.cardNumber})</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 text-sm italic">Нет добавляемых сотрудников</p>
                      )}
                    </div>

                    {/* Removals */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-red-600">-</span>
                        </div>
                        <h4 className="font-semibold text-gray-900">Удаляемые</h4>
                      </div>
                      {req.removals && req.removals.length > 0 ? (
                        <ul className="space-y-2">
                          {req.removals.map((r, idx) => (
                            <li key={idx} className="flex items-center space-x-2 text-sm">
                              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                              <span className="text-gray-700">{r.fullName}</span>
                              <span className="text-gray-500">({r.cardNumber})</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 text-sm italic">Нет удаляемых сотрудников</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
