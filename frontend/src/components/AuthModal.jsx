// src/components/AuthModal.jsx
// مودال تسجيل الدخول — يظهر عند محاولة التسجيل بدون حساب

import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { userAPI } from "../api";
import { useUserAuth } from "../context/UserAuthContext";
import "./AuthModal.css";

const AuthModal = () => {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useUserAuth();

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError("");
      setLoading(true);
      try {
        const { data } = await userAPI.googleAuth(tokenResponse.access_token);
        login(data.token, data.user);
      } catch (err) {
        setError(err.response?.data?.message || "فشل تسجيل الدخول بجوجل");
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("فشل تسجيل الدخول بجوجل"),
    prompt: "select_account",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } =
        tab === "login"
          ? await userAPI.login({ email: form.email, password: form.password })
          : await userAPI.register(form);
      login(data.token, data.user);
    } catch (err) {
      setError(err.response?.data?.message || "حدث خطأ، حاول مجدداً");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal-card">
        <div className="auth-modal-logo">
          <span className="logo-arabic">رُحى</span>
          <span className="logo-tagline">سفر وتطوع</span>
        </div>

        <p className="auth-modal-prompt">
          لازم تسجّل دخولك أو تنشئ حساباً للمتابعة
        </p>

        <div className="auth-tabs">
          <button
            className={`auth-tab${tab === "login" ? " active" : ""}`}
            onClick={() => { setTab("login"); setError(""); }}
          >
            دخول
          </button>
          <button
            className={`auth-tab${tab === "register" ? " active" : ""}`}
            onClick={() => { setTab("register"); setError(""); }}
          >
            حساب جديد
          </button>
        </div>

        <form onSubmit={handleSubmit} className="user-auth-form">
          {tab === "register" && (
            <div className="auth-field">
              <label>الاسم الكامل</label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="محمد أحمد"
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label>البريد الإلكتروني</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@email.com"
              required
              style={{ direction: "ltr", textAlign: "right" }}
            />
          </div>

          <div className="auth-field">
            <label>كلمة المرور</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••"
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "..." : tab === "login" ? "دخول" : "إنشاء الحساب"}
          </button>
        </form>

        <div className="auth-divider"><span>أو</span></div>

        <div className="google-btn-wrapper">
          <button
            className="google-signin-btn"
            onClick={() => googleLogin()}
            disabled={loading}
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              width="20"
            />
            تسجيل الدخول بـ Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
