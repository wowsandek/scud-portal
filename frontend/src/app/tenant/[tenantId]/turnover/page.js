"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { API_BASE_URL } from "../../../../config/api";

export default function TurnoverPage() {
  const router = useRouter();
  const { tenantId } = useParams();

  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [amountNoVat, setAmountNoVat] = useState("");
  const [amountWithVat, setAmountWithVat] = useState("");
  const [receiptsCount, setReceiptsCount] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnovers, setTurnovers] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [loadingChart, setLoadingChart] = useState(false);

  const allowedTypes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ];

  const monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];

  const fetchTurnovers = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/turnover/tenant/${tenantId}`);
      setTurnovers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchChartData = async (year) => {
    setLoadingChart(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/turnover/tenant/${tenantId}/chart/${year}`);
      setChartData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChart(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchTurnovers();
      fetchChartData(selectedYear);
    }
  }, [tenantId, selectedYear]);

  const handleFileChange = (e) => {
    setError("");
    setSuccess("");
    const f = e.target.files[0];
    if (f && !allowedTypes.includes(f.type)) {
      setError("Файл должен быть PDF, PNG, JPEG или Excel");
      setFile(null);
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!month || !year || !amountNoVat || !amountWithVat || !receiptsCount || !file) {
      setError("Заполните все поля и выберите файл");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("month", month);
      formData.append("year", year);
      formData.append("amountNoVat", amountNoVat);
      formData.append("amountWithVat", amountWithVat);
      formData.append("receiptsCount", receiptsCount);
      formData.append("file", file);
      formData.append("tenantId", tenantId);
      await axios.post(`${API_BASE_URL}/api/turnover`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess("Данные успешно отправлены!");
      setMonth("");
      setYear(new Date().getFullYear().toString());
      setAmountNoVat("");
      setAmountWithVat("");
      setReceiptsCount("");
      setFile(null);
      // Обновляем список после успешной отправки
      fetchTurnovers();
      fetchChartData(selectedYear);
    } catch (err) {
      setError(err.response?.data?.error || "Ошибка при отправке данных");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header с навигацией */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Товарооборот</h1>
                <p className="text-sm text-gray-500">Аналитика и управление отчетами</p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/tenant/${tenantId}`)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Назад в кабинет</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Статистика сверху */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Всего отчетов</p>
                <p className="text-2xl font-bold">{turnovers.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Товарооборот {selectedYear}</p>
                <p className="text-2xl font-bold">
                  {(chartData.reduce((sum, item) => sum + item.amountWithVat, 0) / 1000000).toFixed(1)}M ₽
                </p>
              </div>
              <div className="w-12 h-12 bg-green-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Чеков {selectedYear}</p>
                <p className="text-2xl font-bold">
                  {chartData.reduce((sum, item) => sum + item.receiptsCount, 0).toLocaleString('ru-RU')}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Месяцев с данными</p>
                <p className="text-2xl font-bold">
                  {chartData.filter(item => item.hasData).length}/12
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* График товарооборота */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Товарооборот</h1>
            <p className="text-gray-500">Загрузите данные по товарообороту за прошедший месяц</p>
          </div>
          <button
            onClick={() => router.push(`/tenant/${tenantId}`)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Назад</span>
          </button>
        </div>
        {error && <div className="mb-4 text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center">{error}</div>}
        {success && <div className="mb-4 text-green-700 bg-green-50 border border-green-200 rounded p-2 text-center">{success}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Месяц</label>
              <select
                value={month}
                onChange={e => setMonth(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              >
                <option value="">Выберите месяц</option>
                <option value="1">Январь</option>
                <option value="2">Февраль</option>
                <option value="3">Март</option>
                <option value="4">Апрель</option>
                <option value="5">Май</option>
                <option value="6">Июнь</option>
                <option value="7">Июль</option>
                <option value="8">Август</option>
                <option value="9">Сентябрь</option>
                <option value="10">Октябрь</option>
                <option value="11">Ноябрь</option>
                <option value="12">Декабрь</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Год</label>
              <select
                value={year}
                onChange={e => setYear(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              >
                <option value="">Выберите год</option>
                <option value="2020">2020</option>
                <option value="2021">2021</option>
                <option value="2022">2022</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
                <option value="2029">2029</option>
                <option value="2030">2030</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Сумма товарооборота без НДС</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amountNoVat}
              onChange={e => setAmountNoVat(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Введите сумму без НДС"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Сумма товарооборота с НДС</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amountWithVat}
              onChange={e => setAmountWithVat(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Введите сумму с НДС"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Количество чеков</label>
            <input
              type="number"
              min="0"
              step="1"
              value={receiptsCount}
              onChange={e => setReceiptsCount(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Введите количество чеков"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Загрузить файл-отчёт (pdf, png, jpeg, xls, xlsx)</label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/png,image/jpeg"
              onChange={handleFileChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
              required
            />
            {file && <div className="text-xs text-gray-500 mt-1">Файл: {file.name}</div>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 font-semibold shadow-lg transition text-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Отправка..." : "Отправить"}
          </button>
        </form>
        </div>

        {/* График товарооборота */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">График товарооборота</h2>
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Год:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="2020">2020</option>
                <option value="2021">2021</option>
                <option value="2022">2022</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
                <option value="2029">2029</option>
                <option value="2030">2030</option>
              </select>
            </div>
          </div>

          {loadingChart ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Загрузка графика...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* График товарооборота */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Товарооборот по месяцам</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="monthName" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value.toLocaleString('ru-RU')} ₽`, 
                        name === 'amountNoVat' ? 'Без НДС' : 'С НДС'
                      ]}
                      labelFormatter={(label) => `${label} ${selectedYear}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="amountNoVat" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Без НДС"
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amountWithVat" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="С НДС"
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* График количества чеков */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Количество чеков по месяцам</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="monthName" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => [value.toLocaleString('ru-RU'), 'Количество чеков']}
                      labelFormatter={(label) => `${label} ${selectedYear}`}
                    />
                    <Bar 
                      dataKey="receiptsCount" 
                      fill="#8B5CF6" 
                      name="Количество чеков"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Статистика за год */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-blue-600 mb-1">Общий товарооборот без НДС</p>
                  <p className="text-xl font-bold text-blue-800">
                    {chartData.reduce((sum, item) => sum + item.amountNoVat, 0).toLocaleString('ru-RU')} ₽
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-green-600 mb-1">Общий товарооборот с НДС</p>
                  <p className="text-xl font-bold text-green-800">
                    {chartData.reduce((sum, item) => sum + item.amountWithVat, 0).toLocaleString('ru-RU')} ₽
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-sm text-purple-600 mb-1">Общее количество чеков</p>
                  <p className="text-xl font-bold text-purple-800">
                    {chartData.reduce((sum, item) => sum + item.receiptsCount, 0).toLocaleString('ru-RU')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Форма загрузки и история в двух колонках */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Форма загрузки */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 sticky top-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Загрузить отчет</h2>
                  <p className="text-sm text-gray-500">Новые данные за месяц</p>
                </div>
              </div>

              {error && <div className="mb-4 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">{error}</div>}
              {success && <div className="mb-4 text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">{success}</div>}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Месяц</label>
                    <select
                      value={month}
                      onChange={e => setMonth(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      required
                    >
                      <option value="">Выберите</option>
                      <option value="1">Январь</option>
                      <option value="2">Февраль</option>
                      <option value="3">Март</option>
                      <option value="4">Апрель</option>
                      <option value="5">Май</option>
                      <option value="6">Июнь</option>
                      <option value="7">Июль</option>
                      <option value="8">Август</option>
                      <option value="9">Сентябрь</option>
                      <option value="10">Октябрь</option>
                      <option value="11">Ноябрь</option>
                      <option value="12">Декабрь</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Год</label>
                    <select
                      value={year}
                      onChange={e => setYear(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      required
                    >
                      <option value="">Год</option>
                      <option value="2020">2020</option>
                      <option value="2021">2021</option>
                      <option value="2022">2022</option>
                      <option value="2023">2023</option>
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                      <option value="2028">2028</option>
                      <option value="2029">2029</option>
                      <option value="2030">2030</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Сумма без НДС</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountNoVat}
                    onChange={e => setAmountNoVat(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Сумма с НДС</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountWithVat}
                    onChange={e => setAmountWithVat(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Количество чеков</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={receiptsCount}
                    onChange={e => setReceiptsCount(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="0"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Файл отчета</label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/png,image/jpeg"
                    onChange={handleFileChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                    required
                  />
                  {file && <div className="text-xs text-gray-500 mt-1">✓ {file.name}</div>}
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg py-3 font-semibold shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Отправка...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>Загрузить отчет</span>
                    </div>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* История товарооборота */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">История отчетов</h2>
                    <p className="text-sm text-gray-500">Все загруженные данные</p>
                  </div>
                </div>
                <button
                  onClick={fetchTurnovers}
                  disabled={loadingHistory}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{loadingHistory ? "Обновление..." : "Обновить"}</span>
                </button>
              </div>

          {loadingHistory ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Загрузка истории...</p>
            </div>
          ) : turnovers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500">История товарооборота пуста</p>
              <p className="text-sm text-gray-400">Загрузите первый отчёт выше</p>
            </div>
          ) : (
            <div className="space-y-4">
              {turnovers.map((turnover) => (
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
                            Загружено {new Date(turnover.createdAt).toLocaleDateString('ru-RU')}
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

                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="text-sm text-gray-600">{turnover.fileName}</span>
                        <span className="text-xs text-gray-400">
                          ({(turnover.fileSize / 1024 / 1024).toFixed(2)} МБ)
                        </span>
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
      </div>
    </div>
  );
} 