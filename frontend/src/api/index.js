// src/api/index.js
// كل طلبات الـ API من مكان واحد

import axios from "axios";

// أنشئ instance من axios مع الإعدادات الافتراضية
const API_BASE = (import.meta.env.VITE_API_URL || "") + "/api";

const api = axios.create({
  baseURL: API_BASE, // dev: "/api" (proxy)، prod: "https://your-backend.onrender.com/api"
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor للأدمن فقط
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ruha_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// instance منفصل للمستخدم العادي — يستخدم user token فقط
const userApi = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

userApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("ruha_user_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
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
// Gallery API
// ==============================
export const galleryAPI = {
  getAll:      ()          => api.get("/gallery"),
  getFeatured: ()          => api.get("/gallery/featured"),
  create:      (data)      => api.post("/gallery", data),
  upload:      (formData)  => api.post("/gallery/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  update:      (id, data)  => api.patch(`/gallery/${id}`, data),
  delete:      (id)        => api.delete(`/gallery/${id}`),
};

// ==============================
// Applications API
// ==============================
export const applicationsAPI = {
  submit: (data) => userApi.post("/applications", data),
  getAll: (params) => api.get("/applications", { params }),
  getById: (id) => api.get(`/applications/${id}`),
  updateStatus: (id, data) => api.put(`/applications/${id}`, data),
  confirmDeposit: (id) => api.post(`/applications/${id}/confirm-deposit`),
  delete: (id) => api.delete(`/applications/${id}`),
};

// ==============================
// Subscribers API
// ==============================
export const subscribersAPI = {
  getAll:       (q, country, gender) => api.get("/subscribers", { params: { ...(q && { q }), ...(country && { country }), ...(gender && { gender }) } }),
  getCountries: ()                   => api.get("/subscribers/countries"),
  delete:       (id)                 => api.delete(`/subscribers/${id}`),
};

// ==============================
// Policy Versions API
// ==============================
export const policyVersionsAPI = {
  getAll:   ()         => api.get("/policy-versions"),
  getById:  (id)       => api.get(`/policy-versions/${id}`),
  save:     (policies) => api.post("/policy-versions", { policies }),
  delete:   (id)       => api.delete(`/policy-versions/${id}`),
};

// ==============================
// User API
// ==============================
export const userAPI = {
  register: (data) => userApi.post("/users/register", data),
  verifyEmail: (data) => userApi.post("/users/verify-email", data),
  resendOtp: (data) => userApi.post("/users/resend-otp", data),
  login: (data) => userApi.post("/users/login", data),
  getMe: () => userApi.get("/users/me"),
  getMyApplications: () => userApi.get("/users/my-applications"),
  payDeposit: (id, data) => userApi.post(`/users/applications/${id}/pay`, data),
  googleAuth: (credential) => userApi.post("/users/google-auth", { credential }),
  createPaypalOrder: (id, data) => userApi.post(`/users/applications/${id}/create-paypal-order`, data),
  capturePaypalOrder: (id, data) => userApi.post(`/users/applications/${id}/capture-paypal-order`, data),
};

export default api;
