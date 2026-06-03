// src/pages/Careers.jsx

import { useState } from "react";
import PageHero from "../components/PageHero";
import { jobApplicationsAPI } from "../api";
import useGeo from "../hooks/useGeo";
import { ARAB_COUNTRIES, OTHER_OPTION } from "../data/arabCountries";
import "./Careers.css";

const POSITIONS = [
  {
    group: "الإدارة والتشغيل",
    icon: "🏢",
    jobs: ["مدير عمليات", "مسؤول خدمة عملاء", "مسؤول مالي وحسابات", "مساعد إداري"],
  },
  {
    group: "التسويق والمحتوى",
    icon: "📣",
    jobs: ["منشئ محتوى (كتابة)", "مصور فوتوغرافي / فيديوغرافي", "مدير وسائل التواصل الاجتماعي", "مصمم جرافيك"],
  },
  {
    group: "الرحلات والعمل الميداني",
    icon: "🌍",
    jobs: ["مرشد سياحي ميداني", "مرافق رحلات", "منسق تطوع", "منسق مضيفين (هوست)", "مترجم ومرافق لغوي"],
  },
  {
    group: "التقنية",
    icon: "💻",
    jobs: ["مطور ويب", "دعم فني"],
  },
  {
    group: "الشراكات والتوسع",
    icon: "🤝",
    jobs: ["مسؤول شراكات وعلاقات", "باحث وجهات ومضيفين"],
  },
];

const GEO_TO_COUNTRY = {
  PS: "فلسطين", IL: "الداخل الفلسطيني (48)", JO: "الأردن", LB: "لبنان",
  SY: "سوريا", EG: "مصر", IQ: "العراق", SA: "السعودية", AE: "الإمارات",
  KW: "الكويت", QA: "قطر", BH: "البحرين", OM: "عُمان", YE: "اليمن",
  LY: "ليبيا", TN: "تونس", DZ: "الجزائر", MA: "المغرب", MR: "موريتانيا",
  SD: "السودان", SO: "الصومال", DJ: "جيبوتي", KM: "جزر القمر",
};

const WHY_ITEMS = [
  { icon: "✈️", title: "عمل حقيقي بأثر حقيقي", text: "كل دور في رُحى يساهم في تغيير حياة شباب يسافرون لأول مرة خارج بلدهم." },
  { icon: "🌱", title: "بيئة شغل مرنة", text: "نؤمن بالعمل عن بُعد والمرونة في أوقات الدوام — المهم النتيجة." },
  { icon: "🚀", title: "نمو حقيقي سريع", text: "رُحى في مراحل نموها الأولى — فرصتك تكون جزءاً من بناء شيء من الصفر." },
  { icon: "🤝", title: "فريق صغير ومتحمس", text: "ما في بيروقراطية، أفكارك تُسمع وتُطبَّق بسرعة." },
];

const Careers = () => {
  const geo = useGeo();
  const [selectedPosition, setSelectedPosition] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", country: "", customCountry: "", portfolioUrl: "", message: "" });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [submitted, setSubmitted] = useState(false);

  // auto-select country from geo
  useState(() => {
    if (!geo?.country) return;
    const name = GEO_TO_COUNTRY[geo.country];
    if (name) setForm((prev) => ({ ...prev, country: name }));
  }, [geo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!selectedPosition) { setError("يرجى اختيار الوظيفة المطلوبة"); return; }

    const finalCountry = form.country === OTHER_OPTION ? form.customCountry : form.country;
    if (!finalCountry) { setError("يرجى تحديد بلدك"); return; }

    setLoading(true);
    try {
      await jobApplicationsAPI.submit({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        country: finalCountry,
        position: selectedPosition,
        portfolioUrl: form.portfolioUrl,
        message: form.message,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="careers-page">
        <PageHero title="انضم لفريق رُحى" subtitle="معاً نبني تجربة السفر الحقيقي" icon="💼" />
        <div className="container careers-body">
          <div className="careers-success">
            <div className="careers-success-icon">🎉</div>
            <h2>تم إرسال طلبك بنجاح!</h2>
            <p>شكراً لاهتمامك بالانضمام لفريق رُحى. سنراجع طلبك ونتواصل معك قريباً.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="careers-page">
      <PageHero title="انضم لفريق رُحى" subtitle="معاً نبني تجربة السفر الحقيقي" icon="💼" />

      <div className="container careers-body">

        {/* ليش رُحى */}
        <div className="careers-why">
          <h2 className="careers-section-title">ليش تنضم لرُحى؟</h2>
          <div className="careers-why-grid">
            {WHY_ITEMS.map((item, i) => (
              <div key={i} className="careers-why-card">
                <span className="careers-why-icon">{item.icon}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* الوظائف المتاحة */}
        <div className="careers-positions">
          <h2 className="careers-section-title">الوظائف المتاحة</h2>
          <p className="careers-section-sub">اختر الوظيفة التي تناسب مهاراتك من القائمة أدناه</p>
          <div className="careers-groups">
            {POSITIONS.map((group) => (
              <div key={group.group} className="careers-group">
                <div className="careers-group-header">
                  <span>{group.icon}</span>
                  <h3>{group.group}</h3>
                </div>
                <div className="careers-jobs">
                  {group.jobs.map((job) => (
                    <button
                      key={job}
                      type="button"
                      className={`careers-job-btn${selectedPosition === job ? " careers-job-btn--active" : ""}`}
                      onClick={() => setSelectedPosition(selectedPosition === job ? "" : job)}
                    >
                      {job}
                      {selectedPosition === job && <span className="careers-job-check">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {selectedPosition && (
            <div className="careers-selected-badge">
              ✅ الوظيفة المختارة: <strong>{selectedPosition}</strong>
              <button onClick={() => setSelectedPosition("")} className="careers-deselect">✕</button>
            </div>
          )}
        </div>

        {/* الفورم */}
        <div className="careers-form-section">
          <h2 className="careers-section-title">قدّم طلبك</h2>
          <form className="careers-form" onSubmit={handleSubmit}>

            <div className="careers-form-row">
              <div className="form-group">
                <label className="form-label">الاسم الكامل *</label>
                <input name="fullName" className="form-input" value={form.fullName} onChange={handleChange} placeholder="محمد أحمد الخالد" required />
              </div>
              <div className="form-group">
                <label className="form-label">البريد الإلكتروني *</label>
                <input name="email" type="email" className="form-input" value={form.email} onChange={handleChange} placeholder="example@email.com" required style={{ direction: "ltr" }} />
              </div>
            </div>

            <div className="careers-form-row">
              <div className="form-group">
                <label className="form-label">رقم الهاتف (واتساب) *</label>
                <input name="phone" className="form-input" value={form.phone} onChange={handleChange} placeholder="+970 59 000 0000" required style={{ direction: "ltr" }} />
              </div>
              <div className="form-group">
                <label className="form-label">البلد *</label>
                <select name="country" className="form-input" value={form.country} onChange={handleChange} required>
                  <option value="">-- اختر بلدك --</option>
                  {ARAB_COUNTRIES.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                  <option value={OTHER_OPTION}>{OTHER_OPTION}</option>
                </select>
              </div>
            </div>

            {form.country === OTHER_OPTION && (
              <div className="form-group">
                <label className="form-label">اكتب بلدك *</label>
                <input name="customCountry" className="form-input" value={form.customCountry} onChange={handleChange} placeholder="اكتب بلدك" required />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">رابط البورتفوليو / CV (اختياري)</label>
              <input name="portfolioUrl" type="url" className="form-input" value={form.portfolioUrl} onChange={handleChange} placeholder="https://..." style={{ direction: "ltr" }} />
            </div>

            <div className="form-group">
              <label className="form-label">
                عرّف عن نفسك ولماذا تريد الانضمام لرُحى *
                <span className="char-hint"> (حتى 1500 حرف)</span>
              </label>
              <textarea
                name="message"
                className="form-input form-textarea"
                value={form.message}
                onChange={handleChange}
                rows={5}
                maxLength={1500}
                placeholder="اكتب عن خبرتك، مهاراتك، وما الذي يشدّك للعمل مع رُحى..."
                required
              />
              <div className="char-count">{form.message.length} / 1500</div>
            </div>

            {!selectedPosition && (
              <div className="careers-position-warning">⚠️ يرجى اختيار الوظيفة من القائمة أعلاه</div>
            )}

            {error && <div className="error-msg">{error}</div>}

            <button
              type="submit"
              className={`btn btn-primary careers-submit-btn${!selectedPosition ? " btn-disabled" : ""}`}
              disabled={loading || !selectedPosition}
            >
              {loading ? "جاري الإرسال..." : "📩 إرسال الطلب"}
            </button>

            <p className="careers-note">
              سنراجع طلبك ونتواصل معك خلال أسبوع إذا كان هناك تطابق مع احتياجاتنا.
            </p>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Careers;
