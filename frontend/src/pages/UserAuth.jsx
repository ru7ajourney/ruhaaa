import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { userAPI } from "../api";
import { useUserAuth } from "../context/UserAuthContext";
import useGeo from "../hooks/useGeo";
import COUNTRIES from "../utils/countries";
import "./UserAuth.css";

const UserAuth = () => {
  const geo = useGeo();
  const [tab, setTab]         = useState("login");
  const [form, setForm]       = useState({ fullName: "", email: "", password: "", country: "" });

  // ضبط الدولة تلقائياً بمجرد معرفتها
  useEffect(() => {
    if (geo?.country && !form.country) {
      setForm((p) => ({ ...p, country: geo.country }));
    }
  }, [geo]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [otpStep, setOtpStep]               = useState(false);
  const [pendingEmail, setPendingEmail]     = useState("");
  const [otp, setOtp]                       = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // forgot password
  const [forgotStep, setForgotStep]     = useState(""); // "" | "email" | "otp" | "newpass"
  const [forgotEmail, setForgotEmail]   = useState("");
  const [forgotOtp, setForgotOtp]       = useState("");
  const [newPassword, setNewPassword]   = useState("");
  const [forgotCooldown, setForgotCooldown] = useState(0);

  // phone auth
  const [phoneStep, setPhoneStep]               = useState(""); // "" | "input" | "otp" | "name"
  const [phoneNumber, setPhoneNumber]           = useState("");
  const [phoneOtp, setPhoneOtp]                 = useState("");
  const [phoneName, setPhoneName]               = useState("");
  const [phoneCountry, setPhoneCountry]         = useState("");
  const [phoneRegToken, setPhoneRegToken]       = useState("");
  const [phoneCooldown, setPhoneCooldown]       = useState(0);

  const { login } = useUserAuth();
  const navigate  = useNavigate();

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError("");
      setLoading(true);
      try {
        const { data } = await userAPI.googleAuth(tokenResponse.access_token);
        login(data.token, data.user);
        navigate("/trips");
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
        navigate("/trips");
      } else {
        await userAPI.register({ fullName: form.fullName, email: form.email, password: form.password, country: form.country });
        setPendingEmail(form.email);
        setOtpStep(true);
        startCooldown();
      }
    } catch (err) {
      const errData = err.response?.data;
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
      navigate("/trips");
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

  const startForgotCooldown = () => {
    setForgotCooldown(60);
    const interval = setInterval(() => {
      setForgotCooldown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleForgotEmail = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await userAPI.forgotPassword({ email: forgotEmail });
      setForgotStep("otp");
      startForgotCooldown();
    } catch (err) {
      setError(err.response?.data?.message || "حدث خطأ، حاول مجدداً");
    } finally { setLoading(false); }
  };

  const handleForgotOtp = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      // نتحقق من الكود بإرسال كلمة مرور وهمية ليست فارغة — السيرفر بيتحقق من OTP أولاً
      // بدلاً من ذلك ننتقل للخطوة التالية مباشرة
      setForgotStep("newpass");
    } catch (err) {
      setError(err.response?.data?.message || "الكود غير صحيح");
    } finally { setLoading(false); }
  };

  const handleForgotResend = async () => {
    if (forgotCooldown > 0) return;
    setError("");
    try {
      await userAPI.forgotPassword({ email: forgotEmail });
      startForgotCooldown();
    } catch (err) {
      setError(err.response?.data?.message || "فشل إرسال الكود");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await userAPI.resetPassword({ email: forgotEmail, otp: forgotOtp, newPassword });
      setForgotStep("done");
    } catch (err) {
      setError(err.response?.data?.message || "حدث خطأ، تحقق من الكود وحاول مجدداً");
    } finally { setLoading(false); }
  };

  const startPhoneCooldown = () => {
    setPhoneCooldown(60);
    const interval = setInterval(() => {
      setPhoneCooldown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handlePhoneSend = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await userAPI.phoneSendOtp({ phone: phoneNumber });
      setPhoneStep("otp");
      setPhoneOtp("");
      startPhoneCooldown();
    } catch (err) {
      setError(err.response?.data?.message || "فشل إرسال الكود");
    } finally { setLoading(false); }
  };

  const handlePhoneVerify = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data } = await userAPI.phoneVerifyOtp({ phone: phoneNumber, otp: phoneOtp });
      if (data.needsName) {
        setPhoneRegToken(data.registrationToken);
        setPhoneCountry(geo?.country || "");
        setPhoneStep("name");
      } else {
        login(data.token, data.user);
        navigate("/trips");
      }
    } catch (err) {
      setError(err.response?.data?.message || "الكود غير صحيح");
    } finally { setLoading(false); }
  };

  const handlePhoneComplete = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data } = await userAPI.phoneComplete({ registrationToken: phoneRegToken, fullName: phoneName, country: phoneCountry });
      login(data.token, data.user);
      navigate("/trips");
    } catch (err) {
      setError(err.response?.data?.message || "حدث خطأ، ابدأ من جديد");
    } finally { setLoading(false); }
  };

  const handlePhoneResend = async () => {
    if (phoneCooldown > 0) return;
    setError("");
    try {
      await userAPI.phoneSendOtp({ phone: phoneNumber });
      startPhoneCooldown();
    } catch (err) {
      setError(err.response?.data?.message || "فشل إرسال الكود");
    }
  };

  // ===== شاشة phone: إدخال رقم =====
  if (phoneStep === "input") {
    return (
      <div className="user-auth-page">
        <div className="user-auth-card">
          <div className="user-auth-logo">
            <span className="logo-arabic">رُحى</span>
            <span className="logo-tagline">سفر وتطوع</span>
          </div>
          <div className="otp-icon">📱</div>
          <h2>الدخول برقم الهاتف</h2>
          <p className="otp-desc">سنرسل لك كود تحقق عبر واتساب</p>
          <form onSubmit={handlePhoneSend} className="user-auth-form">
            <div className="auth-field">
              <label>رقم الهاتف (مع كود الدولة)</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+970 59 000 0000"
                required
                style={{ direction: "ltr", textAlign: "right" }}
              />
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="auth-submit-btn" disabled={loading || phoneNumber.length < 7}>
              {loading ? "..." : "إرسال الكود عبر واتساب"}
            </button>
          </form>
          <p className="auth-back-link">
            <button className="otp-back-link" onClick={() => { setPhoneStep(""); setError(""); }}>
              ← العودة
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ===== شاشة phone: إدخال OTP =====
  if (phoneStep === "otp") {
    return (
      <div className="user-auth-page">
        <div className="user-auth-card">
          <div className="user-auth-logo">
            <span className="logo-arabic">رُحى</span>
            <span className="logo-tagline">سفر وتطوع</span>
          </div>
          <div className="otp-icon">💬</div>
          <h2>أدخل كود واتساب</h2>
          <p className="otp-desc">
            أرسلنا كود مكوّن من 6 أرقام عبر واتساب إلى<br />
            <strong style={{ direction: "ltr", display: "inline-block" }}>{phoneNumber}</strong>
          </p>
          <form onSubmit={handlePhoneVerify} className="user-auth-form">
            <div className="auth-field">
              <label>كود التحقق</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={phoneOtp}
                onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="_ _ _ _ _ _"
                required
                style={{ direction: "ltr", textAlign: "center", letterSpacing: "8px", fontSize: "1.4rem" }}
              />
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="auth-submit-btn" disabled={loading || phoneOtp.length < 6}>
              {loading ? "..." : "تحقق"}
            </button>
          </form>
          <button className="otp-resend-btn" onClick={handlePhoneResend} disabled={phoneCooldown > 0}>
            {phoneCooldown > 0 ? `إعادة الإرسال بعد ${phoneCooldown}ث` : "إعادة إرسال الكود"}
          </button>
          <p className="auth-back-link">
            <button className="otp-back-link" onClick={() => { setPhoneStep("input"); setPhoneOtp(""); setError(""); }}>
              ← تغيير الرقم
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ===== شاشة phone: إدخال الاسم (مستخدم جديد) =====
  if (phoneStep === "name") {
    return (
      <div className="user-auth-page">
        <div className="user-auth-card">
          <div className="user-auth-logo">
            <span className="logo-arabic">رُحى</span>
            <span className="logo-tagline">سفر وتطوع</span>
          </div>
          <div className="otp-icon">👋</div>
          <h2>أهلاً بك في رُحى!</h2>
          <p className="otp-desc">آخر خطوة — أخبرنا باسمك</p>
          <form onSubmit={handlePhoneComplete} className="user-auth-form">
            <div className="auth-field">
              <label>الاسم الكامل</label>
              <input
                type="text"
                value={phoneName}
                onChange={(e) => setPhoneName(e.target.value)}
                placeholder="محمد أحمد"
                required
              />
            </div>
            <div className="auth-field">
              <label>الدولة</label>
              <select value={phoneCountry} onChange={(e) => setPhoneCountry(e.target.value)}>
                <option value="">اختر دولتك</option>
                {COUNTRIES.map((c, i) =>
                  c.code === "" ? (
                    <option key={i} value="" disabled>{c.name}</option>
                  ) : (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  )
                )}
              </select>
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="auth-submit-btn" disabled={loading || phoneName.trim().length < 2}>
              {loading ? "..." : "إنشاء الحساب والدخول"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ===== شاشة نسيت كلمة المرور — إيميل =====
  if (forgotStep === "email") {
    return (
      <div className="user-auth-page">
        <div className="user-auth-card">
          <div className="user-auth-logo">
            <span className="logo-arabic">رُحى</span>
            <span className="logo-tagline">سفر وتطوع</span>
          </div>
          <div className="otp-icon">🔑</div>
          <h2>نسيت كلمة المرور؟</h2>
          <p className="otp-desc">أدخل إيميلك وسنرسل لك كود لإعادة التعيين</p>
          <form onSubmit={handleForgotEmail} className="user-auth-form">
            <div className="auth-field">
              <label>البريد الإلكتروني</label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="example@email.com"
                required
                style={{ direction: "ltr", textAlign: "right" }}
              />
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? "..." : "إرسال الكود"}
            </button>
          </form>
          <p className="auth-back-link">
            <button className="otp-back-link" onClick={() => { setForgotStep(""); setError(""); }}>
              ← العودة لتسجيل الدخول
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ===== شاشة نسيت كلمة المرور — OTP =====
  if (forgotStep === "otp") {
    return (
      <div className="user-auth-page">
        <div className="user-auth-card">
          <div className="user-auth-logo">
            <span className="logo-arabic">رُحى</span>
            <span className="logo-tagline">سفر وتطوع</span>
          </div>
          <div className="otp-icon">📧</div>
          <h2>أدخل الكود</h2>
          <p className="otp-desc">
            أرسلنا كود مكوّن من 6 أرقام إلى<br />
            <strong>{forgotEmail}</strong>
          </p>
          <form onSubmit={handleForgotOtp} className="user-auth-form">
            <div className="auth-field">
              <label>كود إعادة التعيين</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={forgotOtp}
                onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="_ _ _ _ _ _"
                required
                style={{ direction: "ltr", textAlign: "center", letterSpacing: "8px", fontSize: "1.4rem" }}
              />
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="auth-submit-btn" disabled={loading || forgotOtp.length < 6}>
              {loading ? "..." : "التالي"}
            </button>
          </form>
          <button className="otp-resend-btn" onClick={handleForgotResend} disabled={forgotCooldown > 0}>
            {forgotCooldown > 0 ? `إعادة الإرسال بعد ${forgotCooldown}ث` : "إعادة إرسال الكود"}
          </button>
          <p className="auth-back-link">
            <button className="otp-back-link" onClick={() => { setForgotStep("email"); setForgotOtp(""); setError(""); }}>
              ← تغيير الإيميل
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ===== شاشة نسيت كلمة المرور — كلمة مرور جديدة =====
  if (forgotStep === "newpass") {
    return (
      <div className="user-auth-page">
        <div className="user-auth-card">
          <div className="user-auth-logo">
            <span className="logo-arabic">رُحى</span>
            <span className="logo-tagline">سفر وتطوع</span>
          </div>
          <div className="otp-icon">🔒</div>
          <h2>كلمة مرور جديدة</h2>
          <p className="otp-desc">اختر كلمة مرور جديدة لحسابك</p>
          <form onSubmit={handleResetPassword} className="user-auth-form">
            <div className="auth-field">
              <label>كلمة المرور الجديدة</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••"
                minLength={6}
                required
              />
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="auth-submit-btn" disabled={loading || newPassword.length < 6}>
              {loading ? "..." : "تغيير كلمة المرور"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ===== شاشة نجاح إعادة التعيين =====
  if (forgotStep === "done") {
    return (
      <div className="user-auth-page">
        <div className="user-auth-card" style={{ textAlign: "center" }}>
          <div className="user-auth-logo">
            <span className="logo-arabic">رُحى</span>
            <span className="logo-tagline">سفر وتطوع</span>
          </div>
          <div className="otp-icon">✅</div>
          <h2>تم تغيير كلمة المرور!</h2>
          <p className="otp-desc">يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة</p>
          <button
            className="auth-submit-btn"
            style={{ marginTop: "8px" }}
            onClick={() => { setForgotStep(""); setError(""); setForgotEmail(""); setForgotOtp(""); setNewPassword(""); }}
          >
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  // ===== شاشة التحقق =====
  if (otpStep) {
    return (
      <div className="user-auth-page">
        <div className="user-auth-card">
          <div className="user-auth-logo">
            <span className="logo-arabic">رُحى</span>
            <span className="logo-tagline">سفر وتطوع</span>
          </div>

          <div className="otp-icon">📧</div>
          <h2>تحقق من إيميلك</h2>
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

          <p className="auth-back-link">
            <button className="otp-back-link" onClick={() => { setOtpStep(false); setOtp(""); setError(""); }}>
              ← تغيير الإيميل
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ===== شاشة تسجيل الدخول =====
  return (
    <div className="user-auth-page">
      <div className="user-auth-card">
        <div className="user-auth-logo">
          <span className="logo-arabic">رُحى</span>
          <span className="logo-tagline">سفر وتطوع</span>
        </div>
        <h2>{tab === "login" ? "تسجيل الدخول" : "إنشاء حساب"}</h2>

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

          {tab === "register" && (
            <div className="auth-field">
              <label>الدولة</label>
              <select
                name="country"
                value={form.country}
                onChange={handleChange}
              >
                <option value="">اختر دولتك</option>
                {COUNTRIES.map((c, i) =>
                  c.code === "" ? (
                    <option key={i} value="" disabled>{c.name}</option>
                  ) : (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  )
                )}
              </select>
            </div>
          )}

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

          {tab === "login" && (
            <p style={{ textAlign: "center", margin: "12px 0 0" }}>
              <button
                type="button"
                className="otp-back-link"
                onClick={() => { setForgotStep("email"); setError(""); setForgotEmail(form.email); }}
              >
                نسيت كلمة المرور؟
              </button>
            </p>
          )}
        </form>

        <div className="auth-divider">
          <span>أو</span>
        </div>

        <div className="google-btn-wrapper">
          <button className="google-signin-btn" onClick={() => googleLogin()} disabled={loading}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" />
            تسجيل الدخول بـ Google
          </button>
        </div>

        <div className="google-btn-wrapper" style={{ marginTop: "10px" }}>
          <button
            className="google-signin-btn phone-signin-btn"
            onClick={() => { setPhoneStep("input"); setError(""); setPhoneNumber(""); }}
            disabled={loading}
          >
            📱 الدخول برقم الهاتف (واتساب)
          </button>
        </div>

        <p className="auth-back-link">
          <Link to="/">← العودة للموقع</Link>
        </p>
      </div>
    </div>
  );
};

export default UserAuth;
