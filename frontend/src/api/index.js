// src/api/index.js
// كل طلبات الـ API من مكان واحد

import axios from "axios";

// أنشئ instance من axios مع الإعدادات الافتراضية
const api = axios.create({
  baseURL: "/api", // يستخدم الـ proxy في vite.config.js
  headers: {
    "Content-Type": "application/json",
  },
});

// ==============================
// Interceptor: أضف التوكن تلقائياً لكل طلب محمي
// ==============================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ruha_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==============================
// Trips API
// ==============================
export const tripsAPI = {
  // للزوار
  getAll: () => api.get("/trips"),
  getFeatured: () => api.get("/trips/featured"),
  getBySlug: (slug) => api.get(`/trips/${slug}`),

  // للآدمن
  getAdminAll: () => api.get("/trips/admin/all"),
  getAdminById: (id) => api.get(`/trips/admin/${id}`),
  create: (data) => api.post("/trips", data),
  update: (id, data) => api.put(`/trips/${id}`, data),
  delete: (id) => api.delete(`/trips/${id}`),
};

// ==============================
// Auth API
// ==============================
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  getMe: () => api.get("/auth/me"),
};

// ==============================
// Applications API
// ==============================
export const applicationsAPI = {
  submit: (data) => api.post("/applications", data),
  getAll: (params) => api.get("/applications", { params }),
  getById: (id) => api.get(`/applications/${id}`),
  updateStatus: (id, data) => api.put(`/applications/${id}`, data),
  delete: (id) => api.delete(`/applications/${id}`),
};

export default api;
