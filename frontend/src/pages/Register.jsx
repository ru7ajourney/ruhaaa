// src/pages/Register.jsx
// صفحة التسجيل في رحلة

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { tripsAPI, applicationsAPI } from "../api";
import { useUserAuth } from "../context/UserAuthContext";
import { ARAB_COUNTRIES, OTHER_OPTION } from "../data/arabCountries";
import PoliciesModal from "../components/PoliciesModal";
import AuthModal from "../components/AuthModal";
import PageHero from "../components/PageHero";
import useGeo from "../hooks/useGeo";
import "./Register.css";

const GEO_TO_COUNTRY = {
  PS: "فلسطين",
  IL: "الداخل الفلسطيني (48)",
  JO: "الأردن",
  LB: "لبنان",
  SY: "سوريا",
  EG: "مصر",
  IQ: "العراق",
  SA: "السعودية",
  AE: "الإمارات",
  KW: "الكويت",
  QA: "قطر",
  BH: "البحرين",
  OM: "عُمان",
  YE: "اليمن",
  LY: "ليبيا",
  TN: "تونس",
  DZ: "الجزائر",
  MA: "المغرب",
  MR: "موريتانيا",
  SD: "السودان",
  SO: "الصومال",
  DJ: "جيبوتي",
  KM: "جزر القمر",
};

const NOT_SURE = "غير محدد";

const EMPTY_FORM = {
  fullName: "",
  country: "",
  city: "",
  customCity: "",    // إذا اختار "أخرى" من المدن
  customCountry: "", // إذا اختار خارج الوطن العربي
  phone: "",
  email: "",
  agreeVolunteering: null,
  hasEnglish: null,
  readyForDeposit: null,
  aboutMe: "",
  preferredDate: "",
  instagram: "",
  gender: null,
};

const formatTripDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

const Register = () => {
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get("trip");
  const extrasParam = searchParams.get("extras") || "";
  const navigate = useNavigate();
  const { user: loggedInUser, loading: authLoading } = useUserAuth();

  const geo = useGeo();
  const [trip, setTrip] = useState(null);
  const [trips, setTrips] = useState([]); // قائمة الرحلات للاختيار
  const [form, setForm] = useState({ ...EMPTY_FORM, tripId: tripId || "", email: loggedInUser?.email || "", phone: loggedInUser?.phone || "" });
  const [selectedCountryData, setSelectedCountryData] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [agreedToPolicies, setAgreedToPolicies] = useState(false);
  const [showPolicies, setShowPolicies] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // عند تسجيل الدخول — اmlأ الإيميل والهاتف تلقائياً
  useEffect(() => {
    if (!loggedInUser) return;
    setForm((prev) => ({
      ...prev,
      ...(loggedInUser.email && { email: loggedInUser.email }),
      ...(loggedInUser.phone && { phone: loggedInUser.phone }),
    }));
  }, [loggedInUser]);

  // اختيار البلد تلقائياً بناءً على الـ IP
  useEffect(() => {
    if (!geo?.country || form.country) return;
    const countryName = GEO_TO_COUNTRY[geo.country];
    if (!countryName) return;
    const found = ARAB_COUNTRIES.find((c) => c.name === countryName);
    setForm((prev) => ({ ...prev, country: countryName }));
    setSelectedCountryData(found || null);
  }, [geo]);

  // جلب الرحلات المتاحة
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: allTrips } = await tripsAPI.getAll();
        const safeTrips = Array.isArray(allTrips) ? allTrips : [];
        setTrips(safeTrips);

        // إذا في tripId في الرابط، جلب تفاصيل الرحلة
        if (tripId) {
          const foundTrip = safeTrips.find((t) => t._id === tripId);
          if (foundTrip) {
            setTrip(foundTrip);
            // استرجع الإضافات المحددة من URL
            if (extrasParam && foundTrip.extras?.length) {
              const ids = extrasParam.split(",");
              const preSelected = foundTrip.extras.filter((e) => ids.includes(e._id));
              setSelectedExtras(preSelected);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetchLoading(false);
      }
    };
    fetchData();
  }, [tripId]);

  // عند تغيير البلد — حدّث قائمة المدن
  const handleCountryChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, country: value, city: "", customCity: "", customCountry: "" }));

    if (value === OTHER_OPTION) {
      setSelectedCountryData(null);
    } else {
      const found = ARAB_COUNTRIES.find((c) => c.name === value);
      setSelectedCountryData(found || null);
    }
  };

  // عند تغيير أي حقل عادي
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleExtra = (extra) => {
    setSelectedExtras((prev) =>
      prev.some((e) => e._id === extra._id)
        ? prev.filter((e) => e._id !== extra._id)
        : [...prev, extra]
    );
  };

  const extrasTotal = selectedExtras.reduce((sum, e) => sum + (e.price || 0), 0);

  // أسئلة نعم / لا
  const handleYesNo = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // إرسال الفورم
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!loggedInUser) {
      setError("يجب تسجيل الدخول أولاً للتسجيل في رحلة");
      return;
    }

    // تحقق من الموافقة على السياسات
    if (!agreedToPolicies) {
      setError("يجب الموافقة على سياسات وشروط رُحى للمتابعة");
      return;
    }

    // تحقق من أسئلة نعم/لا
    if (form.gender === null) {
      setError("يرجى تحديد الجنس");
      return;
    }

    if (form.agreeVolunteering === null || form.hasEnglish === null || form.readyForDeposit === null) {
      setError("يرجى الإجابة على جميع أسئلة نعم / لا");
      return;
    }

    setLoading(true);

    try {
      const selectedTripId = form.tripId || tripId;

      // حدد البلد والمدينة النهائية
      const finalCountry =
        form.country === OTHER_OPTION ? form.customCountry : form.country;
      const finalCity =
        form.city === "أخرى" ? form.customCity : form.city;

      await applicationsAPI.submit({
        tripId: selectedTripId,
        fullName: form.fullName,
        country: finalCountry,
        city: finalCity,
        phone: form.phone,
        email: form.email,
        agreeVolunteering: form.agreeVolunteering,
        hasEnglish: form.hasEnglish,
        readyForDeposit: form.readyForDeposit,
        aboutMe: form.aboutMe,
        preferredDate: form.preferredDate || NOT_SURE,
        instagram: form.instagram,
        gender: form.gender,
        selectedExtras: selectedExtras.map((e) => ({
          extraId: e._id,
          title: e.title,
          price: e.price,
        })),
      });

      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "حدث خطأ أثناء إرسال الطلب");
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // صفحة النجاح بعد الإرسال
  // ==============================
  if (submitted) {
    return (
      <div className="register-success">
        <div className="success-card">
          <div className="success-icon">🎉</div>
          <h2>تم إرسال طلبك بنجاح!</h2>
          <p>
            شكراً لاهتمامك برحلاتنا. سيتواصل معك فريق رُحى قريباً على رقم
            هاتفك أو إيميلك لتأكيد التفاصيل.
          </p>
          <Link to="/trips" className="btn btn-primary">
            العودة للرحلات
          </Link>
        </div>
      </div>
    );
  }

  if (fetchLoading || authLoading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="register-page">
      {/* مودال تسجيل الدخول — يظهر إذا الزائر غير مسجّل */}
      {!loggedInUser && <AuthModal />}
      <PageHero title="سجّل في رحلة رُحى" subtitle="أكمل بياناتك وسنتواصل معك في أقرب وقت" icon="📝">
        <Link to={trip ? `/trips/${trip.slug}` : "/trips"} className="back-link-light">
          ← العودة
        </Link>
      </PageHero>

      <div className="container register-body">
        <form onSubmit={handleSubmit} className="register-form">

          {/* ==============================
              اختيار الرحلة
              ============================== */}
          <div className="register-section">
            <h3 className="register-section-title">✈️ الرحلة</h3>

            {trip ? (
              // رحلة محددة مسبقاً
              <div className="selected-trip-card">
                <img
                  src={trip.coverImage || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200"}
                  alt={trip.title}
                />
                <div>
                  <h4>{trip.title}</h4>
                  <p>📍 {trip.destination} &nbsp;|&nbsp; 🗓 {trip.duration} أيام &nbsp;|&nbsp; 💰 {trip.price} {trip.currency}</p>
                </div>
                <Link to="/trips" className="change-trip-btn">تغيير</Link>
              </div>
            ) : (
              // اختيار الرحلة
              <div className="form-group">
                <label className="form-label">اختر الرحلة *</label>
                <select
                  name="tripId"
                  className="form-input"
                  value={form.tripId}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- اختر الرحلة --</option>
                  {trips.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.title} — {t.destination}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* اختيار التاريخ */}
            {(() => {
              const selectedTrip = trip || trips.find((t) => t._id === form.tripId);
              const dates = selectedTrip?.availableDates?.filter(
                (d) => new Date(d.startDate) > new Date()
              ) || [];

              if (!selectedTrip) return null;

              return (
                <div className="form-group" style={{ marginTop: 16 }}>
                  <label className="form-label">التاريخ المفضّل</label>
                  <select
                    name="preferredDate"
                    className="form-input"
                    value={form.preferredDate}
                    onChange={handleChange}
                  >
                    <option value="">-- اختر التاريخ --</option>
                    {dates.map((d, i) => {
                      const label = `${formatTripDate(d.startDate)} - ${formatTripDate(d.endDate)}`;
                      const left = d.spotsTotal - d.spotsTaken;
                      return (
                        <option key={i} value={label}>
                          {label} ({left} مكان متبقي)
                        </option>
                      );
                    })}
                    <option value={NOT_SURE}>مش متأكد — تواصلوا معي</option>
                  </select>
                </div>
              );
            })()}
          </div>

          {/* ==============================
              البيانات الشخصية
              ============================== */}
          <div className="register-section">
            <h3 className="register-section-title">👤 بياناتك الشخصية</h3>

            {/* الاسم */}
            <div className="form-group">
              <label className="form-label">الاسم الكامل *</label>
              <input
                name="fullName"
                className="form-input"
                value={form.fullName}
                onChange={handleChange}
                placeholder="مثال: محمد أحمد الخالد"
                required
              />
            </div>

            {/* البلد */}
            <div className="form-row-register">
              <div className="form-group">
                <label className="form-label">البلد *</label>
                <select
                  name="country"
                  className="form-input"
                  value={form.country}
                  onChange={handleCountryChange}
                  required
                >
                  <option value="">-- اختر بلدك --</option>
                  {ARAB_COUNTRIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  <option value={OTHER_OPTION}>{OTHER_OPTION}</option>
                </select>
              </div>

              {/* المدينة */}
              <div className="form-group">
                <label className="form-label">المدينة *</label>
                {form.country === OTHER_OPTION ? (
                  // خارج الوطن العربي — كتابة يدوية
                  <input
                    name="customCountry"
                    className="form-input"
                    value={form.customCountry}
                    onChange={handleChange}
                    placeholder="اكتب بلدك ومدينتك"
                    required
                  />
                ) : selectedCountryData ? (
                  // دولة عربية — قائمة مدن
                  <>
                    <select
                      name="city"
                      className="form-input"
                      value={form.city}
                      onChange={handleChange}
                      required
                    >
                      <option value="">-- اختر مدينتك --</option>
                      {selectedCountryData.cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                    {/* إذا اختار "أخرى" من المدن */}
                    {form.city === "أخرى" && (
                      <input
                        name="customCity"
                        className="form-input"
                        value={form.customCity}
                        onChange={handleChange}
                        placeholder="اكتب مدينتك"
                        required
                        style={{ marginTop: 8 }}
                      />
                    )}
                  </>
                ) : (
                  <input
                    className="form-input"
                    disabled
                    placeholder="اختر البلد أولاً"
                  />
                )}
              </div>
            </div>

            {/* الهاتف والإيميل */}
            <div className="form-row-register">
              <div className="form-group">
                <label className="form-label">رقم الهاتف (واتساب) *</label>
                <input
                  name="phone"
                  className="form-input"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+970 59 000 0000"
                  required
                  style={{ direction: "ltr", textAlign: "right" }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">البريد الإلكتروني *</label>
                <input
                  name="email"
                  type="email"
                  className="form-input"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  required
                  style={{ direction: "ltr", textAlign: "right" }}
                />
              </div>
            </div>
            {/* الجنس + الانستغرام */}
            <div className="form-row-register">
              <div className="form-group">
                <label className="form-label">الجنس *</label>
                <select
                  name="gender"
                  className="form-input"
                  value={form.gender || ""}
                  onChange={(e) => handleYesNo("gender", e.target.value || null)}
                  required
                >
                  <option value="">-- اختر --</option>
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">حساب الإنستغرام *</label>
                <input
                  name="instagram"
                  className="form-input"
                  value={form.instagram}
                  onChange={handleChange}
                  placeholder="@username"
                  required
                  style={{ direction: "ltr", textAlign: "right" }}
                />
              </div>
            </div>
          </div>

          {/* ==============================
              أسئلة نعم / لا
              ============================== */}
          <div className="register-section">
            <h3 className="register-section-title">❓ أسئلة سريعة</h3>
            <p className="questions-note">أجب بصدق — هذا يساعدنا نرتب التجربة المناسبة لك</p>

            {/* السؤال 1 */}
            <div className="yes-no-question">
              <p className="question-text">
                هل أنت موافق على التطوع والالتزام به حسب قوانين المضيف (الهوست)؟
              </p>
              <div className="yes-no-buttons">
                <button
                  type="button"
                  className={`yn-btn ${form.agreeVolunteering === true ? "yn-yes active" : "yn-yes"}`}
                  onClick={() => handleYesNo("agreeVolunteering", true)}
                >
                  ✅ نعم
                </button>
                <button
                  type="button"
                  className={`yn-btn ${form.agreeVolunteering === false ? "yn-no active" : "yn-no"}`}
                  onClick={() => handleYesNo("agreeVolunteering", false)}
                >
                  ❌ لا
                </button>
              </div>
            </div>

            {/* السؤال 2 */}
            <div className="yes-no-question">
              <p className="question-text">
                هل عندك مستوى إنجليزي متوسط على الأقل للتواصل مع المضيف؟
              </p>
              <div className="yes-no-buttons">
                <button
                  type="button"
                  className={`yn-btn ${form.hasEnglish === true ? "yn-yes active" : "yn-yes"}`}
                  onClick={() => handleYesNo("hasEnglish", true)}
                >
                  ✅ نعم
                </button>
                <button
                  type="button"
                  className={`yn-btn ${form.hasEnglish === false ? "yn-no active" : "yn-no"}`}
                  onClick={() => handleYesNo("hasEnglish", false)}
                >
                  ❌ لا
                </button>
              </div>
            </div>

            {/* السؤال 3 */}
            <div className="yes-no-question">
              <p className="question-text">
                في أغلب الأحيان يُطلب دفع عربون لتأكيد مكانك — هل أنت مستعد لذلك؟
              </p>
              <div className="yes-no-buttons">
                <button
                  type="button"
                  className={`yn-btn ${form.readyForDeposit === true ? "yn-yes active" : "yn-yes"}`}
                  onClick={() => handleYesNo("readyForDeposit", true)}
                >
                  ✅ نعم
                </button>
                <button
                  type="button"
                  className={`yn-btn ${form.readyForDeposit === false ? "yn-no active" : "yn-no"}`}
                  onClick={() => handleYesNo("readyForDeposit", false)}
                >
                  ❌ لا
                </button>
              </div>
            </div>
          </div>

          {/* ==============================
              التعريف بالنفس
              ============================== */}
          <div className="register-section">
            <h3 className="register-section-title">💬 عرّف عن نفسك</h3>
            <div className="form-group">
              <label className="form-label">
                عرّفنا بنفسك وأخبرنا ما الذي يشدّك لهذه التجربة ✨ *
                <span className="char-hint"> (حتى 1000 حرف)</span>
              </label>
              <textarea
                name="aboutMe"
                className="form-input form-textarea"
                value={form.aboutMe}
                onChange={handleChange}
                rows={5}
                maxLength={1000}
                placeholder="مثال: أنا طالب جامعي عمري 22 سنة، أهتم بالثقافة والسفر. سمعت عن رُحى من صديق وأحببت فكرة التطوع في الخارج لأنه..."
                required
              />
              <div className="char-count">{form.aboutMe.length} / 1000</div>
            </div>
          </div>

          {/* ==============================
              الفعاليات الإضافية
              ============================== */}
          {(() => {
            const currentTrip = trip || trips.find((t) => t._id === form.tripId);
            if (!currentTrip?.extras?.length) return null;
            return (
              <div className="register-section">
                <h3 className="register-section-title">✨ فعاليات إضافية اختيارية</h3>
                <p className="questions-note">اختر الفعاليات التي تريد إضافتها — ستُضاف تكلفتها للمبلغ الإجمالي</p>
                <div className="extras-register-list">
                  {currentTrip.extras.map((extra) => {
                    const isSelected = selectedExtras.some((e) => e._id === extra._id);
                    return (
                      <label key={extra._id} className={`extras-register-item${isSelected ? " extras-register-item--on" : ""}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleExtra(extra)}
                          className="extras-register-check"
                        />
                        <div className="extras-register-info">
                          <span className="extras-register-name">{extra.title}</span>
                          {extra.description && <span className="extras-register-desc">{extra.description}</span>}
                          {extra.scheduleDay != null && <span className="extras-register-day">📅 يوم {extra.scheduleDay}</span>}
                        </div>
                        <span className="extras-register-price">+{extra.price} {currentTrip.currency}</span>
                      </label>
                    );
                  })}
                </div>
                {extrasTotal > 0 && (
                  <div className="extras-register-total">
                    <span>السعر الإجمالي</span>
                    <strong>{currentTrip.price + extrasTotal} {currentTrip.currency}</strong>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ==============================
              الموافقة على السياسات
              ============================== */}
          <div className="policies-agree-section">
            <label className="policies-checkbox-label">
              <input
                type="checkbox"
                checked={agreedToPolicies}
                onChange={(e) => setAgreedToPolicies(e.target.checked)}
                className="policies-checkbox"
              />
              <span>
                قرأت وأوافق على{" "}
                <button
                  type="button"
                  className="policies-link"
                  onClick={() => setShowPolicies(true)}
                >
                  سياسات وشروط رُحى
                </button>
              </span>
            </label>
            {!agreedToPolicies && (
              <p className="policies-warning">
                ⚠️ يجب الموافقة على الشروط قبل إرسال الطلب
              </p>
            )}
          </div>

          {/* خطأ */}
          {error && <div className="error-msg">{error}</div>}

          {/* زر الإرسال */}
          <button
            type="submit"
            className={`btn btn-primary register-submit-btn ${!agreedToPolicies ? "btn-disabled" : ""}`}
            disabled={loading || !agreedToPolicies}
          >
            {loading ? "جاري الإرسال..." : "📩 إرسال الطلب"}
          </button>

          {/* مودال السياسات */}
          {showPolicies && (
            <PoliciesModal onClose={() => setShowPolicies(false)} />
          )}

          <p className="register-note">
            بإرسال هذا الطلب أنت لا تدفع أي شيء الآن — سيتواصل معك فريق رُحى لتأكيد تفاصيل الرحلة.
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
