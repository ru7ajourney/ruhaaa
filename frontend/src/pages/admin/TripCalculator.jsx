import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { tripsAPI } from "../../api";
import AdminLayout from "../../components/admin/AdminLayout";
import "./TripCalculator.css";

const uid = () => Math.random().toString(36).slice(2);
const emptyItem = () => ({ id: uid(), label: "", amount: "" });
const fmt = (n) =>
  Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CURRENCIES = [
  { code: "USD", label: "دولار أمريكي — USD" },
  { code: "EUR", label: "يورو — EUR" },
  { code: "ILS", label: "شيكل — ILS" },
];

// ────────────────────────────────────────────
// Cost section component
// ────────────────────────────────────────────
const SECTIONS = [
  {
    key: "fixed",
    title: "تكاليف ثابتة",
    icon: "📌",
    desc: "مبلغ واحد بغض النظر عن الأشخاص أو الأيام",
    unit: "",
    ph: "مثال: إيجار حافلة، تصاريح دخول...",
  },
  {
    key: "perDay",
    title: "تكاليف يومية",
    icon: "📅",
    desc: "× عدد الأيام",
    unit: "/ يوم",
    ph: "مثال: مرشد سياحي، وقود يومي...",
  },
];

const CostSection = ({ section, items, currency, onChange, onAdd, onRemove }) => (
  <div className="calc-section">
    <div className="calc-section-header">
      <div className="calc-section-title">
        <span className="calc-section-icon">{section.icon}</span>
        <div>
          <h3>{section.title}</h3>
          <p className="calc-section-desc">{section.desc}</p>
        </div>
      </div>
      <button className="calc-add-btn" onClick={onAdd}>+ بند</button>
    </div>

    {items.length === 0 && (
      <p className="calc-empty">لا يوجد بنود — اضغط "+ بند"</p>
    )}

    <div className="calc-items">
      {items.map((item) => (
        <div key={item.id} className="calc-item">
          <input
            className="calc-item-label"
            placeholder={section.ph}
            value={item.label}
            onChange={(e) => onChange(item.id, "label", e.target.value)}
          />
          <div className="calc-item-amount-wrap">
            <input
              className="calc-item-amount"
              type="number"
              min="0"
              placeholder="0"
              value={item.amount}
              onChange={(e) => onChange(item.id, "amount", e.target.value)}
            />
            <span className="calc-item-unit">{currency} {section.unit}</span>
          </div>
          <button className="calc-remove-btn" onClick={() => onRemove(item.id)}>✕</button>
        </div>
      ))}
    </div>
  </div>
);

// ────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────
const TripCalculator = () => {
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [days, setDays] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [minParticipants, setMinParticipants] = useState(10);
  const [maxParticipants, setMaxParticipants] = useState(20);
  const [margin, setMargin] = useState(20);
  const [costs, setCosts] = useState({
    fixed: [],
    perDay: [],
  });

  useEffect(() => {
    tripsAPI.getAdminAll().then(({ data }) => setTrips(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const tripDays = days !== "" ? Number(days) : (selectedTrip?.duration || 0);

  const handleSelectTrip = (e) => {
    const trip = trips.find((t) => t._id === e.target.value) || null;
    setSelectedTrip(trip);
    setDays("");
  };

  const handleChange = useCallback((section, id, field, value) => {
    setCosts((prev) => ({
      ...prev,
      [section]: prev[section].map((i) => (i.id === id ? { ...i, [field]: value } : i)),
    }));
  }, []);

  const handleAdd = useCallback((section) => {
    setCosts((prev) => ({ ...prev, [section]: [...prev[section], emptyItem()] }));
  }, []);

  const handleRemove = useCallback((section, id) => {
    setCosts((prev) => ({ ...prev, [section]: prev[section].filter((i) => i.id !== id) }));
  }, []);

  // ── Core calculations ──
  const calc = useMemo(() => {
    const sum = (arr) => arr.reduce((a, i) => a + (Number(i.amount) || 0), 0);
    const d = tripDays;
    const minP = Number(minParticipants) || 1;
    const maxP = Number(maxParticipants) || minP;

    // تكاليف ثابتة بحتة (لا تتغير مع الأشخاص)
    const fixedOnly = sum(costs.fixed) + sum(costs.perDay) * d;

    // التكلفة الإجمالية عند الحد الأدنى
    const totalAtMin = fixedOnly;
    const costPerPersonAtMin = minP > 0 ? totalAtMin / minP : 0;

    // السعر المحدد (ثابت للجميع) بناءً على الحد الأدنى
    const sellingPrice = costPerPersonAtMin * (1 + margin / 100);

    // نقطة التعادل الحقيقية (بدون margin)
    // Revenue = sellingPrice × n
    // Cost    = fixedOnly + varPerPerson × n
    // BEP: sellingPrice × n = fixedOnly + varPerPerson × n
    // n = fixedOnly / (sellingPrice - varPerPerson)
    const bep = sellingPrice > 0
      ? Math.ceil(fixedOnly / sellingPrice)
      : null;

    // جدول السيناريوهات
    const step = Math.max(1, Math.floor((maxP - minP) / 5));
    const scenarioPoints = [];
    for (let n = minP; n <= maxP; n += step) scenarioPoints.push(n);
    if (scenarioPoints[scenarioPoints.length - 1] !== maxP) scenarioPoints.push(maxP);

    const scenarios = scenarioPoints.map((n) => {
      const revenue = sellingPrice * n;
      const cost = fixedOnly;
      const profit = revenue - cost;
      const roi = cost > 0 ? (profit / cost) * 100 : 0;
      return { n, revenue, cost, profit, roi };
    });

    return {
      fixedOnly,
      totalAtMin,
      costPerPersonAtMin,
      sellingPrice,
      bep,
      scenarios,
      minP,
      maxP,
      d,
    };
  }, [costs, tripDays, minParticipants, maxParticipants, margin]);

  const currentPrice = selectedTrip?.price || 0;

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1 className="admin-page-title">🧮 حاسبة التكاليف</h1>
      </div>
      <div className="calc-main">
        <div className="calc-container">
          <div className="calc-page-title">
            <p>حدد الحد الأدنى للتشغيل وسيُحسب السعر الأنسب لكل شخص</p>
          </div>

          {/* ── إعدادات ── */}
          <div className="calc-settings">
            <div className="calc-settings-row">
              <div className="calc-field">
                <label>اختر رحلة (اختياري)</label>
                <select value={selectedTrip?._id || ""} onChange={handleSelectTrip}>
                  <option value="">— حساب يدوي —</option>
                  {trips.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.title} {t.isActive === false ? "🔒" : "✅"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="calc-field calc-field--sm">
                <label>عدد الأيام</label>
                <input
                  type="number"
                  min="1"
                  value={days !== "" ? days : (selectedTrip?.duration || "")}
                  placeholder={selectedTrip?.duration ? String(selectedTrip.duration) : "أدخل"}
                  onChange={(e) => setDays(e.target.value)}
                />
              </div>

              <div className="calc-field calc-field--sm">
                <label>العملة</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="calc-settings-row">
              <div className="calc-field calc-field--sm">
                <label>الحد الأدنى للتشغيل 👥</label>
                <input
                  type="number"
                  min="1"
                  value={minParticipants}
                  onChange={(e) => setMinParticipants(e.target.value)}
                />
                <span className="calc-field-hint">أقل عدد تشغّل عليه الرحلة</span>
              </div>

              <div className="calc-field calc-field--sm">
                <label>الحد الأقصى للمشاركين</label>
                <input
                  type="number"
                  min="1"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                />
                <span className="calc-field-hint">للسيناريوهات فقط</span>
              </div>

              <div className="calc-field calc-field--sm">
                <label>هامش الربح %</label>
                <div className="calc-margin-wrap">
                  <input
                    type="number"
                    min="0"
                    value={margin}
                    onChange={(e) => setMargin(e.target.value)}
                  />
                  <span>%</span>
                </div>
              </div>
            </div>

            {selectedTrip && (
              <div className="calc-trip-info">
                <span>📍 {selectedTrip.destination}</span>
                <span>🗓 {calc.d} أيام</span>
                <span>💰 السعر الحالي: <strong>{fmt(currentPrice)} {currency}</strong></span>
              </div>
            )}
          </div>

          {/* ── بنود التكاليف ── */}
          <div className="calc-sections">
            {SECTIONS.map((s) => (
              <CostSection
                key={s.key}
                section={s}
                items={costs[s.key]}
                currency={currency}
                onChange={(id, f, v) => handleChange(s.key, id, f, v)}
                onAdd={() => handleAdd(s.key)}
                onRemove={(id) => handleRemove(s.key, id)}
              />
            ))}
          </div>

          {/* ── النتائج الرئيسية ── */}
          <div className="calc-results">
            <h3 className="calc-results-title">📊 النتائج</h3>

            <div className="calc-results-grid">
              <div className="calc-result-card calc-result-neutral">
                <div className="calc-result-label">التكاليف الثابتة (بغض النظر عن الأشخاص)</div>
                <div className="calc-result-value">{fmt(calc.fixedOnly)} {currency}</div>
              </div>

              <div className="calc-result-card calc-result-neutral">
                <div className="calc-result-label">التكلفة الإجمالية عند {calc.minP} أشخاص</div>
                <div className="calc-result-value">{fmt(calc.totalAtMin)} {currency}</div>
              </div>

              <div className="calc-result-card calc-result-neutral">
                <div className="calc-result-label">التكلفة الفعلية / شخص عند الحد الأدنى</div>
                <div className="calc-result-value">{fmt(calc.costPerPersonAtMin)} {currency}</div>
              </div>

              <div className="calc-result-card calc-result-price">
                <div className="calc-result-label">💡 السعر المقترح / شخص</div>
                <div className="calc-result-value">{fmt(calc.sellingPrice)} {currency}</div>
                <div className="calc-result-sub">محسوب من الحد الأدنى + {margin}% ربح</div>
              </div>

              <div className={`calc-result-card ${calc.bep ? "calc-result-bep" : "calc-result-warn"}`}>
                <div className="calc-result-label">نقطة التعادل الفعلية</div>
                <div className="calc-result-value">
                  {calc.bep ? `${calc.bep} شخص` : "غير محسوبة"}
                </div>
                <div className="calc-result-sub">
                  {calc.bep ? `من ${calc.bep} شخص فأكثر = ربح صافي` : "أدخل البيانات أولاً"}
                </div>
              </div>
            </div>

            {currentPrice > 0 && (
              <div className={`calc-price-compare ${currentPrice >= calc.sellingPrice ? "calc-price-ok" : "calc-price-low"}`}>
                {currentPrice >= calc.sellingPrice
                  ? `✅ السعر الحالي (${fmt(currentPrice)} ${currency}) أعلى من المقترح بفرق ${fmt(currentPrice - calc.sellingPrice)} ${currency}`
                  : `⚠️ السعر الحالي (${fmt(currentPrice)} ${currency}) أقل من المقترح بـ ${fmt(calc.sellingPrice - currentPrice)} ${currency} — قد تخسر عند الحد الأدنى`}
              </div>
            )}
          </div>

          {/* ── جدول السيناريوهات ── */}
          {calc.scenarios.length > 0 && (
            <div className="calc-scenarios">
              <h3 className="calc-scenarios-title">📈 سيناريوهات الربح والخسارة</h3>
              <p className="calc-scenarios-sub">
                السعر ثابت عند <strong>{fmt(calc.sellingPrice)} {currency} / شخص</strong> — يتغير الربح فقط مع عدد المشاركين
              </p>

              <div className="calc-table-wrap">
                <table className="calc-table">
                  <thead>
                    <tr>
                      <th>عدد المشاركين</th>
                      <th>الإيراد الكلي</th>
                      <th>التكلفة الكلية</th>
                      <th>الربح الصافي</th>
                      <th>نسبة العائد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calc.scenarios.map((s) => (
                      <tr
                        key={s.n}
                        className={
                          s.n === calc.minP
                            ? "calc-row-min"
                            : s.n === calc.maxP
                            ? "calc-row-max"
                            : ""
                        }
                      >
                        <td>
                          {s.n}
                          {s.n === calc.minP && <span className="calc-tag calc-tag-min">الحد الأدنى</span>}
                          {s.n === calc.maxP && <span className="calc-tag calc-tag-max">الحد الأقصى</span>}
                          {calc.bep && s.n === calc.bep && <span className="calc-tag calc-tag-bep">نقطة التعادل</span>}
                        </td>
                        <td>{fmt(s.revenue)} {currency}</td>
                        <td>{fmt(s.cost)} {currency}</td>
                        <td className={s.profit >= 0 ? "calc-profit-pos" : "calc-profit-neg"}>
                          {s.profit >= 0 ? "+" : ""}{fmt(s.profit)} {currency}
                        </td>
                        <td className={s.roi >= 0 ? "calc-profit-pos" : "calc-profit-neg"}>
                          {s.roi.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="calc-actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setCosts({ fixed: [], perDay: [] });
                setMargin(20);
                setDays("");
                setMinParticipants(10);
                setMaxParticipants(20);
              }}
            >
              🗑 مسح الكل
            </button>
            {selectedTrip && (
              <Link to={`/admin/trips/edit/${selectedTrip._id}`} className="btn btn-primary">
                ✏️ تعديل سعر الرحلة
              </Link>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TripCalculator;
