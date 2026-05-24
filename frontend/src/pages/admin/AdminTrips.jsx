// src/pages/admin/AdminTrips.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { tripsAPI, applicationsAPI } from "../../api";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/admin/AdminLayout";
import "./AdminStyles.css";

const STATUS_MAP = {
  pending:         { label: "قيد المراجعة",     color: "#f59e0b", bg: "#fffbeb" },
  reviewed:        { label: "تمت المراجعة",     color: "#3b82f6", bg: "#eff6ff" },
  accepted:        { label: "تم القبول",         color: "#16a34a", bg: "#f0fdf4" },
  rejected:        { label: "تم الرفض",          color: "#dc2626", bg: "#fef2f2" },
  payment_pending: { label: "انتظار الدفع",      color: "#7c3aed", bg: "#ede9fe" },
  confirmed:       { label: "مسجّل رسمياً",     color: "#065f46", bg: "#d1fae5" },
};

const APP_FOLDERS = [
  { key: "pending",   label: "قيد المراجعة",   emoji: "🕐" },
  { key: "reviewed",  label: "تمت المراجعة",  emoji: "📋" },
  { key: "accepted",  label: "تم القبول",      emoji: "✅" },
  { key: "rejected",  label: "تم الرفض",       emoji: "❌" },
  { key: "confirmed", label: "مسجّلون رسمياً", emoji: "⭐" },
];

const STATUSES_NEED_REASON = ["reviewed", "accepted", "rejected"];

const fmtDate = (d) => {
  const date = new Date(d);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

// ── Client Notes ──────────────────────────────────────────
const ClientNotesSection = ({ app, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(app.clientNotes || "");
  const [saving, setSaving]   = useState(false);

  useEffect(() => { setDraft(app.clientNotes || ""); setEditing(false); }, [app._id]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="app-detail-section client-notes-section">
      <div className="client-notes-header">
        <div className="detail-label">📝 ملاحظات عن العميل <span className="optional-tag">(اختياري)</span></div>
        {!editing && (
          <button className="client-notes-edit-btn" onClick={() => setEditing(true)}>
            {app.clientNotes ? "تعديل" : "+ إضافة"}
          </button>
        )}
      </div>
      {editing ? (
        <div className="client-notes-editor">
          <textarea
            className="status-reason-textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="مثال: لديه حساسية من المكسرات..."
            rows={4} autoFocus
          />
          <div className="status-reason-actions">
            <button className="btn-reason-confirm" style={{ background: "#0ea5e9" }} onClick={handleSave} disabled={saving}>
              {saving ? "جاري الحفظ..." : "حفظ الملاحظة"}
            </button>
            <button className="btn btn-secondary" onClick={() => { setDraft(app.clientNotes || ""); setEditing(false); }}>
              إلغاء
            </button>
          </div>
        </div>
      ) : app.clientNotes ? (
        <div className="client-notes-display">{app.clientNotes}</div>
      ) : (
        <div className="client-notes-empty">لا توجد ملاحظات بعد</div>
      )}
    </div>
  );
};

// ── Trip Detail Panel ─────────────────────────────────────
const TripDetail = ({ trip, applications, onDelete }) => {
  const tripApps = applications.filter(
    (a) => (a.trip?._id || a.trip) === trip._id
  );
  const confirmedCount = tripApps.filter((a) => a.status === "confirmed").length;
  const pendingCount   = tripApps.filter((a) => a.status === "pending").length;

  return (
    <div className="trip-detail-panel">
      {/* Header */}
      <div className="trip-detail-header">
        <div>
          <h2 className="trip-detail-title">{trip.title}</h2>
          <div className="trip-detail-meta">
            <span>📍 {trip.destination}</span>
            <span>🗓 {trip.duration} أيام</span>
            <span>💰 {trip.price} {trip.currency}</span>
            <span className={`badge ${trip.isActive ? "badge-success" : "badge-inactive"}`}>
              {trip.isActive ? "نشطة" : "مخفية"}
            </span>
            {trip.isFeatured && <span className="badge badge-primary">مميزة</span>}
          </div>
        </div>
        <div className="trip-detail-actions">
          <Link to={`/admin/trips/${trip._id}/stats`} className="btn-action" style={{ background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe" }}>
            📊 إحصائيات
          </Link>
          <Link to={`/admin/trips/edit/${trip._id}`} className="btn-action btn-edit">
            تعديل
          </Link>
          <button className="btn-action btn-delete" onClick={() => onDelete(trip._id)}>
            حذف
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="trip-detail-stats">
        <div className="trip-ds-item">
          <span className="trip-ds-num">{tripApps.length}</span>
          <span className="trip-ds-label">إجمالي الطلبات</span>
        </div>
        <div className="trip-ds-item" style={{ color: pendingCount > 0 ? "#f59e0b" : undefined }}>
          <span className="trip-ds-num">{pendingCount}</span>
          <span className="trip-ds-label">طلبات جديدة</span>
        </div>
        <div className="trip-ds-item" style={{ color: "#065f46" }}>
          <span className="trip-ds-num">{confirmedCount}</span>
          <span className="trip-ds-label">مسجّلون رسمياً</span>
        </div>
      </div>

      {/* Available Dates */}
      {trip.availableDates?.length > 0 && (
        <div className="trip-detail-section">
          <div className="trip-detail-section-title">📅 التواريخ المتاحة</div>
          <div className="trip-dates-list">
            {trip.availableDates.map((d, i) => {
              const taken    = d.spotsTaken || 0;
              const total    = d.spotsTotal || 0;
              const avail    = total - taken;
              const pct      = total > 0 ? Math.round((taken / total) * 100) : 0;
              const isPast   = new Date(d.endDate) < new Date();
              const isFull   = avail <= 0;
              return (
                <div key={i} className={`trip-date-row ${isPast ? "trip-date-row--past" : ""} ${isFull ? "trip-date-row--full" : ""}`}>
                  <div className="trip-date-range">
                    <span className="trip-date-label">{fmtDate(d.startDate)} — {fmtDate(d.endDate)}</span>
                    {isPast && <span className="trip-date-tag trip-date-tag--past">منتهي</span>}
                    {isFull && !isPast && <span className="trip-date-tag trip-date-tag--full">مكتمل</span>}
                  </div>
                  <div className="trip-date-spots">
                    <div className="trip-spots-bar">
                      <div className="trip-spots-fill" style={{ width: `${pct}%`, background: isFull ? "#dc2626" : pct > 70 ? "#f59e0b" : "#16a34a" }} />
                    </div>
                    <span className="trip-spots-text">
                      <strong style={{ color: isFull ? "#dc2626" : "#16a34a" }}>{avail}</strong>
                      <span style={{ color: "#a0aec0" }}> / {total} متاح</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Short description */}
      {trip.shortDescription && (
        <div className="trip-detail-section">
          <div className="trip-detail-section-title">📝 وصف مختصر</div>
          <p style={{ fontSize: "0.9rem", color: "#4a5568", lineHeight: 1.8, margin: 0 }}>{trip.shortDescription}</p>
        </div>
      )}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────
const AdminTrips = () => {
  const { admin } = useAuth();

  const [activeTab, setActiveTab]       = useState("trips");
  const [trips, setTrips]               = useState([]);
  const [applications, setApplications] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [appsLoading, setAppsLoading]   = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);

  const [appFolder, setAppFolder]         = useState("pending");
  const [selectedApp, setSelectedApp]     = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [statusReason, setStatusReason]   = useState("");
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  useEffect(() => {
    tripsAPI.getAdminAll()
      .then(({ data }) => setTrips(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setTripsLoading(false));

    applicationsAPI.getAll()
      .then(({ data }) => setApplications(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setAppsLoading(false));
  }, []);

  useEffect(() => { setPendingStatus(null); setStatusReason(""); }, [selectedApp?._id]);

  const handleDeleteTrip = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الرحلة؟")) return;
    try {
      await tripsAPI.delete(id);
      setTrips((prev) => prev.filter((t) => t._id !== id));
      if (selectedTrip?._id === id) setSelectedTrip(null);
    } catch { alert("فشل حذف الرحلة"); }
  };

  const handleUpdateStatus = async (appId, newStatus, notes) => {
    const app = applications.find((a) => a._id === appId);
    const oldStatus = app?.status;
    try {
      const payload = { status: newStatus };
      if (notes !== undefined) payload.adminNotes = notes;
      await applicationsAPI.updateStatus(appId, payload);

      const newHistoryEntry = {
        status: newStatus, reason: notes || "",
        changedBy: admin?.username || admin?.name || "",
        changedAt: new Date().toISOString(),
      };
      const localUpdate = {
        status: newStatus,
        ...(notes !== undefined && { adminNotes: notes }),
        history: [...(app.history || []), newHistoryEntry],
      };
      setApplications((prev) => prev.map((a) => a._id === appId ? { ...a, ...localUpdate } : a));
      if (selectedApp?._id === appId) setSelectedApp((prev) => ({ ...prev, ...localUpdate }));

      if (oldStatus !== newStatus) {
        const tripId = app?.trip?._id || app?.trip;
        if (newStatus === "confirmed" && oldStatus !== "confirmed") {
          setTrips((prev) => prev.map((t) => t._id === tripId ? { ...t, bookedSpots: (t.bookedSpots || 0) + 1 } : t));
        } else if (oldStatus === "confirmed" && newStatus !== "confirmed") {
          setTrips((prev) => prev.map((t) => t._id === tripId ? { ...t, bookedSpots: Math.max(0, (t.bookedSpots || 0) - 1) } : t));
        }
      }
    } catch { alert("فشل تحديث الحالة"); }
  };

  const handleStatusButtonClick = (key, val) => {
    if (STATUSES_NEED_REASON.includes(key)) {
      setPendingStatus({ key, ...val });
      setStatusReason("");
    } else {
      handleUpdateStatus(selectedApp._id, key);
    }
  };

  const handleConfirmWithReason = () => {
    if (!statusReason.trim()) return;
    handleUpdateStatus(selectedApp._id, pendingStatus.key, statusReason.trim());
    setPendingStatus(null);
    setStatusReason("");
  };

  const handleDeleteApp = async (appId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الطلب؟")) return;
    try {
      await applicationsAPI.delete(appId);
      setApplications((prev) => prev.filter((a) => a._id !== appId));
      if (selectedApp?._id === appId) setSelectedApp(null);
    } catch { alert("فشل حذف الطلب"); }
  };

  const pendingCount = applications.filter((a) => a.status === "pending").length;
  const filteredApps = applications.filter((a) => a.status === appFolder);

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1 className="admin-page-title">الرحلات</h1>
      </div>

      {/* Tabs */}
      <div className="admin-tabs" style={{ marginBottom: "28px" }}>
        <button className={`admin-tab ${activeTab === "trips" ? "active" : ""}`} onClick={() => setActiveTab("trips")}>
          ✈️ الرحلات
        </button>
        <button className={`admin-tab ${activeTab === "applications" ? "active" : ""}`} onClick={() => setActiveTab("applications")}>
          📩 طلبات التسجيل
          {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
        </button>
      </div>

      {/* ══ Trips Tab ══════════════════════════════════════════ */}
      {activeTab === "trips" && (
        <div className="trips-master-detail">

          {/* List */}
          <div className="trips-list-col">
            <div className="trips-list-header">
              <span>الرحلات ({trips.length})</span>
              <Link to="/admin/trips/new" className="btn btn-primary" style={{ padding: "7px 16px", fontSize: "0.85rem" }}>
                + جديدة
              </Link>
            </div>

            {tripsLoading ? (
              <div className="page-loading"><div className="spinner" /></div>
            ) : trips.length === 0 ? (
              <div className="admin-empty" style={{ padding: "40px 20px" }}>
                <p>لا توجد رحلات.</p>
              </div>
            ) : (
              <div className="trips-list">
                {trips.map((trip) => {
                  const tripPending = applications.filter(
                    (a) => (a.trip?._id || a.trip) === trip._id && a.status === "pending"
                  ).length;
                  return (
                    <button
                      key={trip._id}
                      className={`trip-list-item ${selectedTrip?._id === trip._id ? "trip-list-item--active" : ""}`}
                      onClick={() => setSelectedTrip((prev) => prev?._id === trip._id ? null : trip)}
                    >
                      <div className="trip-list-item-main">
                        <span className="trip-list-item-title">{trip.title}</span>
                        <span className="trip-list-item-dest">📍 {trip.destination}</span>
                      </div>
                      <div className="trip-list-item-badges">
                        <span className={`trip-list-badge ${trip.isActive ? "trip-list-badge--active" : "trip-list-badge--hidden"}`}>
                          {trip.isActive ? "نشطة" : "مخفية"}
                        </span>
                        {tripPending > 0 && (
                          <span className="trip-list-badge trip-list-badge--pending">{tripPending} جديد</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail */}
          <div className="trips-detail-col">
            {!selectedTrip ? (
              <div className="trips-detail-empty">
                <div className="trips-detail-empty-icon">✈️</div>
                <p>اختر رحلة من القائمة لعرض تفاصيلها</p>
              </div>
            ) : (
              <TripDetail
                trip={selectedTrip}
                applications={applications}
                onDelete={handleDeleteTrip}
              />
            )}
          </div>
        </div>
      )}

      {/* ══ Applications Tab ═══════════════════════════════════ */}
      {activeTab === "applications" && (
        <div>
          <div className="app-folders">
            {APP_FOLDERS.map((folder) => {
              const count = applications.filter((a) => a.status === folder.key).length;
              return (
                <button
                  key={folder.key}
                  className={`app-folder-btn ${appFolder === folder.key ? "app-folder-btn--active" : ""}`}
                  style={{ "--f-color": STATUS_MAP[folder.key].color, "--f-bg": STATUS_MAP[folder.key].bg }}
                  onClick={() => { setAppFolder(folder.key); setSelectedApp(null); }}
                >
                  <span className="app-folder-emoji">{folder.emoji}</span>
                  <span className="app-folder-label">{folder.label}</span>
                  {count > 0 && <span className="app-folder-count">{count}</span>}
                </button>
              );
            })}
          </div>

          <div className="applications-layout">
            <div className="applications-list">
              <div className="admin-section-header">
                <h2>
                  {APP_FOLDERS.find((f) => f.key === appFolder)?.emoji}{" "}
                  {APP_FOLDERS.find((f) => f.key === appFolder)?.label} ({filteredApps.length})
                </h2>
              </div>
              {appsLoading ? (
                <div className="page-loading"><div className="spinner" /></div>
              ) : filteredApps.length === 0 ? (
                <div className="admin-empty"><p>لا توجد طلبات في هذا القسم.</p></div>
              ) : (
                <div className="app-cards">
                  {filteredApps.map((app) => {
                    const s = STATUS_MAP[app.status];
                    return (
                      <div
                        key={app._id}
                        className={`app-card ${selectedApp?._id === app._id ? "app-card-selected" : ""}`}
                        onClick={() => setSelectedApp(app)}
                      >
                        <div className="app-card-top">
                          <div>
                            <div className="app-name">{app.fullName}</div>
                            <div className="app-trip">{app.tripTitle}</div>
                          </div>
                          <span className="app-status-badge" style={{ color: s.color, background: s.bg }}>{s.label}</span>
                        </div>
                        <div className="app-card-bottom">
                          <span>📍 {app.country} - {app.city}</span>
                          <span>{new Date(app.createdAt).toLocaleDateString("ar-SA")}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="app-detail-panel">
              {!selectedApp ? (
                <div className="app-detail-empty"><p>👈 اختر طلباً لعرض تفاصيله</p></div>
              ) : (
                <div className="app-detail">
                  <div className="app-detail-header">
                    <h3>{selectedApp.fullName}</h3>
                    <button className="close-detail" onClick={() => setSelectedApp(null)}>✕</button>
                  </div>

                  <div className="app-detail-section">
                    <div className="detail-label">الرحلة</div>
                    <div className="detail-value">{selectedApp.tripTitle}</div>
                  </div>
                  <div className="app-detail-section">
                    <div className="detail-label">التاريخ المفضّل</div>
                    <div className="detail-value">{selectedApp.preferredDate || "غير محدد"}</div>
                  </div>

                  <div className="app-detail-grid">
                    <div className="app-detail-section">
                      <div className="detail-label">الجنس</div>
                      <div className="detail-value">{selectedApp.gender === "male" ? "ذكر" : selectedApp.gender === "female" ? "أنثى" : "—"}</div>
                    </div>
                    <div className="app-detail-section">
                      <div className="detail-label">البلد والمدينة</div>
                      <div className="detail-value">{selectedApp.country} - {selectedApp.city}</div>
                    </div>
                    <div className="app-detail-section">
                      <div className="detail-label">الهاتف</div>
                      <div className="detail-value ltr">{selectedApp.phone}</div>
                    </div>
                    <div className="app-detail-section">
                      <div className="detail-label">الإيميل</div>
                      <div className="detail-value ltr">{selectedApp.email}</div>
                    </div>
                    {selectedApp.instagram && (
                      <div className="app-detail-section">
                        <div className="detail-label">الإنستغرام</div>
                        <div className="detail-value ltr">
                          <a href={`https://instagram.com/${selectedApp.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" style={{ color: "#e1306c" }}>
                            {selectedApp.instagram.startsWith("@") ? selectedApp.instagram : `@${selectedApp.instagram}`}
                          </a>
                        </div>
                      </div>
                    )}
                    <div className="app-detail-section">
                      <div className="detail-label">نسخة السياسات</div>
                      <div className="detail-value" style={{ fontFamily: "monospace", fontSize: "13px", color: selectedApp.agreedPolicyVersion ? "#16a34a" : "#a0aec0" }}>
                        {selectedApp.agreedPolicyVersion || "غير مسجّل"}
                      </div>
                    </div>
                    <div className="app-detail-section">
                      <div className="detail-label">تاريخ التقديم</div>
                      <div className="detail-value">
                        {new Date(selectedApp.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}
                      </div>
                    </div>
                  </div>

                  <div className="app-detail-section">
                    <div className="detail-label">إجابات الأسئلة</div>
                    <div className="yn-summary">
                      <div className={`yn-item ${selectedApp.agreeVolunteering ? "yn-item-yes" : "yn-item-no"}`}>
                        {selectedApp.agreeVolunteering ? "✅" : "❌"} موافق على التطوع
                      </div>
                      <div className={`yn-item ${selectedApp.hasEnglish ? "yn-item-yes" : "yn-item-no"}`}>
                        {selectedApp.hasEnglish ? "✅" : "❌"} مستوى إنجليزي متوسط
                      </div>
                      <div className={`yn-item ${selectedApp.readyForDeposit ? "yn-item-yes" : "yn-item-no"}`}>
                        {selectedApp.readyForDeposit ? "✅" : "❌"} مستعد للعربون
                      </div>
                    </div>
                  </div>

                  <div className="app-detail-section">
                    <div className="detail-label">تعريف عن نفسه</div>
                    <div className="detail-about">{selectedApp.aboutMe}</div>
                  </div>

                  {selectedApp.history?.length > 1 && (
                    <div className="app-detail-section">
                      <button className="btn btn-secondary" style={{ width: "100%" }} onClick={() => setHistoryModalOpen(true)}>
                        📋 سجّل الملف
                      </button>
                    </div>
                  )}

                  <div className="app-detail-section">
                    <div className="detail-label">نقل الطلب إلى</div>
                    <div className="status-buttons">
                      {Object.entries(STATUS_MAP).map(([key, val]) => {
                        const isConfirmedLocked = key === "confirmed" && selectedApp.status !== "accepted";
                        const isPendingLocked   = key === "pending"   && selectedApp.status !== "pending";
                        return (
                          <button
                            key={key}
                            className={`status-btn ${selectedApp.status === key ? "status-btn-active" : ""} ${isConfirmedLocked || isPendingLocked ? "status-btn-locked" : ""}`}
                            style={{ "--s-color": val.color, "--s-bg": val.bg }}
                            disabled={isConfirmedLocked || isPendingLocked || selectedApp.status === key}
                            onClick={() => handleStatusButtonClick(key, val)}
                          >
                            {val.label}
                            {STATUSES_NEED_REASON.includes(key) && selectedApp.status !== key && (
                              <span className="status-btn-reason-hint"> ✏️</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {pendingStatus && (
                      <div className="status-reason-box" style={{ "--r-color": pendingStatus.color, "--r-bg": pendingStatus.bg }}>
                        <div className="status-reason-title">سبب النقل إلى "{pendingStatus.label}" *</div>
                        <textarea
                          className="status-reason-textarea"
                          value={statusReason}
                          onChange={(e) => setStatusReason(e.target.value)}
                          placeholder="اكتب السبب هنا..."
                          rows={3} autoFocus
                        />
                        <div className="status-reason-actions">
                          <button className="btn-reason-confirm" style={{ background: pendingStatus.color }} onClick={handleConfirmWithReason} disabled={!statusReason.trim()}>
                            تأكيد النقل
                          </button>
                          <button className="btn btn-secondary" onClick={() => { setPendingStatus(null); setStatusReason(""); }}>
                            إلغاء
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedApp.status === "accepted" && (
                    <div className="app-detail-section">
                      <button className="btn-confirm-deposit" onClick={() => handleUpdateStatus(selectedApp._id, "confirmed")}>
                        💰 تأكيد دفع العربون — تسجيل رسمي
                      </button>
                    </div>
                  )}

                  <ClientNotesSection
                    app={selectedApp}
                    onSave={(notes) =>
                      applicationsAPI.updateStatus(selectedApp._id, { clientNotes: notes })
                        .then(() => {
                          const update = { clientNotes: notes };
                          setApplications((prev) => prev.map((a) => a._id === selectedApp._id ? { ...a, ...update } : a));
                          setSelectedApp((prev) => ({ ...prev, ...update }));
                        })
                        .catch(() => alert("فشل حفظ الملاحظة"))
                    }
                  />

                  <div className="app-detail-actions">
                    <a href={`https://wa.me/${selectedApp.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="btn btn-primary">
                      📱 واتساب
                    </a>
                    <a href={`mailto:${selectedApp.email}`} className="btn btn-secondary">📧 إيميل</a>
                    <button className="btn-action btn-delete" onClick={() => handleDeleteApp(selectedApp._id)} style={{ padding: "10px 16px" }}>
                      حذف الطلب
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModalOpen && selectedApp && (
        <div className="modal-overlay" onClick={() => setHistoryModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">📋 سجّل الملف</h2>
                <p className="modal-subtitle">{selectedApp.fullName}</p>
              </div>
              <button className="modal-close" onClick={() => setHistoryModalOpen(false)}>✕</button>
            </div>
            <div className="modal-content" style={{ padding: "24px" }}>
              <div style={{ position: "relative", paddingRight: "16px", borderRight: "2px solid #e2e8f0" }}>
                <div style={{ marginBottom: "20px", position: "relative" }}>
                  <div style={{ position: "absolute", right: "-21px", top: "4px", width: "10px", height: "10px", borderRadius: "50%", background: "#6b7280", border: "2px solid #fff", boxShadow: "0 0 0 2px #6b7280" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ background: "#f3f4f6", color: "#6b7280", padding: "3px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: 700 }}>تم إرسال الطلب</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#a0aec0" }}>
                    {new Date(selectedApp.createdAt).toLocaleString("ar-SA", { timeZone: "Asia/Riyadh", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                {selectedApp.history.slice(1).map((entry, i) => {
                  const s = STATUS_MAP[entry.status] || { label: entry.status, color: "#6b7280", bg: "#f3f4f6" };
                  const isLast = i === selectedApp.history.slice(1).length - 1;
                  return (
                    <div key={i} style={{ marginBottom: isLast ? 0 : "20px", position: "relative" }}>
                      <div style={{ position: "absolute", right: "-21px", top: "4px", width: "10px", height: "10px", borderRadius: "50%", background: s.color, border: "2px solid #fff", boxShadow: `0 0 0 2px ${s.color}` }} />
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ background: s.bg, color: s.color, padding: "3px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: 700 }}>{s.label}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#a0aec0", marginBottom: "4px", display: "flex", gap: "10px", alignItems: "center" }}>
                        <span>{new Date(entry.changedAt).toLocaleString("ar-SA", { timeZone: "Asia/Riyadh", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        {entry.changedBy && (
                          <span style={{ background: "#f1f5f9", color: "#475569", padding: "1px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 600 }}>@{entry.changedBy}</span>
                        )}
                      </div>
                      {entry.reason && (
                        <div style={{ fontSize: "13px", color: "#4a5568", background: "#f8fafc", padding: "8px 12px", borderRadius: "6px" }}>{entry.reason}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminTrips;
