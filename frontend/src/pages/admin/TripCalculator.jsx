import { useState, useMemo } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import "./TripCalculator.css";

const uid = () => Math.random().toString(36).slice(2);
const emptyItem = (ph = "") => ({ id: uid(), label: "", amount: "" });
const fmt = (n) =>
  Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CURRENCIES = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "ILS", symbol: "₪" },
  { code: "SAR", symbol: "ر.س" },
  { code: "JOD", symbol: "د.أ" },
];

// ── Reusable dynamic line-items list ──────────────────────
const LineItems = ({ items, placeholder, unit, sym, onChange, onAdd, onRemove }) => (
  <div className="calc-items-list">
    {items.length === 0 && (
      <p className="calc-items-empty">لا يوجد بنود — اضغط "إضافة"</p>
    )}
    {items.map((item) => (
      <div key={item.id} className="calc-line-item">
        <input
          className="calc-line-label"
          placeholder={placeholder}
          value={item.label}
          onChange={(e) => onChange(item.id, "label", e.target.value)}
        />
        <div className="calc-line-amt-wrap">
          <span className="calc-line-sym">{sym}</span>
          <input
            className="calc-line-amt"
            type="number"
            min="0"
            placeholder="0"
            value={item.amount}
            onChange={(e) => onChange(item.id, "amount", e.target.value)}
          />
          {unit && <span className="calc-line-unit">{unit}</span>}
        </div>
        <button className="calc-line-remove" onClick={() => onRemove(item.id)} aria-label="حذف">✕</button>
      </div>
    ))}
    <button className="calc-add-row" onClick={onAdd}>+ إضافة</button>
  </div>
);

// ── Main Component ─────────────────────────────────────────
const TripCalculator = () => {
  // ── Core inputs ──
  const [days, setDays]               = useState("");
  const [participants, setParticipants] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [currency, setCurrency]       = useState("USD");

  // ── Guide / Leader ──
  const [guideFlight, setGuideFlight]       = useState("");
  const [guideAllowance, setGuideAllowance] = useState("");

  // ── Transportation ──
  const [transFixed, setTransFixed]       = useState([]);
  const [transVariable, setTransVariable] = useState([]);

  // ── Per-participant daily costs ──
  const [perPersonItems, setPerPersonItems] = useState([]);

  // ── Profit & Tax (Israeli framework) ──
  const [desiredProfit, setDesiredProfit] = useState("20");
  const [profitTaxRate, setProfitTaxRate] = useState("23");   // مس הכנסה / ضريبة أرباح
  const [vatRate, setVatRate]             = useState("18");   // מע"מ

  // ── Helpers ──
  const addItem    = (setter)           => setter((p) => [...p, emptyItem()]);
  const removeItem = (setter, id)       => setter((p) => p.filter((i) => i.id !== id));
  const changeItem = (setter, id, f, v) =>
    setter((p) => p.map((i) => (i.id === id ? { ...i, [f]: v } : i)));
  const sumItems   = (arr) => arr.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

  const sym = CURRENCIES.find((c) => c.code === currency)?.symbol || currency;

  // ── Live calculations ──
  const calc = useMemo(() => {
    const d      = parseFloat(days) || 0;
    const n      = parseFloat(participants) || 0;
    const target = parseFloat(targetPrice) || 0;

    // Guide
    const guideFixed = (parseFloat(guideFlight) || 0) + (parseFloat(guideAllowance) || 0) * d;

    // Transportation
    const transFixedTotal = sumItems(transFixed);
    const transVarTotal   = sumItems(transVariable) * d;  // per-day × days

    // Fixed total
    const totalFixed = guideFixed + transFixedTotal;

    // Per-person
    const perPersonDailyTotal = sumItems(perPersonItems);
    const perPersonTripTotal  = perPersonDailyTotal * d;       // per person, full trip

    // Variable total
    const totalVariable = perPersonTripTotal * n + transVarTotal;

    // Grand totals
    const totalCost            = totalFixed + totalVariable;
    const actualCostPerPerson  = n > 0 ? totalCost / n : 0;

    // Break-even
    // n × target = totalFixed + transVarTotal + perPersonTripTotal × n
    // n × (target − perPersonTripTotal) = totalFixed + transVarTotal
    const marginPerPerson = target - perPersonTripTotal;
    let bep = null;
    if (target > 0 && marginPerPerson > 0 && (totalFixed + transVarTotal) > 0) {
      bep = Math.ceil((totalFixed + transVarTotal) / marginPerPerson);
    }

    // Feasibility
    let feasibility = "none";
    if (target > 0 && n > 0 && totalCost > 0) {
      const ratio = actualCostPerPerson / target;
      if (ratio > 1)        feasibility = "red";
      else if (ratio > 0.9) feasibility = "yellow";
      else                  feasibility = "green";
    }

    return {
      d, n, target,
      guideFixed, transFixedTotal, transVarTotal,
      totalFixed, perPersonDailyTotal, perPersonTripTotal,
      totalVariable, totalCost, actualCostPerPerson,
      bep, feasibility, marginPerPerson,
    };
  }, [days, participants, targetPrice, guideFlight, guideAllowance, transFixed, transVariable, perPersonItems]);

  // ── Israeli Tax & Profit Calculation ──────────────────────
  // صافي الربح المستهدف = desiredProfit% × التكلفة
  // الهامش الإجمالي = صافي الربح / (1 − ضريبة الأرباح%)
  // السعر قبل الضريبة = التكلفة + الهامش الإجمالي
  // السعر النهائي = السعر قبل الضريبة × (1 + القيمة المضافة%)
  const taxCalc = useMemo(() => {
    const C  = calc.actualCostPerPerson;
    const dp = parseFloat(desiredProfit)  / 100 || 0;
    const t  = parseFloat(profitTaxRate)  / 100 || 0;
    const v  = parseFloat(vatRate)        / 100 || 0;

    if (C <= 0) return null;
    if (t >= 1) return null;

    const netProfit        = dp * C;
    const grossProfit      = dp > 0 ? netProfit / (1 - t) : 0;
    const profitTaxAmount  = grossProfit * t;
    const priceExVat       = C + grossProfit;
    const vatAmount        = priceExVat * v;
    const finalPrice       = priceExVat + vatAmount;
    const grossMarkupPct   = C > 0 ? (grossProfit / C) * 100 : 0;
    const totalMarkupPct   = C > 0 ? ((finalPrice - C) / C) * 100 : 0;

    return {
      C, grossProfit, profitTaxAmount, netProfit,
      priceExVat, vatAmount, finalPrice,
      grossMarkupPct, totalMarkupPct,
    };
  }, [calc.actualCostPerPerson, desiredProfit, profitTaxRate, vatRate]);

  // شرائح ضريبة الأرباح الإسرائيلية 2024
  const IL_BRACKETS = [
    { rate: "10", hint: "حتى 81,480 ₪/سنة"           },
    { rate: "14", hint: "81K–117K ₪"                  },
    { rate: "20", hint: "117K–188K ₪"                 },
    { rate: "23", hint: "شركة (מס חברות) — ثابت 23%"  },
    { rate: "31", hint: "188K–261K ₪"                 },
    { rate: "35", hint: "261K–542K ₪"                 },
    { rate: "47", hint: "542K–698K ₪"                 },
    { rate: "50", hint: "فوق 698K ₪"                  },
  ];

  const FEAS_MAP = {
    none:   { label: "أدخل البيانات للتحليل", icon: "—",  color: "#6b7280", bg: "#f3f4f6", border: "#d1d5db" },
    green:  { label: "جيّد — في حدود الميزانية", icon: "✓", color: "#16a34a", bg: "#f0fdf4", border: "#86efac" },
    yellow: { label: "تحذير — قريب من الحد الأقصى", icon: "⚠", color: "#d97706", bg: "#fffbeb", border: "#fcd34d" },
    red:    { label: "غير مجدي — يتجاوز الميزانية",   icon: "✗", color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" },
  };
  const feas = FEAS_MAP[calc.feasibility];

  const hasData = calc.totalCost > 0 || calc.totalFixed > 0;

  const reset = () => {
    setDays(""); setParticipants(""); setTargetPrice(""); setCurrency("USD");
    setGuideFlight(""); setGuideAllowance("");
    setTransFixed([]); setTransVariable([]); setPerPersonItems([]);
    setDesiredProfit("20"); setProfitTaxRate("23"); setVatRate("18");
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">🧮 حاسبة الجدوى والتكاليف</h1>
        </div>
      </div>

      {/* ── Settings ── */}
      <div className="calc-settings-card">
        <div className="calc-settings-grid">
          <div className="calc-field">
            <label className="calc-label">
              مدة الرحلة
              <span className="calc-label-hint">أيام</span>
            </label>
            <input
              className="calc-input"
              type="number" min="1" placeholder="7"
              value={days} onChange={(e) => setDays(e.target.value)}
            />
          </div>

          <div className="calc-field">
            <label className="calc-label">
              عدد المشاركين المتوقع
              <span className="calc-label-hint">شخص</span>
            </label>
            <input
              className="calc-input"
              type="number" min="1" placeholder="15"
              value={participants} onChange={(e) => setParticipants(e.target.value)}
            />
          </div>

          <div className="calc-field">
            <label className="calc-label">
              الحد الأقصى للسعر / شخص
              <span className="calc-label-hint">السقف السعري</span>
            </label>
            <div className="calc-input-sym-wrap">
              <span className="calc-sym-prefix">{sym}</span>
              <input
                className="calc-input calc-input--sym"
                type="number" min="0" placeholder="1200"
                value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="calc-field calc-field--sm">
            <label className="calc-label">العملة</label>
            <select className="calc-input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Cost Cards ── */}
      <div className="calc-cost-grid">

        {/* Guide / Leader */}
        <div className="calc-cost-card">
          <div className="calc-cost-card-header">
            <span className="calc-cost-icon">🧑‍✈️</span>
            <div className="calc-cost-info">
              <h3>مصاريف المرشد / القائد</h3>
              <p>تُحتسب ضمن التكاليف الثابتة</p>
            </div>
            <div className="calc-cost-subtotal">
              <span className="calc-cost-subtotal-label">الإجمالي</span>
              <span className="calc-cost-subtotal-value">{sym}{fmt(calc.guideFixed)}</span>
            </div>
          </div>

          <div className="calc-guide-rows">
            <div className="calc-guide-row">
              <label className="calc-guide-label">🎫 تذكرة الطيران (ثابتة)</label>
              <div className="calc-input-sym-wrap">
                <span className="calc-sym-prefix">{sym}</span>
                <input
                  className="calc-input calc-input--sym"
                  type="number" min="0" placeholder="0"
                  value={guideFlight}
                  onChange={(e) => setGuideFlight(e.target.value)}
                />
              </div>
            </div>
            <div className="calc-guide-row">
              <label className="calc-guide-label">
                💵 البدل اليومي
                <span className="calc-guide-mult">
                  × {calc.d > 0 ? calc.d : "—"} أيام = {sym}{fmt((parseFloat(guideAllowance) || 0) * calc.d)}
                </span>
              </label>
              <div className="calc-input-sym-wrap">
                <span className="calc-sym-prefix">{sym}</span>
                <input
                  className="calc-input calc-input--sym"
                  type="number" min="0" placeholder="0"
                  value={guideAllowance}
                  onChange={(e) => setGuideAllowance(e.target.value)}
                />
                <span className="calc-input-unit">/ يوم</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transportation */}
        <div className="calc-cost-card">
          <div className="calc-cost-card-header">
            <span className="calc-cost-icon">🚌</span>
            <div className="calc-cost-info">
              <h3>تكاليف المواصلات</h3>
              <p>ثابتة + متغيرة × الأيام</p>
            </div>
            <div className="calc-cost-subtotal">
              <span className="calc-cost-subtotal-label">الإجمالي</span>
              <span className="calc-cost-subtotal-value">{sym}{fmt(calc.transFixedTotal + calc.transVarTotal)}</span>
            </div>
          </div>

          <div className="calc-sub-section">
            <div className="calc-sub-label">📌 ثابتة (إيجار حافلة، إلخ)</div>
            <LineItems
              items={transFixed} sym={sym} unit="" placeholder="مثال: إيجار حافلة"
              onChange={(id, f, v) => changeItem(setTransFixed, id, f, v)}
              onAdd={() => addItem(setTransFixed)}
              onRemove={(id) => removeItem(setTransFixed, id)}
            />
          </div>

          <div className="calc-sub-section">
            <div className="calc-sub-label">
              ⛽ متغيرة / يوم
              {calc.d > 0 && calc.transVarTotal > 0 && (
                <span className="calc-sub-computed"> × {calc.d} = {sym}{fmt(calc.transVarTotal)}</span>
              )}
            </div>
            <LineItems
              items={transVariable} sym={sym} unit="/يوم" placeholder="مثال: وقود يومي"
              onChange={(id, f, v) => changeItem(setTransVariable, id, f, v)}
              onAdd={() => addItem(setTransVariable)}
              onRemove={(id) => removeItem(setTransVariable, id)}
            />
          </div>
        </div>

        {/* Per-Participant */}
        <div className="calc-cost-card">
          <div className="calc-cost-card-header">
            <span className="calc-cost-icon">🏨</span>
            <div className="calc-cost-info">
              <h3>مصاريف متغيرة / شخص</h3>
              <p>× عدد الأيام × عدد المشاركين</p>
            </div>
            <div className="calc-cost-subtotal">
              <span className="calc-cost-subtotal-label">/شخص/يوم</span>
              <span className="calc-cost-subtotal-value">{sym}{fmt(calc.perPersonDailyTotal)}</span>
            </div>
          </div>

          <div className="calc-sub-section" style={{ borderTop: "none", paddingTop: "14px" }}>
            <LineItems
              items={perPersonItems} sym={sym} unit="/شخص/يوم"
              placeholder="مثال: إقامة، طعام، أنشطة..."
              onChange={(id, f, v) => changeItem(setPerPersonItems, id, f, v)}
              onAdd={() => addItem(setPerPersonItems)}
              onRemove={(id) => removeItem(setPerPersonItems, id)}
            />
          </div>

          {calc.perPersonDailyTotal > 0 && (
            <div className="calc-person-hint">
              {calc.d > 0 && (
                <div>كلفة الفرد للرحلة كاملة: <strong>{sym}{fmt(calc.perPersonTripTotal)}</strong></div>
              )}
              {calc.d > 0 && calc.n > 0 && (
                <div>إجمالي جميع المشاركين: <strong>{sym}{fmt(calc.perPersonTripTotal * calc.n)}</strong></div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Results Summary ── */}
      <div className="calc-results-card">

        {/* Feasibility Badge */}
        <div
          className="calc-feas-badge"
          style={{ background: feas.bg, borderColor: feas.border }}
        >
          <div className="calc-feas-icon" style={{ color: feas.color, borderColor: feas.border }}>
            {feas.icon}
          </div>
          <div className="calc-feas-body">
            <div className="calc-feas-title" style={{ color: feas.color }}>{feas.label}</div>
            {calc.feasibility !== "none" && (
              <div className="calc-feas-detail">
                التكلفة الفعلية: <strong>{sym}{fmt(calc.actualCostPerPerson)} / شخص</strong>
                {calc.target > 0 && (
                  <> &nbsp;·&nbsp; الحد الأقصى: <strong>{sym}{fmt(calc.target)}</strong></>
                )}
              </div>
            )}
          </div>
          {calc.feasibility !== "none" && calc.target > 0 && (
            <div className="calc-feas-diff" style={{ color: feas.color }}>
              {calc.actualCostPerPerson > calc.target
                ? <><span className="calc-feas-diff-sign">+</span>{sym}{fmt(calc.actualCostPerPerson - calc.target)} تجاوز</>
                : <><span className="calc-feas-diff-sign">−</span>{sym}{fmt(calc.target - calc.actualCostPerPerson)} هامش</>}
            </div>
          )}
        </div>

        {/* Cost Breakdown */}
        <div className="calc-breakdown">
          <h3 className="calc-breakdown-title">تفصيل التكاليف</h3>
          <div className="calc-breakdown-rows">
            <div className="calc-brow">
              <span className="calc-brow-dot calc-brow-dot--fixed" />
              <span className="calc-brow-label">
                إجمالي التكاليف الثابتة
                <span className="calc-brow-hint">(مرشد + مواصلات ثابتة)</span>
              </span>
              <span className="calc-brow-value">{sym}{fmt(calc.totalFixed)}</span>
            </div>
            <div className="calc-brow">
              <span className="calc-brow-dot calc-brow-dot--var" />
              <span className="calc-brow-label">
                إجمالي التكاليف المتغيرة
                <span className="calc-brow-hint">(مصاريف شخصية + مواصلات يومية)</span>
              </span>
              <span className="calc-brow-value">{sym}{fmt(calc.totalVariable)}</span>
            </div>
            <div className="calc-brow calc-brow--total">
              <span className="calc-brow-dot calc-brow-dot--total" />
              <span className="calc-brow-label">إجمالي تكلفة الرحلة</span>
              <span className="calc-brow-value">{sym}{fmt(calc.totalCost)}</span>
            </div>
            <div className="calc-brow calc-brow--per">
              <span className="calc-brow-dot calc-brow-dot--per" />
              <span className="calc-brow-label">التكلفة الفعلية / شخص</span>
              <span className="calc-brow-value">{sym}{fmt(calc.actualCostPerPerson)}</span>
            </div>
          </div>
        </div>

        {/* Break-Even */}
        <div className="calc-bep-panel">
          <div className="calc-bep-header">
            <span className="calc-bep-icon">🎯</span>
            <span className="calc-bep-title">تحليل نقطة التعادل</span>
          </div>

          {!calc.target ? (
            <p className="calc-bep-empty">أدخل الحد الأقصى للسعر / شخص لحساب نقطة التعادل</p>
          ) : calc.marginPerPerson <= 0 ? (
            <p className="calc-bep-impossible">
              السعر المستهدف لا يكفي لتغطية المصاريف الشخصية للرحلة —
              راجع السعر أو قلّل التكاليف الشخصية
            </p>
          ) : calc.bep ? (
            <div className="calc-bep-result">
              <div className="calc-bep-num-row">
                <div className="calc-bep-num">{calc.bep}</div>
                <div className="calc-bep-num-label">مشارك كحد أدنى لتغطية التكاليف</div>
              </div>
              {calc.n > 0 && (
                <div className={`calc-bep-status ${calc.bep <= calc.n ? "calc-bep-ok" : "calc-bep-warn"}`}>
                  {calc.bep <= calc.n
                    ? `✓ العدد المتوقع (${calc.n}) يتجاوز نقطة التعادل بـ ${calc.n - calc.bep} مشارك`
                    : `⚠ العدد المتوقع (${calc.n}) أقل من نقطة التعادل بـ ${calc.bep - calc.n} مشارك`}
                </div>
              )}
            </div>
          ) : (
            <p className="calc-bep-empty">أدخل التكاليف لحساب نقطة التعادل</p>
          )}
        </div>

        <div className="calc-results-footer">
          <button className="btn btn-secondary" onClick={reset}>🗑 مسح الكل</button>
        </div>
      </div>

      {/* ══ Israeli Tax & Profit Section ══════════════════════ */}
      <div className="calc-tax-card">

        {/* Header */}
        <div className="calc-tax-header">
          <div className="calc-tax-header-left">
            <span className="calc-tax-flag">🇮🇱</span>
            <div>
              <h2 className="calc-tax-title">تحليل الربحية بعد الضرائب</h2>
              <p className="calc-tax-subtitle">
                حدّد صافي الربح الذي تريده — الحاسبة تحسب كم تحتاج تتقاضى
                حتى تضمن هذا الصافي بعد ضريبة الأرباح والقيمة المضافة
              </p>
            </div>
          </div>
          {taxCalc && (
            <div className="calc-tax-cost-badge">
              <span className="calc-tax-cost-label">التكلفة / شخص</span>
              <span className="calc-tax-cost-value">{sym}{fmt(taxCalc.C)}</span>
            </div>
          )}
        </div>

        {/* ── 3 Inputs ── */}
        <div className="calc-tax-inputs">

          {/* Desired net profit */}
          <div className="calc-tax-input-group">
            <label className="calc-tax-label">
              🎯 صافي الربح المستهدف
              <span className="calc-tax-label-hint">نسبة من التكلفة، بعد كل الضرائب</span>
            </label>
            <div className="calc-tax-pct-wrap">
              <input
                className="calc-tax-input"
                type="number" min="0" max="500" placeholder="20"
                value={desiredProfit}
                onChange={(e) => setDesiredProfit(e.target.value)}
              />
              <span className="calc-tax-pct-sign">%</span>
            </div>
            {taxCalc && (
              <p className="calc-tax-brackets-note">
                = {sym}{fmt(taxCalc.netProfit)} صافٍ في جيبك لكل مشارك
              </p>
            )}
          </div>

          {/* Profit tax */}
          <div className="calc-tax-input-group">
            <label className="calc-tax-label">
              💼 ضريبة الأرباح (מס הכנסה)
              <span className="calc-tax-label-hint">تُخصم من الهامش قبل أن تصل إليك</span>
            </label>
            <div className="calc-tax-pct-wrap">
              <input
                className="calc-tax-input"
                type="number" min="0" max="99" placeholder="23"
                value={profitTaxRate}
                onChange={(e) => setProfitTaxRate(e.target.value)}
              />
              <span className="calc-tax-pct-sign">%</span>
            </div>
            <div className="calc-tax-brackets">
              {IL_BRACKETS.map((b) => (
                <button
                  key={b.rate}
                  className={`calc-bracket-chip ${profitTaxRate === b.rate ? "calc-bracket-chip--active" : ""}`}
                  onClick={() => setProfitTaxRate(b.rate)}
                  title={b.hint}
                >
                  {b.rate}%
                </button>
              ))}
            </div>
            <p className="calc-tax-brackets-note">
              شركة (מס חברות): ثابت 23% · عمل حر: حسب الشريحة الشخصية
            </p>
          </div>

          {/* VAT */}
          <div className="calc-tax-input-group">
            <label className="calc-tax-label">
              🧾 ضريبة القيمة المضافة (מע"מ)
              <span className="calc-tax-label-hint">تُضاف فوق السعر — يدفعها الزبون</span>
            </label>
            <div className="calc-tax-pct-wrap">
              <input
                className="calc-tax-input"
                type="number" min="0" max="30" placeholder="18"
                value={vatRate}
                onChange={(e) => setVatRate(e.target.value)}
              />
              <span className="calc-tax-pct-sign">%</span>
            </div>
            <p className="calc-tax-brackets-note">النسبة الرسمية في إسرائيل: 18% (2025)</p>
          </div>
        </div>

        {/* ── Results ── */}
        {!taxCalc ? (
          <div className="calc-tax-empty">
            أدخل التكاليف أولاً في الأقسام أعلاه لتفعيل هذا الحساب
          </div>
        ) : (
          <div className="calc-tax-results">

            {/* Flow ribbon: cost → +markup → +VAT → final */}
            <div className="calc-tax-ribbon">
              <div className="calc-tax-ribbon-item">
                <span className="calc-tax-ribbon-label">التكلفة / شخص</span>
                <span className="calc-tax-ribbon-value">{sym}{fmt(taxCalc.C)}</span>
              </div>
              <span className="calc-tax-ribbon-arrow">←</span>
              <div className="calc-tax-ribbon-item calc-tax-ribbon-item--gross">
                <span className="calc-tax-ribbon-label">هامش إجمالي مطلوب</span>
                <span className="calc-tax-ribbon-value">+{sym}{fmt(taxCalc.grossProfit)}</span>
                <span className="calc-tax-ribbon-sub">+{fmt(taxCalc.grossMarkupPct)}% من التكلفة</span>
              </div>
              <span className="calc-tax-ribbon-arrow">←</span>
              <div className="calc-tax-ribbon-item calc-tax-ribbon-item--vat">
                <span className="calc-tax-ribbon-label">ضريبة القيمة المضافة {vatRate}%</span>
                <span className="calc-tax-ribbon-value">+{sym}{fmt(taxCalc.vatAmount)}</span>
                <span className="calc-tax-ribbon-sub">يدفعها الزبون</span>
              </div>
              <span className="calc-tax-ribbon-arrow">←</span>
              <div className="calc-tax-ribbon-item calc-tax-ribbon-item--final">
                <span className="calc-tax-ribbon-label">السعر النهائي للزبون</span>
                <span className="calc-tax-ribbon-value">{sym}{fmt(taxCalc.finalPrice)}</span>
                <span className="calc-tax-ribbon-sub">شامل القيمة المضافة</span>
              </div>
            </div>

            {/* Two-column detail */}
            <div className="calc-tax-breakdown-grid">

              {/* Left: how the gross margin splits */}
              <div className="calc-tax-breakdown-col">
                <div className="calc-tax-breakdown-title">توزيع الهامش الإجمالي</div>

                <div className="calc-tax-brow">
                  <div className="calc-tax-brow-label">الهامش الإجمالي (قبل ضريبة الأرباح)</div>
                  <div className="calc-tax-brow-val">{sym}{fmt(taxCalc.grossProfit)}</div>
                </div>

                <div className="calc-tax-brow calc-tax-brow--deduct">
                  <div className="calc-tax-brow-label">
                    <span className="calc-tax-brow-dot" style={{ background: "#ef4444" }} />
                    ضريبة الأرباح ({profitTaxRate}%)
                  </div>
                  <div className="calc-tax-brow-val calc-tax-deduct">− {sym}{fmt(taxCalc.profitTaxAmount)}</div>
                </div>

                <div className="calc-tax-brow calc-tax-brow--net">
                  <div className="calc-tax-brow-label">
                    <span className="calc-tax-brow-dot" style={{ background: "#16a34a" }} />
                    صافي الربح (في جيبك)
                  </div>
                  <div className="calc-tax-brow-val calc-tax-net">{sym}{fmt(taxCalc.netProfit)}</div>
                </div>

                <div className="calc-tax-profit-pct-badge">
                  <span>التحقق: صافي الربح من التكلفة =</span>
                  <strong>{((taxCalc.netProfit / taxCalc.C) * 100).toFixed(2)}%</strong>
                </div>
              </div>

              {/* Right: final price build-up */}
              <div className="calc-tax-breakdown-col">
                <div className="calc-tax-breakdown-title">بناء السعر النهائي</div>

                <div className="calc-tax-price-stack">
                  <div className="calc-tax-stack-row calc-tax-stack-row--cost">
                    <span>التكلفة الصافية / شخص</span>
                    <span>{sym}{fmt(taxCalc.C)}</span>
                  </div>
                  <div className="calc-tax-stack-row calc-tax-stack-row--markup">
                    <span>الهامش الإجمالي (+{fmt(taxCalc.grossMarkupPct)}%)</span>
                    <span>+{sym}{fmt(taxCalc.grossProfit)}</span>
                  </div>
                  <div className="calc-tax-stack-row calc-tax-stack-row--exvat">
                    <span>السعر قبل القيمة المضافة</span>
                    <span>{sym}{fmt(taxCalc.priceExVat)}</span>
                  </div>
                  <div className="calc-tax-stack-row calc-tax-stack-row--vat">
                    <span>القيمة المضافة {vatRate}% (على الزبون)</span>
                    <span>+{sym}{fmt(taxCalc.vatAmount)}</span>
                  </div>
                  <div className="calc-tax-stack-row calc-tax-stack-row--final">
                    <span>السعر النهائي للزبون</span>
                    <span>{sym}{fmt(taxCalc.finalPrice)}</span>
                  </div>
                </div>

                <div className="calc-tax-total-markup">
                  الزيادة الإجمالية على التكلفة الخام (شاملاً الضرائب): <strong>+{fmt(taxCalc.totalMarkupPct)}%</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default TripCalculator;
