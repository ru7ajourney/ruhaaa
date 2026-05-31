import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../api";
import { useUserAuth } from "../context/UserAuthContext";
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
  if (country) return { dialCode: country.dialCode, local: fullPhone.slice(country.dialCode.length) };
  return { dialCode: "", local: fullPhone };
};

const UserProfile = () => {
  const { user, login } = useUserAuth();
  const navigate = useNavigate();

  const [fullName, setFullName]       = useState("");
  const [dialCode, setDialCode]       = useState("");
  const [localPhone, setLocalPhone]   = useState("");
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState(false);
  const [error, setError]             = useState("");

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName || "");
    const { dialCode: d, local: l } = splitPhone(user.phone);
    setDialCode(d || findDialCode("SA"));
    setLocalPhone(l);
  }, [user]);

  if (!user) {
    navigate("/my-account");
    return null;
  }

  const isPhoneUser = !user.email;

  const handleSave = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(false); setLoading(true);
    try {
      const phone = localPhone.trim()
        ? dialCode + localPhone.replace(/^0+/, "")
        : "";
      const { data } = await userAPI.updateProfile({ fullName, phone });
      login(localStorage.getItem("ruha_user_token"), data.user);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "حدث خطأ، حاول مجدداً");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-avatar">
          {user.fullName?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <h2 className="profile-name">{user.fullName}</h2>
        <p className="profile-subtitle">
          {isPhoneUser ? "حساب برقم الهاتف" : "حساب بالإيميل"}
        </p>

        <form onSubmit={handleSave} className="profile-form">
          <div className="profile-field">
            <label>الاسم الكامل</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="محمد أحمد"
              required
            />
          </div>

          {!isPhoneUser && (
            <div className="profile-field">
              <label>البريد الإلكتروني</label>
              <input type="email" value={user.email} disabled />
            </div>
          )}

          <div className="profile-field">
            <label>
              رقم الهاتف
              {!isPhoneUser && <span className="profile-optional"> (اختياري)</span>}
            </label>
            <div className="profile-phone-combo">
              <PhoneCountryPicker value={dialCode} onChange={setDialCode} />
              <input
                className="profile-phone-input"
                type="tel"
                value={localPhone}
                onChange={(e) => setLocalPhone(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="591234567"
                style={{ direction: "ltr" }}
                required={isPhoneUser}
                disabled={isPhoneUser}
              />
            </div>
            {isPhoneUser && (
              <p className="profile-note">رقم الهاتف لا يمكن تغييره من هنا</p>
            )}
          </div>

          {error   && <p className="profile-error">{error}</p>}
          {success && <p className="profile-success">تم حفظ التغييرات</p>}

          <button type="submit" className="profile-save-btn" disabled={loading}>
            {loading ? "..." : "حفظ التغييرات"}
          </button>
        </form>

        <button className="profile-back-btn" onClick={() => navigate(-1)}>
          ← رجوع
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
