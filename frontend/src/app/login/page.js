"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);

      const payload = JSON.parse(atob(res.data.token.split(".")[1]));
      if (payload.role === "admin") {
        router.push("/admin");
      } else {
        router.push(`/tenant/${payload.tenantId}`);
      }
    } catch (err) {
      setError("Неверный email или пароль. Попробуйте снова.");
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
          Вход в SCUD-SYSTEM
        </h1>
        <p className="text-center text-gray-500 text-base mb-2">Портал арендаторов</p>

        {error && (
          <div className="w-full bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2 text-center font-medium animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </span>
            <input
              type="email"
              placeholder="Email (или 'admin' для администратора)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 pl-11 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base bg-white"
              required
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
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 pl-11 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base bg-white"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-lg p-3 font-semibold shadow-lg transition text-lg mt-2"
          >
            Войти
          </button>
        </form>

        <button
          onClick={() => router.push("/register")}
          className="w-full bg-white border border-orange-300 hover:bg-orange-50 text-orange-600 rounded-lg p-3 font-medium shadow transition mt-2"
        >
          Зарегистрироваться как арендатор
        </button>

        <p className="text-gray-400 text-xs text-center mt-6 select-none">
          © {new Date().getFullYear()} KazanMall
        </p>
      </div>
    </div>
  );
}
