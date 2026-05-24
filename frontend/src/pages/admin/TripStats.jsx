// src/pages/admin/TripStats.jsx
// إحصائيات رحلة — مُجمَّعة حسب كل تاريخ

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { tripsAPI, applicationsAPI } from "../../api";
import "./AdminStyles.css";
import "./TripStats.css";

const STATUS_MAP = {
  pending:   { label: "قيد المراجعة",  color: "#f59e0b", bg: "#fffbeb" },
  reviewed:  { label: "تمت المراجعة", color: "#3b82f6", bg: "#eff6ff" },
  accepted:  { label: "تم القبول",     color: "#16a34a", bg: "#f0fdf4" },
  rejected:  { label: "تم الرفض",      color: "#dc2626", bg: "#fef2f2" },
  confirmed: { label: "مسجّل رسمياً", color: "#7c3aed", bg: "#f5f3ff" },
};

const fmtDate = (d) => {
  const date = new Date(d);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

const fmtDateLong = (d) =>
  new Date(d).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });

// نفس الصيغة المستخدمة في Register.jsx
const dateLabel = (d) => `${fmtDate(d.startDate)} - ${fmtDate(d.endDate)}`;

const TripStats = () => {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDate, setOpenDate] = useState(null); // index of expanded date

  useEffect(() => {
    const load = async () => {
      try {
        const [tripRes, appsRes] = await Promise.all([
          tripsAPI.getAdminById(id),
          applicationsAPI.getAll({ tripId: id }),
        ]);
        setTrip(tripRes.data);
        setApplications(appsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!trip)   return <div className="container" style={{ padding: 60 }}>الرحلة غير موجودة</div>;

  // ربط كل طلب بتاريخ محدد
  const appsForDate = (d) =>
    applications.filter((a) => a.preferredDate === dateLabel(d));

  const appsUndecided = applications.filter(
    (a) =>
      !trip.availableDates?.some((d) => a.preferredDate === dateLabel(d))
  );

  const isPast = (d) => new Date(d.endDate) < new Date();

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="admin-header-inner">
          <h1 className="admin-logo">رُحى <span>Admin</span></h1>
          <Link to="/admin/dashboard" className="btn btn-secondary">← الداشبورد</Link>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-container">

          {/* ===== رأس الصفحة ===== */}
          <div className="ts-header">
            <div className="ts-header-text">
              <h2 className="ts-title">{trip.title}</h2>
              <div className="ts-meta">
                <span>📍 {trip.destination}</span>
                <span>🗓 {trip.duration} أيام</span>
                <span>💰 {trip.price} {trip.currency}</span>
                <span className={`badge ${trip.isActive ? "badge-success" : "badge-inactive"}`}>
                  {trip.isActive ? "نشطة" : "مخفية"}
                </span>
              </div>
            </div>
            <Link to={`/admin/trips/edit/${id}`} className="btn btn-secondary">✏️ تعديل الرحلة</Link>
          </div>

          {/* ===== ملخص سريع ===== */}
          <div className="ts-quick-summary">
            <div className="ts-qs-item">
              <span className="ts-qs-num">
                {applications.filter((a) => a.status !== "confirmed" && a.status !== "rejected").length}
              </span>
              <span className="ts-qs-label">إجمالي الطلبات</span>
            </div>
            <div className="ts-qs-divider" />
            <div className="ts-qs-item">
              <span className="ts-qs-num" style={{ color: "#7c3aed" }}>
                {applications.filter((a) => a.status === "confirmed").length}
              </span>
              <span className="ts-qs-label">مسجّلون رسمياً</span>
            </div>
            <div className="ts-qs-divider" />
            <div className="ts-qs-item">
              <span className="ts-qs-num" style={{ color: "#f59e0b" }}>
                {applications.filter((a) => a.status === "pending").length}
              </span>
              <span className="ts-qs-label">قيد المراجعة</span>
            </div>
            <div className="ts-qs-divider" />
            <div className="ts-qs-item">
              <span className="ts-qs-num" style={{ color: "#6b7280" }}>
                {appsUndecided.length}
              </span>
              <span className="ts-qs-label">بدون تاريخ محدد</span>
            </div>
          </div>

          {/* ===== التواريخ — كل واحد بكتلة منفصلة ===== */}
          {!trip.availableDates?.length ? (
            <div className="admin-empty"><p>لا توجد تواريخ مضافة لهذه الرحلة.</p></div>
          ) : (
            <div className="ts-dates-list">
              {trip.availableDates.map((d, idx) => {
                const apps     = appsForDate(d);
                const past     = isPast(d);
                const label    = dateLabel(d);
                const confirmed = apps.filter((a) => a.status === "confirmed").length;
                const available = d.spotsTotal - confirmed;
                const fillPct  = d.spotsTotal > 0 ? Math.round((confirmed / d.spotsTotal) * 100) : 0;
                const isOpen   = openDate === idx;

                const countsByStatus = Object.fromEntries(
                  Object.keys(STATUS_MAP).map((k) => [k, apps.filter((a) => a.status === k).length])
                );

                return (
                  <div key={idx} className={`ts-date-block ${past ? "ts-date-block--past" : ""}`}>

                    {/* رأس التاريخ - قابل للطي */}
                    <button
                      className="ts-date-header"
                      onClick={() => setOpenDate(isOpen ? null : idx)}
                    >
                      <div className="ts-date-header-right">
                        <div className="ts-date-index">تاريخ {idx + 1}</div>
                        <div className="ts-date-range">
                          {fmtDateLong(d.startDate)} — {fmtDateLong(d.endDate)}
                          {past && <span className="ts-past-badge">منتهي</span>}
                        </div>
                        <div className="ts-date-label-code">{label}</div>
                      </div>

                      <div className="ts-date-header-left">
                        <div className="ts-date-chips">
                          <span className="ts-chip ts-chip-apps">
                            {apps.filter((a) => a.status !== "confirmed" && a.status !== "rejected").length} طلب
                          </span>
                        </div>
                        <span className="ts-date-toggle">{isOpen ? "▲" : "▼"}</span>
                      </div>
                    </button>

                    {/* شريط الامتلاء */}
                    <div className="ts-date-progress">
                      <div className="ts-progress-bar">
                        <div className="ts-progress-fill" style={{ width: `${fillPct}%` }} />
                      </div>
                      <span className="ts-progress-pct">{confirmed} / {d.spotsTotal} مقعد</span>
                    </div>

                    {/* تفاصيل التاريخ (طيّ/فتح) */}
                    {isOpen && (
                      <div className="ts-date-body">

                        {/* توزيع الطلبات */}
                        <div className="ts-status-row">
                          {Object.entries(STATUS_MAP).map(([key, val]) => (
                            <div key={key} className="ts-status-mini" style={{ background: val.bg, borderColor: val.color }}>
                              <span className="ts-status-mini-num" style={{ color: val.color }}>
                                {countsByStatus[key]}
                              </span>
                              <span className="ts-status-mini-label">{val.label}</span>
                            </div>
                          ))}
                        </div>

                        {/* جدول الطلبات لهذا التاريخ */}
                        {apps.length === 0 ? (
                          <div className="ts-no-apps">لا توجد طلبات لهذا التاريخ بعد.</div>
                        ) : (
                          <div className="admin-table-wrapper">
                            <table className="admin-table">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>الاسم</th>
                                  <th>البلد والمدينة</th>
                                  <th>الحالة</th>
                                  <th>تاريخ التقديم</th>
                                  <th>تواصل</th>
                                </tr>
                              </thead>
                              <tbody>
                                {apps.map((a, i) => {
                                  const s = STATUS_MAP[a.status];
                                  return (
                                    <tr key={a._id}>
                                      <td>{i + 1}</td>
                                      <td><strong>{a.fullName}</strong></td>
                                      <td>{a.country} — {a.city}</td>
                                      <td>
                                        <span style={{
                                          color: s.color, background: s.bg,
                                          padding: "3px 10px", borderRadius: 20,
                                          fontSize: "0.8rem", fontWeight: 700,
                                        }}>
                                          {s.label}
                                        </span>
                                      </td>
                                      <td>{new Date(a.createdAt).toLocaleDateString("ar-SA")}</td>
                                      <td>
                                        <div style={{ display: "flex", gap: 6 }}>
                                          <a
                                            href={`https://wa.me/${a.phone.replace(/\D/g, "")}`}
                                            target="_blank" rel="noreferrer"
                                            className="btn-action btn-edit"
                                          >واتساب</a>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ===== طلبات بدون تاريخ محدد ===== */}
          {appsUndecided.length > 0 && (
            <div className="ts-date-block ts-date-block--undecided">
              <div className="ts-date-header" style={{ cursor: "default" }}>
                <div className="ts-date-header-right">
                  <div className="ts-date-index">؟</div>
                  <div className="ts-date-range">بدون تاريخ محدد أو "مش متأكد"</div>
                </div>
                <div className="ts-date-header-left">
                  <span className="ts-chip ts-chip-apps">{appsUndecided.length} طلب</span>
                </div>
              </div>

              <div className="ts-date-body">
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>الاسم</th>
                        <th>ما كتبه في التاريخ</th>
                        <th>الحالة</th>
                        <th>تواصل</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appsUndecided.map((a, i) => {
                        const s = STATUS_MAP[a.status];
                        return (
                          <tr key={a._id}>
                            <td>{i + 1}</td>
                            <td><strong>{a.fullName}</strong></td>
                            <td style={{ color: "#9ca3af", fontStyle: "italic" }}>
                              {a.preferredDate || "—"}
                            </td>
                            <td>
                              <span style={{
                                color: s.color, background: s.bg,
                                padding: "3px 10px", borderRadius: 20,
                                fontSize: "0.8rem", fontWeight: 700,
                              }}>
                                {s.label}
                              </span>
                            </td>
                            <td>
                              <a
                                href={`https://wa.me/${a.phone.replace(/\D/g, "")}`}
                                target="_blank" rel="noreferrer"
                                className="btn-action btn-edit"
                              >واتساب</a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default TripStats;
