// src/components/AuthModal.jsx
import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { userAPI } from "../api";
import { useUserAuth } from "../context/UserAuthContext";
import "./AuthModal.css";

const AuthModal = () => {
  const [tab, setTab]         = useState("login");
  const [form, setForm]       = useState({ fullName: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  // بعد التسجيل — شاشة التحقق
  const [otpStep, setOtpStep]         = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp]                   = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

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
      if (tab === "login") {
        const { data } = await userAPI.login({ email: form.email, password: form.password });
        login(data.token, data.user);
      } else {
        await userAPI.register(form);
        setPendingEmail(form.email);
        setOtpStep(true);
        startCooldown();
      }
    } catch (err) {
      const errData = err.response?.data;
      // لو سجّل دخول وحسابه غير مفعّل
      if (errData?.needsVerification) {
        setPendingEmail(errData.email);
        setOtpStep(true);
        startCooldown();
        return;
      }
      setError(
        errData?.message ||
        (err.message === "Network Error" ? "تعذّر الاتصال بالسيرفر" : "حدث خطأ، حاول مجدداً")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await userAPI.verifyEmail({ email: pendingEmail, otp });
      login(data.token, data.user);
    } catch (err) {
      setError(err.response?.data?.message || "الكود غير صحيح");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    try {
      await userAPI.resendOtp({ email: pendingEmail });
      startCooldown();
    } catch (err) {
      setError(err.response?.data?.message || "فشل إرسال الكود");
    }
  };

  const startCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  // ===== شاشة التحقق من الإيميل =====
  if (otpStep) {
    return (
      <div className="auth-modal-overlay">
        <div className="auth-modal-card">
          <div className="auth-modal-logo">
            <span className="logo-arabic">رُحى</span>
            <span className="logo-tagline">سفر وتطوع</span>
          </div>

          <div className="otp-icon">📧</div>
          <h3 className="otp-title">تحقق من إيميلك</h3>
          <p className="otp-desc">
            أرسلنا كود مكوّن من 6 أرقام إلى<br />
            <strong>{pendingEmail}</strong>
          </p>

          <form onSubmit={handleVerify} className="user-auth-form">
            <div className="auth-field">
              <label>كود التفعيل</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="_ _ _ _ _ _"
                className="otp-input"
                required
                style={{ direction: "ltr", textAlign: "center", letterSpacing: "8px", fontSize: "1.4rem" }}
              />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-submit-btn" disabled={loading || otp.length < 6}>
              {loading ? "..." : "تفعيل الحساب"}
            </button>
          </form>

          <button
            className="otp-resend-btn"
            onClick={handleResend}
            disabled={resendCooldown > 0}
          >
            {resendCooldown > 0 ? `إعادة الإرسال بعد ${resendCooldown}ث` : "إعادة إرسال الكود"}
          </button>
        </div>
      </div>
    );
  }

  // ===== شاشة تسجيل الدخول / الحساب الجديد =====
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
