"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import { API_BASE_URL } from "../../../config/api";
import Modal from 'react-modal';

export default function AdminTurnoverPage() {
  const router = useRouter();
  
  // Состояние для вкладок
  const [activeTab, setActiveTab] = useState('overview'); // overview, approval
  
  // Состояние для фильтров
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterStatus, setFilterStatus] = useState('all'); // all, submitted, pending
  const [searchTerm, setSearchTerm] = useState('');
  
  // Состояние для сортировки
  const [sortField, setSortField] = useState('tenantName');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Состояние для данных
  const [periodData, setPeriodData] = useState(null);
  const [yearlyStats, setYearlyStats] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [error, setError] = useState("");
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editValues, setEditValues] = useState({ amountWithVat: '', amountNoVat: '', receiptsCount: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  
  // Состояние для модального окна просмотра файла
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewFileUrl, setViewFileUrl] = useState('');
  const [viewFileName, setViewFileName] = useState('');
  const [viewFileType, setViewFileType] = useState('');
  // Новое состояние для информации об отчёте
  const [viewTurnoverInfo, setViewTurnoverInfo] = useState(null);

  const monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];

  // Цвета для графиков
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Загрузка данных за период
  const fetchPeriodData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/turnover/all-tenants/${selectedYear}/${selectedMonth}`);
      setPeriodData(res.data);
    } catch (err) {
      console.error(err);
      setError("Ошибка при загрузке данных");
    } finally {
      setLoading(false);
    }
  };

  // Загрузка годовой статистики
  const fetchYearlyStats = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/turnover/statistics/${selectedYear}`);
      setYearlyStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Загрузка отчетов на утверждение
  const fetchPendingApprovals = async () => {
    setLoadingApprovals(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/turnover/pending-approval`);
      setPendingApprovals(res.data);
    } catch (err) {
      console.error(err);
      setError("Ошибка при загрузке отчетов на утверждение");
    } finally {
      setLoadingApprovals(false);
    }
  };

  useEffect(() => {
    fetchPeriodData();
    fetchYearlyStats();
    fetchPendingApprovals();
  }, [selectedYear, selectedMonth]);

  // Функция сортировки
  const sortData = (data) => {
    return data.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'tenantName':
          aValue = a.tenantName.toLowerCase();
          bValue = b.tenantName.toLowerCase();
          break;
        case 'status':
          aValue = a.hasSubmitted ? 1 : 0;
          bValue = b.hasSubmitted ? 1 : 0;
          break;
        case 'turnoverWithVat':
          aValue = a.turnover?.amountWithVat || 0;
          bValue = b.turnover?.amountWithVat || 0;
          break;
        case 'turnoverNoVat':
          aValue = a.turnover?.amountNoVat || 0;
          bValue = b.turnover?.amountNoVat || 0;
          break;
        case 'receiptsCount':
          aValue = a.turnover?.receiptsCount || 0;
          bValue = b.turnover?.receiptsCount || 0;
          break;
        case 'submittedAt':
          aValue = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
          bValue = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
          break;
        default:
          aValue = a[sortField];
          bValue = b[sortField];
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // Обработчик сортировки
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Фильтрация и сортировка данных
  const filteredData = sortData(periodData?.data?.filter(item => {
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'submitted' && item.hasSubmitted) ||
      (filterStatus === 'pending' && !item.hasSubmitted);
    
    const matchesSearch = item.tenantName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  }) || []);

  // Данные для круговой диаграммы
  const pieData = periodData ? [
    { name: 'Сдали отчет', value: periodData.submittedCount, color: '#00C49F' },
    { name: 'Не сдали', value: periodData.pendingCount, color: '#FF8042' }
  ] : [];

  // Данные для графика по месяцам
  const monthlyChartData = yearlyStats?.monthlyStats?.map(stat => ({
    name: stat.monthName,
    submitted: stat.submittedCount,
    pending: stat.pendingCount,
    totalAmount: stat.totalAmount / 1000000, // в миллионах
    totalReceipts: stat.totalReceipts
  })) || [];

  const handleDownloadFile = async (filePath, fileName) => {
    try {
      // Если filePath начинается не с '/', добавить слэш
      const normalizedPath = filePath.startsWith('/') ? filePath : '/' + filePath;
      const response = await axios.get(`${API_BASE_URL}${normalizedPath}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Ошибка при скачивании файла:', err);
    }
  };

  // Функция для открытия файла в модальном окне
  const handleViewFile = async (turnoverId, fileName, fileType, pdfFilePath, turnoverInfo) => {
    try {
      // Сохраняем инфо об отчёте
      setViewTurnoverInfo(turnoverInfo || null);
      // Если есть PDF-версия, используем её для предпросмотра
      if (pdfFilePath) {
        const fileUrl = `${API_BASE_URL}/api/turnover/${turnoverId}/view-pdf`;
        setViewFileUrl(fileUrl);
        setViewFileName(fileName);
        setViewFileType('application/pdf');
        setViewModalOpen(true);
      } else {
        // Иначе используем оригинальный файл
        const fileUrl = `${API_BASE_URL}/api/turnover/${turnoverId}/view`;
        const fileExt = fileName.split('.').pop().toLowerCase();
        
        // Определяем MIME-тип на основе расширения файла
        let mimeType = '';
        switch (fileExt) {
          case 'pdf':
            mimeType = 'application/pdf';
            break;
          case 'png':
            mimeType = 'image/png';
            break;
          case 'jpg':
          case 'jpeg':
            mimeType = 'image/jpeg';
            break;
          case 'xlsx':
            mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            break;
          case 'xls':
            mimeType = 'application/vnd.ms-excel';
            break;
          case 'docx':
            mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            break;
          case 'doc':
            mimeType = 'application/msword';
            break;
          default:
            mimeType = fileExt;
        }
        
        setViewFileUrl(fileUrl);
        setViewFileName(fileName);
        setViewFileType(mimeType);
        setViewModalOpen(true);
      }
    } catch (err) {
      console.error('Ошибка при открытии файла:', err);
    }
  };

  // Функция для закрытия модального окна просмотра
  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewFileUrl('');
    setViewFileName('');
    setViewFileType('');
    setViewTurnoverInfo(null);
  };

  // Функции для утверждения отчетов
  const handleApprove = async (turnoverId) => {
    try {
      await axios.put(`${API_BASE_URL}/api/turnover/${turnoverId}/approve`);
      // Обновляем список после утверждения
      fetchPendingApprovals();
      fetchPeriodData();
    } catch (err) {
      console.error('Ошибка при утверждении:', err);
      setError("Ошибка при утверждении отчета");
    }
  };

  const handleReject = async (turnoverId) => {
    try {
      await axios.put(`${API_BASE_URL}/api/turnover/${turnoverId}/reject`);
      // Обновляем список после отклонения
      fetchPendingApprovals();
      fetchPeriodData();
    } catch (err) {
      console.error('Ошибка при отклонении:', err);
      setError("Ошибка при отклонении отчета");
    }
  };

  // Открыть модалку редактирования
  const openEditModal = (row) => {
    setEditRow(row);
    setEditValues({
      amountWithVat: row.turnover?.amountWithVat || '',
      amountNoVat: row.turnover?.amountNoVat || '',
      receiptsCount: row.turnover?.receiptsCount || ''
    });
    setEditError('');
    setEditModalOpen(true);
  };
  // Закрыть модалку
  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditRow(null);
    setEditError('');
  };
  // Сохранить изменения
  const handleEditSave = async () => {
    setEditLoading(true);
    setEditError('');
    try {
      await axios.put(`${API_BASE_URL}/api/turnover/${editRow.turnover.id}`, {
        amountWithVat: editValues.amountWithVat,
        amountNoVat: editValues.amountNoVat,
        receiptsCount: editValues.receiptsCount
      });
      closeEditModal();
      fetchPeriodData();
    } catch (err) {
      setEditError('Ошибка при сохранении изменений');
    } finally {
      setEditLoading(false);
    }
  };

  function getStatusBadge(status) {
    switch (status) {
      case 'approved':
        return <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">Утвержден</span>;
      case 'pending':
        return <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">На утверждении</span>;
      case 'rejected':
        return <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">Отклонен</span>;
      case 'not_approved':
        return <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-gray-200 text-gray-700">Не утвержден (заменен)</span>;
      default:
        return <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">{status}</span>;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Товарооборот арендаторов</h1>
                <p className="text-sm text-gray-500">Мониторинг и анализ отчетов</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Назад в админ-панель</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Вкладки */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Обзор
            </button>
            <button
              onClick={() => setActiveTab('approval')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'approval'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Утверждение товарооборота
              {pendingApprovals.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {pendingApprovals.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {activeTab === 'overview' ? (
          <>
            {/* Фильтры */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Год</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Месяц</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {monthNames.map((name, index) => (
                      <option key={index + 1} value={index + 1}>{name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Все</option>
                    <option value="submitted">Сдали отчет</option>
                    <option value="pending">Не сдали</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Поиск арендатора</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Название арендатора..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={fetchPeriodData}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {loading ? 'Загрузка...' : 'Обновить'}
                  </button>
                </div>
              </div>
            </div>

            {/* Статистика */}
            {periodData && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Всего арендаторов</p>
                      <p className="text-2xl font-bold">{periodData.totalTenants}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Сдали отчет</p>
                      <p className="text-2xl font-bold">{periodData.submittedCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">Не сдали</p>
                      <p className="text-2xl font-bold">{periodData.pendingCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Процент сдачи</p>
                      <p className="text-2xl font-bold">
                        {periodData.totalTenants > 0 
                          ? Math.round((periodData.submittedCount / periodData.totalTenants) * 100) 
                          : 0}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Графики */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Круговая диаграмма статуса сдачи */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Статус сдачи отчетов</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* График по месяцам */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Статистика по месяцам ({selectedYear})</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="submitted" fill="#00C49F" name="Сдали" />
                      <Bar dataKey="pending" fill="#FF8042" name="Не сдали" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Таблица арендаторов */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Арендаторы - {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Показано {filteredData.length} из {periodData?.totalTenants || 0} арендаторов
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('tenantName')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Арендатор</span>
                          {sortField === 'tenantName' && (
                            <svg className={`w-4 h-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Статус</span>
                          {sortField === 'status' && (
                            <svg className={`w-4 h-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('turnoverWithVat')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Товарооборот с НДС</span>
                          {sortField === 'turnoverWithVat' && (
                            <svg className={`w-4 h-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('turnoverNoVat')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Товарооборот без НДС</span>
                          {sortField === 'turnoverNoVat' && (
                            <svg className={`w-4 h-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('receiptsCount')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Чеков</span>
                          {sortField === 'receiptsCount' && (
                            <svg className={`w-4 h-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('submittedAt')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Дата сдачи</span>
                          {sortField === 'submittedAt' && (
                            <svg className={`w-4 h-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((item) => (
                      <tr key={item.tenantId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.tenantName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.hasSubmitted ? (
                            item.approvalStatus === 'pending' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                На утверждении
                              </span>
                            ) : item.approvalStatus === 'approved' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Утвержден
                              </span>
                            ) : item.approvalStatus === 'rejected' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Не утвержден
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Сдан
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Не сдан
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.turnover ? (
                            <div className="font-medium">
                              {item.turnover.amountWithVat.toLocaleString('ru-RU')} ₽
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.turnover ? (
                            <div className="font-medium">
                              {item.turnover.amountNoVat.toLocaleString('ru-RU')} ₽
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.turnover ? item.turnover.receiptsCount.toLocaleString('ru-RU') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.submittedAt ? (
                            <div>
                              <div>
                                {new Date(item.submittedAt).toLocaleDateString('ru-RU', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              {item.updatedAt && item.updatedAt !== item.submittedAt && (
                                <div className="text-xs text-orange-600 mt-1">
                                  Обновлено: {new Date(item.updatedAt).toLocaleDateString('ru-RU', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {item.turnover && (['pending','approved'].includes(item.approvalStatus)) && (
                              <button
                                onClick={() => openEditModal(item)}
                                className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors ml-2"
                                title="Редактировать"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 10-4-4l-8 8v3zm0 0v3h3" />
                                </svg>
                              </button>
                            )}
                            {item.turnover && item.turnover.filePath && item.turnover.fileName ? (
                              <>
                                <button
                                  onClick={() => handleViewFile(item.turnover.id, item.turnover.fileName, item.turnover.fileType, item.turnover.pdfFilePath, item)}
                                  className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-2 py-1 rounded-md transition-colors ml-2"
                                  title="Просмотр"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDownloadFile(item.turnover.filePath, item.turnover.fileName)}
                                  className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors ml-2"
                                  title="Скачать"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </button>
                              </>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredData.length === 0 && (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Нет данных</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? 'Попробуйте изменить параметры поиска' : 'Нет арендаторов для отображения'}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Вкладка утверждения */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Отчеты на утверждение
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {loadingApprovals ? 'Загрузка...' : `${pendingApprovals.length} отчетов ожидают утверждения`}
                </p>
              </div>
              
              {loadingApprovals ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Загрузка отчетов...</p>
                </div>
              ) : pendingApprovals.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Арендатор
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Период
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Товарооборот с НДС
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Товарооборот без НДС
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Чеков
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Дата загрузки
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingApprovals.map((turnover) => (
                        <tr key={turnover.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{turnover.tenant.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {monthNames[turnover.month - 1]} {turnover.year}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="font-medium">
                              {turnover.amountWithVat.toLocaleString('ru-RU')} ₽
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="font-medium">
                              {turnover.amountNoVat.toLocaleString('ru-RU')} ₽
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {turnover.receiptsCount.toLocaleString('ru-RU')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(turnover.createdAt).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewFile(turnover.id, turnover.fileName, turnover.fileType, turnover.pdfFilePath, turnover)}
                                className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-2 py-1 rounded-md transition-colors"
                                title="Просмотр"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDownloadFile(turnover.filePath, turnover.fileName)}
                                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors"
                                title="Скачать"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleApprove(turnover.id)}
                                className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-2 py-1 rounded-md transition-colors"
                                title="Утвердить"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleReject(turnover.id)}
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md transition-colors"
                                title="Отклонить"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Нет отчетов на утверждение</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Все отчеты уже обработаны
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {/* Модальное окно редактирования */}
      <Modal
        isOpen={editModalOpen}
        onRequestClose={closeEditModal}
        contentLabel="Редактировать отчет"
        ariaHideApp={false}
        className="fixed inset-0 flex items-center justify-center z-50"
        overlayClassName="fixed inset-0 bg-black bg-opacity-30 z-40"
      >
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h2 className="text-lg font-bold mb-4">Редактировать отчет</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Товарооборот с НДС</label>
            <input type="number" className="w-full border rounded px-3 py-2" value={editValues.amountWithVat} onChange={e => setEditValues(v => ({...v, amountWithVat: e.target.value}))} />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Товарооборот без НДС</label>
            <input type="number" className="w-full border rounded px-3 py-2" value={editValues.amountNoVat} onChange={e => setEditValues(v => ({...v, amountNoVat: e.target.value}))} />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Чеков</label>
            <input type="number" className="w-full border rounded px-3 py-2" value={editValues.receiptsCount} onChange={e => setEditValues(v => ({...v, receiptsCount: e.target.value}))} />
          </div>
          {editError && <div className="text-red-600 mb-2">{editError}</div>}
          <div className="flex justify-end space-x-2">
            <button onClick={closeEditModal} className="px-4 py-2 bg-gray-200 rounded">Отмена</button>
            <button onClick={handleEditSave} disabled={editLoading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400">
              {editLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Модальное окно просмотра файла */}
      <Modal
        isOpen={viewModalOpen}
        onRequestClose={closeViewModal}
        contentLabel="Просмотр файла"
        ariaHideApp={false}
        className="fixed inset-0 flex items-center justify-center z-50"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-40"
      >
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
          {/* Заголовок */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Просмотр файла: {viewFileName}</h2>
            <button
              onClick={closeViewModal}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Информация об отчёте */}
          {viewTurnoverInfo && (
            <div className="mb-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                <div><span className="text-gray-500">Арендатор:</span> <span className="font-medium">{viewTurnoverInfo.tenant?.name || viewTurnoverInfo.tenantName || '-'}</span></div>
                <div><span className="text-gray-500">Период:</span> <span className="font-medium">{monthNames[(viewTurnoverInfo.month || 1) - 1]} {viewTurnoverInfo.year || '-'}</span></div>
                <div><span className="text-gray-500">Товарооборот с НДС:</span> <span className="font-medium">{(viewTurnoverInfo.amountWithVat ?? viewTurnoverInfo.turnover?.amountWithVat)?.toLocaleString('ru-RU') || '-'}</span></div>
                <div><span className="text-gray-500">Товарооборот без НДС:</span> <span className="font-medium">{(viewTurnoverInfo.amountNoVat ?? viewTurnoverInfo.turnover?.amountNoVat)?.toLocaleString('ru-RU') || '-'}</span></div>
                <div><span className="text-gray-500">Чеков:</span> <span className="font-medium">{(viewTurnoverInfo.receiptsCount ?? viewTurnoverInfo.turnover?.receiptsCount)?.toLocaleString('ru-RU') || '-'}</span></div>
              </div>
            </div>
          )}

          {/* Содержимое файла */}
          <div className="flex-1 p-6 overflow-hidden">
            {/* Предпросмотр изображения */}
            {(viewFileType.startsWith('image/') || viewFileUrl.match(/\.(png|jpg|jpeg|gif)$/i)) && (
              <div className="flex items-center justify-center h-full bg-gray-100">
                <img
                  src={viewFileUrl}
                  alt={viewFileName}
                  className="max-w-full max-h-[70vh] object-contain mx-auto block border border-gray-200 shadow"
                />
              </div>
            )}

            {/* Предпросмотр PDF */}
            {viewFileType === 'application/pdf' && (
              <iframe
                src={viewFileUrl}
                className="w-full h-full border-0"
                title={viewFileName}
              />
            )}

            {/* Сообщение для неподдерживаемых форматов */}
            {!viewFileType.startsWith('image/') && viewFileType !== 'application/pdf' && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Этот тип файла не поддерживается для просмотра</p>
                  <button
                    onClick={() => handleDownloadFile(viewFileUrl.replace('/view', '/download').replace('/view-pdf', '/download'), viewFileName)}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Скачать файл
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
} 