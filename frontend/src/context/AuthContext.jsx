// src/context/AuthContext.jsx
// إدارة حالة تسجيل الدخول للآدمن على مستوى التطبيق كله

import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../api";

// أنشئ الـ Context
const AuthContext = createContext(null);

// ==============================
// Provider - يلف التطبيق كله
// ==============================
export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);      // بيانات الآدمن
  const [loading, setLoading] = useState(true);  // هل يجري التحقق؟

  // عند تحميل التطبيق: تحقق من التوكن المحفوظ
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("ruha_token");
      if (token) {
        try {
          const { data } = await authAPI.getMe();
          setAdmin(data.admin);
        } catch {
          // التوكن منتهي أو غير صالح
          localStorage.removeItem("ruha_token");
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // تسجيل الدخول
  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem("ruha_token", data.token);
    setAdmin(data.admin);
    return data;
  };

  // تسجيل الخروج
  const logout = () => {
    localStorage.removeItem("ruha_token");
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook مخصص لاستخدام الـ Context بسهولة
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
