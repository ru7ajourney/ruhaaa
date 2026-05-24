// src/context/AuthContext.jsx
// إدارة حالة تسجيل الدخول للآدمن على مستوى التطبيق كله

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { authAPI } from "../api";

const AuthContext = createContext(null);

const REFRESH_INTERVAL = 25 * 60 * 1000; // 25 دقيقة

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef(null);

  const startRefreshTimer = () => {
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    refreshTimer.current = setInterval(async () => {
      try {
        const { data } = await authAPI.refresh();
        localStorage.setItem("ruha_token", data.token);
      } catch {
        // التوكن انتهى — أخرج الأدمن
        localStorage.removeItem("ruha_token");
        setAdmin(null);
        clearInterval(refreshTimer.current);
      }
    }, REFRESH_INTERVAL);
  };

  const stopRefreshTimer = () => {
    if (refreshTimer.current) {
      clearInterval(refreshTimer.current);
      refreshTimer.current = null;
    }
  };

  // عند تحميل التطبيق: تحقق من التوكن المحفوظ
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("ruha_token");
      if (token) {
        try {
          const { data } = await authAPI.getMe();
          setAdmin(data.admin);
          startRefreshTimer();
        } catch {
          localStorage.removeItem("ruha_token");
        }
      }
      setLoading(false);
    };
    checkAuth();
    return () => stopRefreshTimer();
  }, []);

  // تسجيل الدخول
  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem("ruha_token", data.token);
    setAdmin(data.admin);
    startRefreshTimer();
    return data;
  };

  // تسجيل الخروج
  const logout = () => {
    localStorage.removeItem("ruha_token");
    setAdmin(null);
    stopRefreshTimer();
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
