import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../api";
import { useUserAuth } from "../context/UserAuthContext";
import useGeo from "../hooks/useGeo";
import COUNTRIES from "../utils/countries";
import PhoneCountryPicker from "../components/PhoneCountryPicker";
import "./UserProfile.css";

const findDialCode = (isoCode) =>
  COUNTRIES.find((c) => c.code === isoCode)?.dialCode || "";

const splitPhone = (fullPhone) => {
  if (!fullPhone) return { dialCode: "", local: "" };
  const country = COUNTRIES.find(
    (c) => c.code !== "--" && c.dialCode && fullPhone.startsWith(c.dialCode)
  );
  return country
    ? { dialCode: country.dialCode, local: fullPhone.slice(country.dialCode.length) }
    : { dialCode: "", local: fullPhone };
};

const DaysLock = ({ days }) => (
  <span className="profile-lock-badge">🔒 يتاح بعد {days} يوم</span>
);

// ===== قسم الاسم =====
const NameSection = ({ user, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue]     = useState(user.fullName);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const locked = user.nameDaysLeft > 0;

  const save = async () => {
    if (!value.trim() || value.trim() === user.fullName) { setEditing(false); return; }
    setError(""); setLoading(true);
    try {
      const { data } = await userAPI.updateName({ fullName: value.trim() });
      onUpdate(data.user);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "حدث خطأ");
    } finally { setLoading(false); }
  };

  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <span className="profile-section-label">الاسم الكامل</span>
        {locked ? <DaysLock days={user.nameDaysLeft} /> : !editing && (
          <button className="profile-edit-btn" onClick={() => { setValue(user.fullName); setEditing(true); setError(""); }}>
            تعديل
          </button>
        )}
      </div>
      {editing ? (
        <div className="profile-edit-row">
          <input
            className="profile-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="محمد أحمد"
            autoFocus
          />
          <button className="profile-save-inline" onClick={save} disabled={loading}>
            {loading ? "..." : "حفظ"}
          </button>
          <button className="profile-cancel-inline" onClick={() => setEditing(false)}>إلغاء</button>
        </div>
      ) : (
        <p className="profile-value">{user.fullName}</p>
      )}
      {error && <p className="profile-field-error">{error}</p>}
    </div>
  );
};

// ===== قسم الإيميل =====
const EmailSection = ({ user, onUpdate }) => {
  const [step, setStep]       = useState("view"); // view | enter | otp
  const [email, setEmail]     = useState("");
  const [otp, setOtp]         = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = () => {
    setCooldown(60);
    const t = setInterval(() => setCooldown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  };

  const sendOtp = async () => {
    setError(""); setLoading(true);
    try {
      await userAPI.requestEmail({ email });
      setStep("otp");
      startCooldown();
    } catch (err) {
      setError(err.response?.data?.message || "حدث خطأ");
    } finally { setLoading(false); }
  };

  const verify = async () => {
    setError(""); setLoading(true);
    try {
      const { data } = await userAPI.verifyEmail({ otp });
      onUpdate(data.user);
      setStep("view");
      setEmail(""); setOtp("");
    } catch (err) {
      setError(err.response?.data?.message || "الكود غير صحيح");
    } finally { setLoading(false); }
  };

  // مستخدم إيميل — read only
  if (!user.isPhoneUser) {
    return (
      <div className="profile-section">
        <div className="profile-section-header">
          <span className="profile-section-label">البريد الإلكتروني</span>
        </div>
        <p className="profile-value profile-value--muted">{user.email}</p>
      </div>
    );
  }

  // مستخدم هاتف — يقدر يضيف إيميل
  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <span className="profile-section-label">البريد الإلكتروني</span>
        {step === "view" && !user.email && (
          <button className="profile-edit-btn" onClick={() => { setStep("enter"); setError(""); }}>
            إضافة
          </button>
        )}
      </div>

      {step === "view" && (
        <p className="profile-value profile-value--empty">
          {user.email || "لم يُضف بعد"}
        </p>
      )}

      {step === "enter" && (
        <>
          <div className="profile-edit-row">
            <input
              className="profile-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              style={{ direction: "ltr", textAlign: "right" }}
              autoFocus
            />
            <button className="profile-save-inline" onClick={sendOtp} disabled={loading || !email.includes("@")}>
              {loading ? "..." : "إرسال الكود"}
            </button>
            <button className="profile-cancel-inline" onClick={() => setStep("view")}>إلغاء</button>
          </div>
          {error && <p className="profile-field-error">{error}</p>}
        </>
      )}

      {step === "otp" && (
        <>
          <p className="profile-otp-hint">أرسلنا كود تحقق إلى <strong>{email}</strong></p>
          <div className="profile-edit-row">
            <input
              className="profile-input profile-otp-input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="_ _ _ _ _ _"
              autoFocus
            />
            <button className="profile-save-inline" onClick={verify} disabled={loading || otp.length < 6}>
              {loading ? "..." : "تحقق"}
            </button>
          </div>
          <button
            className="profile-resend-btn"
            onClick={() => { sendOtp(); }}
            disabled={cooldown > 0}
          >
            {cooldown > 0 ? `إعادة الإرسال بعد ${cooldown}ث` : "إعادة الإرسال"}
          </button>
          <button className="profile-cancel-inline" style={{ marginTop: 4 }} onClick={() => setStep("enter")}>
            ← تغيير الإيميل
          </button>
          {error && <p className="profile-field-error">{error}</p>}
        </>
      )}
    </div>
  );
};

// ===== قسم الهاتف =====
const PhoneSection = ({ user, onUpdate }) => {
  const geo = useGeo();
  const [editing, setEditing]   = useState(false);
  const [dialCode, setDialCode] = useState("");
  const [local, setLocal]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const locked = user.phoneDaysLeft > 0;

  const startEdit = () => {
    if (user.phone) {
      // إذا عنده رقم حالي — قسّمه
      const { dialCode: d, local: l } = splitPhone(user.phone);
      setDialCode(d || findDialCode(geo?.country || "SA") || "+966");
      setLocal(l);
    } else {
      // رقم جديد — اختر كود الدولة من الـ geo
      const geoCode = geo !== null ? findDialCode(geo?.country || "SA") : "+966";
      setDialCode(geoCode || "+966");
      setLocal("");
    }
    setEditing(true);
    setError("");
  };

  const save = async () => {
    setError(""); setLoading(true);
    try {
      const phone = local.trim() ? dialCode + local.replace(/^0+/, "") : "";
      const { data } = await userAPI.updatePhone({ phone });
      onUpdate(data.user);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "حدث خطأ");
    } finally { setLoading(false); }
  };

  // مستخدم هاتف — read only
  if (user.isPhoneUser) {
    return (
      <div className="profile-section">
        <div className="profile-section-header">
          <span className="profile-section-label">رقم الهاتف</span>
        </div>
        <p className="profile-value profile-value--muted" style={{ direction: "ltr", textAlign: "right" }}>
          {user.phone}
        </p>
      </div>
    );
  }

  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <span className="profile-section-label">رقم الهاتف</span>
        {locked ? <DaysLock days={user.phoneDaysLeft} /> : !editing && (
          <button className="profile-edit-btn" onClick={startEdit}>
            {user.phone ? "تعديل" : "إضافة"}
          </button>
        )}
      </div>

      {editing ? (
        <>
          <div className="profile-phone-combo">
            <PhoneCountryPicker value={dialCode} onChange={setDialCode} />
            <input
              className="profile-phone-input"
              type="tel"
              value={local}
              onChange={(e) => setLocal(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="591234567"
              style={{ direction: "ltr" }}
              autoFocus
            />
          </div>
          <div className="profile-inline-actions">
            <button className="profile-save-inline" onClick={save} disabled={loading || (!local && !user.phone)}>
              {loading ? "..." : "حفظ"}
            </button>
            <button className="profile-cancel-inline" onClick={() => setEditing(false)}>إلغاء</button>
          </div>
        </>
      ) : (
        <p className={`profile-value${!user.phone ? " profile-value--empty" : ""}`} style={{ direction: "ltr", textAlign: "right" }}>
          {user.phone || "لم يُضف بعد"}
        </p>
      )}
      {error && <p className="profile-field-error">{error}</p>}
    </div>
  );
};

// ===== الصفحة الرئيسية =====
const UserProfile = () => {
  const { user: ctxUser, login } = useUserAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (ctxUser) setUser(ctxUser);
  }, [ctxUser]);

  const handleUpdate = (updatedUser) => {
    setUser(updatedUser);
    login(localStorage.getItem("ruha_user_token"), updatedUser);
  };

  if (!ctxUser) { navigate("/my-account"); return null; }
  if (!user) return null;

  const initials = user.fullName?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-avatar">{initials}</div>
        <h2 className="profile-name">{user.fullName}</h2>
        <p className="profile-subtitle">{user.isPhoneUser ? "حساب برقم الهاتف" : "حساب بالإيميل"}</p>

        <div className="profile-sections">
          <NameSection  user={user} onUpdate={handleUpdate} />
          <EmailSection user={user} onUpdate={handleUpdate} />
          <PhoneSection user={user} onUpdate={handleUpdate} />
        </div>

        <button className="profile-back-btn" onClick={() => navigate(-1)}>← رجوع</button>
      </div>
    </div>
  );
};

export default UserProfile;
