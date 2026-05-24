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
    </AdminLayout>
  );
};

export default TripCalculator;
