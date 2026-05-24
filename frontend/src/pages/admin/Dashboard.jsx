// src/pages/admin/Dashboard.jsx
// الداشبورد الرئيسي للآدمن - رحلات + طلبات التسجيل

import { useState, useEffect, useCallback } from "react";
import Cropper from "react-easy-crop";
import { getCropImgStyle } from "../../utils/cropStyle";
import { Link, useNavigate } from "react-router-dom";
import { tripsAPI, applicationsAPI, galleryAPI, subscribersAPI, policyVersionsAPI } from "../../api";
import { POLICIES } from "../../data/policies";
import { useAuth } from "../../context/AuthContext";
import "./AdminStyles.css";

const STATUS_MAP = {
  pending:         { label: "قيد المراجعة",       color: "#f59e0b", bg: "#fffbeb" },
  reviewed:        { label: "تمت المراجعة",       color: "#3b82f6", bg: "#eff6ff" },
  accepted:        { label: "تم القبول",           color: "#16a34a", bg: "#f0fdf4" },
  rejected:        { label: "تم الرفض",            color: "#dc2626", bg: "#fef2f2" },
  payment_pending: { label: "في انتظار تأكيد الدفع", color: "#7c3aed", bg: "#ede9fe" },
  confirmed:       { label: "مسجّل رسمياً",       color: "#065f46", bg: "#d1fae5" },
};

// ==============================
// مكوّن ملاحظات العميل
// ==============================
const ClientNotesSection = ({ app, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(app.clientNotes || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(app.clientNotes || "");
    setEditing(false);
  }, [app._id]);

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
            placeholder="مثال: لديه حساسية من المكسرات — يُفضّل النشاطات الثقافية — قد يحتاج متابعة إضافية..."
            rows={4}
            autoFocus
          />
          <div className="status-reason-actions">
            <button
              className="btn-reason-confirm"
              style={{ background: "#0ea5e9" }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "جاري الحفظ..." : "حفظ الملاحظة"}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => { setDraft(app.clientNotes || ""); setEditing(false); }}
            >
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

const APP_FOLDERS = [
  { key: "pending",   label: "قيد المراجعة",   emoji: "🕐" },
  { key: "reviewed",  label: "تمت المراجعة",  emoji: "📋" },
  { key: "accepted",  label: "تم القبول",      emoji: "✅" },
  { key: "rejected",  label: "تم الرفض",       emoji: "❌" },
  { key: "confirmed", label: "مسجّلون رسمياً", emoji: "⭐" },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("trips");
  const [appFolder, setAppFolder] = useState("pending");
  const [trips, setTrips] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appLoading, setAppLoading] = useState(true);
  const [pendingStatus, setPendingStatus] = useState(null); // { key, label, color, bg }
  const [statusReason, setStatusReason] = useState("");

  const [subscribers, setSubscribers] = useState([]);
  const [subscribersLoading, setSubscribersLoading] = useState(false);
  const [subscriberSearch, setSubscriberSearch] = useState("");
  const [subscriberCountry, setSubscriberCountry] = useState("");
  const [subscriberCountries, setSubscriberCountries] = useState([]);
  const [subscriberGender, setSubscriberGender] = useState("");

  const [gallery, setGallery] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [newPhoto, setNewPhoto] = useState({ url: "", title: "", isFeatured: false });
  const [photoSaving, setPhotoSaving] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPct, setCroppedAreaPct] = useState(null);

  const FEATURED_LIMIT = 3;

  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const fetchSubscribers = async (q = "", country = "", gender = "") => {
    setSubscribersLoading(true);
    try {
      const { data } = await subscribersAPI.getAll(q, country, gender);
      setSubscribers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSubscribersLoading(false);
    }
  };

  const fetchSubscriberCountries = async () => {
    try {
      const { data } = await subscribersAPI.getCountries();
      setSubscriberCountries(data);
    } catch (err) {
      console.error(err);
    }
  };

  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const [policyVersions, setPolicyVersions] = useState([]);
  const [policyVersionsLoading, setPolicyVersionsLoading] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [selectedPolicyVersion, setSelectedPolicyVersion] = useState(null);
  const [policyVersionDetail, setPolicyVersionDetail] = useState(null);
  const [policyDetailLoading, setPolicyDetailLoading] = useState(false);

  const handleDeleteSubscriber = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المشترك؟")) return;
    try {
      await subscribersAPI.delete(id);
      setSubscribers((prev) => prev.filter((s) => s._id !== id));
    } catch {
      alert("فشل حذف المشترك");
    }
  };

  const fetchPolicyVersions = async () => {
    setPolicyVersionsLoading(true);
    try {
      const { data } = await policyVersionsAPI.getAll();
      setPolicyVersions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setPolicyVersionsLoading(false);
    }
  };

  const handleSavePolicyVersion = async () => {
    setSavingPolicy(true);
    try {
      const { data } = await policyVersionsAPI.save(POLICIES);
      setPolicyVersions((prev) => [data, ...prev]);
      alert(`✅ تم حفظ النسخة: ${data.versionName}`);
    } catch (err) {
      alert(err?.response?.data?.message || "فشل حفظ النسخة");
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleViewPolicyVersion = async (version) => {
    if (selectedPolicyVersion?._id === version._id) {
      setSelectedPolicyVersion(null);
      setPolicyVersionDetail(null);
      return;
    }
    setSelectedPolicyVersion(version);
    setPolicyDetailLoading(true);
    try {
      const { data } = await policyVersionsAPI.getById(version._id);
      setPolicyVersionDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setPolicyDetailLoading(false);
    }
  };

  const handleDeletePolicyVersion = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه النسخة؟")) return;
    try {
      await policyVersionsAPI.delete(id);
      setPolicyVersions((prev) => prev.filter((v) => v._id !== id));
      if (selectedPolicyVersion?._id === id) {
        setSelectedPolicyVersion(null);
        setPolicyVersionDetail(null);
      }
    } catch {
      alert("فشل حذف النسخة");
    }
  };

  const fetchGallery = async () => {
    try {
      const { data } = await galleryAPI.getAll();
      setGallery(data);
    } catch (err) {
      console.error(err);
    } finally {
      setGalleryLoading(false);
    }
  };

  const featuredCount = gallery.filter((p) => p.isFeatured).length;

  const onCropComplete = useCallback((croppedAreaPct) => {
    setCroppedAreaPct(croppedAreaPct);
  }, []);

  const resetCrop = () => {
    setCropMode(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPct(null);
  };

  const handleAddPhoto = async (e) => {
    e.preventDefault();
    if (!newPhoto.url.trim()) return;
    if (newPhoto.isFeatured && featuredCount >= FEATURED_LIMIT) {
      alert(`الحد الأقصى للصور المميزة هو ${FEATURED_LIMIT} صور فقط.`);
      return;
    }
    setPhotoSaving(true);
    try {
      const cropArea = croppedAreaPct || { x: 0, y: 0, width: 100, height: 100 };
      const { data } = await galleryAPI.create({ imageUrl: newPhoto.url.trim(), title: newPhoto.title, isFeatured: newPhoto.isFeatured, cropArea });
      setGallery((prev) => [data, ...prev]);
      setNewPhoto({ url: "", title: "", isFeatured: false });
      resetCrop();
    } catch (err) {
      alert(err?.response?.data?.message || "فشل إضافة الصورة");
    } finally {
      setPhotoSaving(false);
    }
  };

  const handleToggleFeatured = async (photo) => {
    const turningOn = !photo.isFeatured;
    if (turningOn && featuredCount >= FEATURED_LIMIT) {
      alert(`الحد الأقصى للصور المميزة هو ${FEATURED_LIMIT} صور فقط لملء سطر واحد في الصفحة الرئيسية.`);
      return;
    }
    try {
      const { data } = await galleryAPI.update(photo._id, { isFeatured: turningOn });
      setGallery((prev) => prev.map((p) => (p._id === photo._id ? data : p)));
    } catch (err) {
      alert(err?.response?.data?.message || "فشل تحديث الصورة");
    }
  };

  const handleDeletePhoto = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الصورة؟")) return;
    try {
      await galleryAPI.delete(id);
      setGallery((prev) => prev.filter((p) => p._id !== id));
    } catch {
      alert("فشل حذف الصورة");
    }
  };

  const fetchTrips = async () => {
    try {
      const { data } = await tripsAPI.getAdminAll();
      setTrips(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const { data } = await applicationsAPI.getAll();
      setApplications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setAppLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
    fetchApplications();
    fetchGallery();
  }, []);

  useEffect(() => {
    setPendingStatus(null);
    setStatusReason("");
  }, [selectedApp?._id]);

  const handleDeleteTrip = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الرحلة؟")) return;
    try {
      await tripsAPI.delete(id);
      setTrips(trips.filter((t) => t._id !== id));
    } catch {
      alert("فشل حذف الرحلة");
    }
  };

  const handleUpdateStatus = async (appId, newStatus, notes) => {
    const app = applications.find((a) => a._id === appId);
    const oldStatus = app?.status;
    try {
      const payload = { status: newStatus };
      if (notes !== undefined) payload.adminNotes = notes;
      await applicationsAPI.updateStatus(appId, payload);

      const newHistoryEntry = { status: newStatus, reason: notes || "", changedBy: admin?.username || admin?.name || "", changedAt: new Date().toISOString() };
      const localUpdate = {
        status: newStatus,
        ...(notes !== undefined && { adminNotes: notes }),
        history: [...(app.history || []), newHistoryEntry],
      };
      setApplications((prev) => prev.map((a) => (a._id === appId ? { ...a, ...localUpdate } : a)));
      if (selectedApp?._id === appId) {
        setSelectedApp((prev) => ({ ...prev, ...localUpdate }));
      }
      if (oldStatus !== newStatus) {
        const tripId = app?.trip?._id || app?.trip;
        if (newStatus === "confirmed" && oldStatus !== "confirmed") {
          setTrips((prev) => prev.map((t) => t._id === tripId ? { ...t, bookedSpots: (t.bookedSpots || 0) + 1 } : t));
        } else if (oldStatus === "confirmed" && newStatus !== "confirmed") {
          setTrips((prev) => prev.map((t) => t._id === tripId ? { ...t, bookedSpots: Math.max(0, (t.bookedSpots || 0) - 1) } : t));
        }
      }
    } catch {
      alert("فشل تحديث الحالة");
    }
  };

  const STATUSES_NEED_REASON = ["reviewed", "accepted", "rejected"];

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
    } catch {
      alert("فشل حذف الطلب");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/admin");
  };

  const pendingCount = applications.filter((a) => a.status === "pending").length;
  const confirmedCount = applications.filter((a) => a.status === "confirmed").length;
  const filteredApps = applications.filter((a) => a.status === appFolder);

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="admin-header-inner">
          <h1 className="admin-logo">رُحى <span>Admin</span></h1>
          <div className="admin-header-actions">
            <span className="admin-name">مرحباً، {admin?.username || admin?.name}</span>
            <Link to="/admin/calculator" className="btn btn-secondary">🧮 حاسبة التكاليف</Link>
            <button className="btn btn-secondary admin-logout" onClick={handleLogout}>
              خروج
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-container">

          <div className="admin-stats">
            <div className="stat-card">
              <div className="stat-number">{trips.length}</div>
              <div className="stat-label">إجمالي الرحلات</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{trips.filter((t) => t.isActive).length}</div>
              <div className="stat-label">رحلات نشطة</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{applications.filter((a) => a.status !== "confirmed" && a.status !== "rejected").length}</div>
              <div className="stat-label">إجمالي الطلبات</div>
            </div>
            <div className="stat-card" style={{ borderColor: pendingCount > 0 ? "#f59e0b" : "" }}>
              <div className="stat-number" style={{ color: pendingCount > 0 ? "#f59e0b" : "" }}>
                {pendingCount}
              </div>
              <div className="stat-label">طلبات جديدة</div>
            </div>
          </div>

          <div className="admin-tabs">
            <button
              className={`admin-tab ${activeTab === "trips" ? "active" : ""}`}
              onClick={() => setActiveTab("trips")}
            >
              ✈️ الرحلات
            </button>
            <button
              className={`admin-tab ${activeTab === "applications" ? "active" : ""}`}
              onClick={() => setActiveTab("applications")}
            >
              📩 طلبات التسجيل
              {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
            </button>
            <button
              className={`admin-tab ${activeTab === "gallery" ? "active" : ""}`}
              onClick={() => setActiveTab("gallery")}
            >
              🖼 المعرض
            </button>
            <button
              className={`admin-tab ${activeTab === "subscribers" ? "active" : ""}`}
              onClick={() => { setActiveTab("subscribers"); fetchSubscribers(subscriberSearch, subscriberCountry, subscriberGender); fetchSubscriberCountries(); }}
            >
              👥 قاعدة المشتركين
            </button>
            <button
              className={`admin-tab ${activeTab === "policies" ? "active" : ""}`}
              onClick={() => { setActiveTab("policies"); fetchPolicyVersions(); }}
            >
              📜 نسخ السياسات
              {policyVersions.length > 0 && <span className="tab-badge">{policyVersions.length}</span>}
            </button>
          </div>

          {activeTab === "trips" && (
            <div>
              <div className="admin-section-header">
                <h2>الرحلات</h2>
                <Link to="/admin/trips/new" className="btn btn-primary">+ أضف رحلة جديدة</Link>
              </div>
              {loading ? (
                <div className="page-loading"><div className="spinner" /></div>
              ) : trips.length === 0 ? (
                <div className="admin-empty">
                  <p>لا توجد رحلات بعد.</p>
                  <Link to="/admin/trips/new" className="btn btn-primary">أضف أول رحلة</Link>
                </div>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>الرحلة</th>
                        <th>الوجهة</th>
                        <th>المدة</th>
                        <th>السعر</th>
                        <th>الحالة</th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trips.map((trip) => {
                        const available = (trip.totalSpots || 0) - (trip.bookedSpots || 0);
                        return (
                        <tr key={trip._id}>
                          <td>
                            <div className="trip-table-title">{trip.title}</div>
                            {trip.isFeatured && <span className="badge badge-primary">مميزة</span>}
                          </td>
                          <td>{trip.destination}</td>
                          <td>{trip.duration} أيام</td>
                          <td>{trip.price} {trip.currency}</td>
                          <td>
                            <span className={`badge ${trip.isActive ? "badge-success" : "badge-inactive"}`}>
                              {trip.isActive ? "نشطة" : "مخفية"}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <Link to={`/admin/trips/${trip._id}/stats`} className="btn-action" style={{ background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe" }}>📊 إحصائيات</Link>
                              <Link to={`/admin/trips/edit/${trip._id}`} className="btn-action btn-edit">تعديل</Link>
                              <button className="btn-action btn-delete" onClick={() => handleDeleteTrip(trip._id)}>حذف</button>
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

          {activeTab === "applications" && (
            <div>
              {/* مجلدات الحالات */}
              <div className="app-folders">
                {APP_FOLDERS.map((folder) => {
                  const count = applications.filter((a) => a.status === folder.key).length;
                  return (
                    <button
                      key={folder.key}
                      className={`app-folder-btn ${appFolder === folder.key ? "app-folder-btn--active" : ""}`}
                      style={{
                        "--f-color": STATUS_MAP[folder.key].color,
                        "--f-bg": STATUS_MAP[folder.key].bg,
                      }}
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
                      {APP_FOLDERS.find((f) => f.key === appFolder)?.label}
                      {" "}({filteredApps.length})
                    </h2>
                  </div>
                  {appLoading ? (
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
                              <span className="app-status-badge" style={{ color: s.color, background: s.bg }}>
                                {s.label}
                              </span>
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
                    <div className="app-detail-empty">
                      <p>👈 اختر طلباً لعرض تفاصيله</p>
                    </div>
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
                          <div className="detail-value">
                            {selectedApp.gender === "male" ? "ذكر" : selectedApp.gender === "female" ? "أنثى" : "—"}
                          </div>
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
                              <a
                                href={`https://instagram.com/${selectedApp.instagram.replace(/^@/, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: "#e1306c" }}
                              >
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
                            {new Date(selectedApp.createdAt).toLocaleDateString("ar-SA", {
                              year: "numeric", month: "long", day: "numeric"
                            })}
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
                          <button
                            className="btn btn-secondary"
                            style={{ width: "100%" }}
                            onClick={() => setHistoryModalOpen(true)}
                          >
                            📋 سجّل الملف
                          </button>
                        </div>
                      )}

                      <div className="app-detail-section">
                        <div className="detail-label">نقل الطلب إلى</div>
                        <div className="status-buttons">
                          {Object.entries(STATUS_MAP).map(([key, val]) => {
                            const isConfirmedLocked = key === "confirmed" && selectedApp.status !== "accepted";
                            const isPendingLocked = key === "pending" && selectedApp.status !== "pending";
                            return (
                              <button
                                key={key}
                                className={`status-btn ${selectedApp.status === key ? "status-btn-active" : ""} ${isConfirmedLocked || isPendingLocked ? "status-btn-locked" : ""}`}
                                style={{ "--s-color": val.color, "--s-bg": val.bg }}
                                disabled={isConfirmedLocked || isPendingLocked || selectedApp.status === key}
                                title={isConfirmedLocked ? "يجب أن يكون الطلب في قسم 'تم القبول' أولاً" : isPendingLocked ? "لا يمكن العودة إلى قيد المراجعة" : ""}
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
                            <div className="status-reason-title">
                              سبب النقل إلى "{pendingStatus.label}" *
                            </div>
                            <textarea
                              className="status-reason-textarea"
                              value={statusReason}
                              onChange={(e) => setStatusReason(e.target.value)}
                              placeholder="اكتب السبب هنا..."
                              rows={3}
                              autoFocus
                            />
                            <div className="status-reason-actions">
                              <button
                                className="btn-reason-confirm"
                                style={{ background: pendingStatus.color }}
                                onClick={handleConfirmWithReason}
                                disabled={!statusReason.trim()}
                              >
                                تأكيد النقل
                              </button>
                              <button
                                className="btn btn-secondary"
                                onClick={() => { setPendingStatus(null); setStatusReason(""); }}
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {selectedApp.status === "accepted" && (
                        <div className="app-detail-section">
                          <button
                            className="btn-confirm-deposit"
                            onClick={() => handleUpdateStatus(selectedApp._id, "confirmed")}
                          >
                            💰 تأكيد دفع العربون — تسجيل رسمي
                          </button>
                        </div>
                      )}

                      <ClientNotesSection
                        app={selectedApp}
                        onSave={(notes) => {
                          applicationsAPI.updateStatus(selectedApp._id, { clientNotes: notes })
                            .then(() => {
                              const update = { clientNotes: notes };
                              setApplications((prev) => prev.map((a) => a._id === selectedApp._id ? { ...a, ...update } : a));
                              setSelectedApp((prev) => ({ ...prev, ...update }));
                            })
                            .catch(() => alert("فشل حفظ الملاحظة"));
                        }}
                      />

                      <div className="app-detail-actions">
                        <a
                          href={`https://wa.me/${selectedApp.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-primary"
                        >
                          📱 واتساب
                        </a>
                        <a href={`mailto:${selectedApp.email}`} className="btn btn-secondary">
                          📧 إيميل
                        </a>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDeleteApp(selectedApp._id)}
                          style={{ padding: "10px 16px" }}
                        >
                          حذف الطلب
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "gallery" && (
            <div>
              <div className="admin-section-header">
                <h2>معرض الصور</h2>
                <span className="gallery-featured-counter">
                  الصور المميزة: <strong>{featuredCount}</strong> / {FEATURED_LIMIT}
                  {featuredCount >= FEATURED_LIMIT && (
                    <span className="gallery-featured-full"> — الحد الأقصى مكتمل</span>
                  )}
                </span>
              </div>

              <div className="gallery-add-card">
                <h3>إضافة صورة جديدة</h3>
                <form className="gallery-add-form" onSubmit={handleAddPhoto}>

                  <input
                    type="url"
                    placeholder="رابط الصورة (URL)..."
                    value={newPhoto.url}
                    onChange={(e) => setNewPhoto({ ...newPhoto, url: e.target.value })}
                    required
                  />

                  {newPhoto.url.trim() && (
                    cropMode ? (
                      <div className="gallery-crop-wrap">
                        <div className="gallery-crop-box">
                          <Cropper
                            image={newPhoto.url.trim()}
                            crop={crop}
                            zoom={zoom}
                            aspect={10 / 7}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                          />
                        </div>
                        <div className="gallery-crop-controls">
                          <span>🔍 تكبير</span>
                          <input
                            type="range" min={1} max={3} step={0.05}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                          />
                          <button type="button" className="btn btn-primary gallery-crop-confirm" onClick={() => setCropMode(false)}>
                            ✓ تأكيد الاختيار
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="gallery-crop-preview" onClick={() => setCropMode(true)}>
                        <img
                          src={newPhoto.url.trim()}
                          alt="preview"
                          style={getCropImgStyle(croppedAreaPct)}
                          onError={(e) => e.target.style.display = "none"}
                        />
                        <div className="gallery-crop-hint">✂️ اضغط لتعديل الاقتصاص</div>
                      </div>
                    )
                  )}

                  <input
                    type="text"
                    placeholder="عنوان الصورة (اختياري)..."
                    value={newPhoto.title}
                    onChange={(e) => setNewPhoto({ ...newPhoto, title: e.target.value })}
                  />

                  <label
                    className={`gallery-featured-label ${featuredCount >= FEATURED_LIMIT && !newPhoto.isFeatured ? "gallery-featured-label--disabled" : ""}`}
                    title={featuredCount >= FEATURED_LIMIT && !newPhoto.isFeatured ? `الحد الأقصى ${FEATURED_LIMIT} صور مميزة` : ""}
                  >
                    <input
                      type="checkbox"
                      checked={newPhoto.isFeatured}
                      disabled={featuredCount >= FEATURED_LIMIT && !newPhoto.isFeatured}
                      onChange={(e) => {
                        if (e.target.checked && featuredCount >= FEATURED_LIMIT) {
                          alert(`الحد الأقصى للصور المميزة هو ${FEATURED_LIMIT} صور فقط.`);
                          return;
                        }
                        setNewPhoto({ ...newPhoto, isFeatured: e.target.checked });
                      }}
                    />
                    صورة مميزة (تظهر في الصفحة الرئيسية)
                  </label>

                  <button type="submit" className="btn btn-primary" disabled={photoSaving || !newPhoto.url.trim()}>
                    {photoSaving ? "جاري الإضافة..." : "إضافة الصورة"}
                  </button>
                </form>
              </div>

              {galleryLoading ? (
                <div className="page-loading"><div className="spinner" /></div>
              ) : gallery.length === 0 ? (
                <div className="admin-empty"><p>لا توجد صور في المعرض بعد.</p></div>
              ) : (
                <div className="gallery-admin-grid">
                  {gallery.map((photo) => (
                    <div key={photo._id} className={`gallery-admin-item ${photo.isFeatured ? "gallery-admin-item--featured" : ""}`}>
                      <div className="gallery-admin-thumb">
                        <img src={photo.imageUrl} alt={photo.title || "صورة"} style={getCropImgStyle(photo.cropArea)} />
                        {photo.isFeatured && (
                          <span className="gallery-featured-badge">⭐ مميزة</span>
                        )}
                      </div>
                      <div className="gallery-admin-info">
                        <span className="gallery-admin-title">
                          {photo.title || <em style={{ opacity: 0.5 }}>بدون عنوان</em>}
                        </span>
                        <label
                          className={`gallery-toggle-label ${!photo.isFeatured && featuredCount >= FEATURED_LIMIT ? "gallery-toggle-label--disabled" : ""}`}
                          title={!photo.isFeatured && featuredCount >= FEATURED_LIMIT ? `الحد الأقصى ${FEATURED_LIMIT} صور مميزة` : ""}
                        >
                          <input
                            type="checkbox"
                            checked={photo.isFeatured}
                            disabled={!photo.isFeatured && featuredCount >= FEATURED_LIMIT}
                            onChange={() => handleToggleFeatured(photo)}
                          />
                          صورة مميزة
                        </label>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDeletePhoto(photo._id)}
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "policies" && (
            <div>
              <div className="admin-section-header">
                <h2>نسخ السياسات</h2>
                <button
                  className="btn btn-primary"
                  onClick={handleSavePolicyVersion}
                  disabled={savingPolicy}
                >
                  {savingPolicy ? "جاري الحفظ..." : "💾 حفظ النسخة الحالية"}
                </button>
              </div>

              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", fontSize: "14px", color: "#92400e" }}>
                ⚠️ اضغط "حفظ النسخة الحالية" كلما عدّلت على السياسات لتوثيق التغييرات.
              </div>

              {policyVersionsLoading ? (
                <div className="page-loading"><div className="spinner" /></div>
              ) : policyVersions.length === 0 ? (
                <div className="admin-empty"><p>لا توجد نسخ محفوظة بعد.</p></div>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>اسم النسخة</th>
                        <th>تاريخ الحفظ</th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {policyVersions.map((v, idx) => (
                        <>
                          <tr key={v._id} style={{ background: selectedPolicyVersion?._id === v._id ? "#f0fdf4" : "" }}>
                            <td style={{ color: "#a0aec0", fontSize: "13px" }}>{idx + 1}</td>
                            <td style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "15px", color: "#1a202c" }}>{v.versionName}</td>
                            <td style={{ fontSize: "13px", color: "#718096" }}>
                              {new Date(v.createdAt).toLocaleString("ar-SA", {
                                timeZone: "Asia/Jerusalem",
                                year: "numeric", month: "long", day: "numeric",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </td>
                            <td>
                              <div className="table-actions">
                                <button
                                  className="btn-action"
                                  style={{ background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe" }}
                                  onClick={() => handleViewPolicyVersion(v)}
                                >
                                  {selectedPolicyVersion?._id === v._id ? "إخفاء" : "عرض"}
                                </button>
                                <button
                                  className="btn-action btn-delete"
                                  onClick={() => handleDeletePolicyVersion(v._id)}
                                >
                                  حذف
                                </button>
                              </div>
                            </td>
                          </tr>
                          {selectedPolicyVersion?._id === v._id && (
                            <tr key={`${v._id}-detail`}>
                              <td colSpan={4} style={{ padding: "0 0 16px", background: "#f8fafc" }}>
                                {policyDetailLoading ? (
                                  <div style={{ padding: "20px", textAlign: "center" }}><div className="spinner" /></div>
                                ) : policyVersionDetail ? (
                                  <div style={{ padding: "16px 24px", maxHeight: "400px", overflowY: "auto" }}>
                                    {policyVersionDetail.policies.map((policy, i) => (
                                      <div key={i} style={{ marginBottom: "16px" }}>
                                        <div style={{ fontWeight: 700, color: "#1a202c", marginBottom: "6px", fontSize: "14px" }}>
                                          {policy.icon} {i + 1}. {policy.title}
                                        </div>
                                        <ul style={{ margin: 0, padding: "0 20px", listStyle: "disc" }}>
                                          {policy.points.map((point, j) => (
                                            <li key={j} style={{ fontSize: "13px", color: "#4a5568", marginBottom: "4px", lineHeight: 1.6 }}>
                                              {point}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "subscribers" && (
            <div>
              <div className="admin-section-header">
                <h2>قاعدة المشتركين <span style={{ fontSize: "16px", fontWeight: 400, color: "#718096" }}>({subscribers.length})</span></h2>
                <div></div>
              </div>

              <div style={{ marginBottom: "20px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="ابحث بالاسم أو الهاتف أو الإيميل..."
                  value={subscriberSearch}
                  onChange={(e) => setSubscriberSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchSubscribers(subscriberSearch, subscriberCountry, subscriberGender)}
                  style={{
                    flex: 1,
                    minWidth: "200px",
                    padding: "12px 16px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
                <select
                  value={subscriberGender}
                  onChange={(e) => { setSubscriberGender(e.target.value); fetchSubscribers(subscriberSearch, subscriberCountry, e.target.value); }}
                  style={{
                    padding: "12px 16px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <option value="">👤 الجنس</option>
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
                <select
                  value={subscriberCountry}
                  onChange={(e) => { setSubscriberCountry(e.target.value); fetchSubscribers(subscriberSearch, e.target.value, subscriberGender); }}
                  style={{
                    padding: "12px 16px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    background: "#fff",
                    cursor: "pointer",
                    minWidth: "160px",
                  }}
                >
                  <option value="">🌍 كل الدول</option>
                  {subscriberCountries.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  className="btn btn-primary"
                  onClick={() => fetchSubscribers(subscriberSearch, subscriberCountry, subscriberGender)}
                >
                  🔍 بحث
                </button>
              </div>

              {!subscribersLoading && subscribers.length === 0 ? (
                <div className="admin-empty">
                  <p>{subscriberSearch || subscriberCountry ? "لا توجد نتائج." : "لا يوجد مشتركون بعد."}</p>
                </div>
              ) : (
                <div className="admin-table-wrapper" style={{ opacity: subscribersLoading ? 0.5 : 1, transition: "opacity 0.15s" }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>الاسم</th>
                        <th>الهاتف</th>
                        <th>الإيميل</th>
                        <th>الجنس</th>
                        <th>الإنستغرام</th>
                        <th>البلد</th>
                        <th>نسخة السياسات</th>
                        <th>تاريخ التسجيل</th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.map((sub, idx) => (
                        <tr key={sub._id}>
                          <td style={{ color: "#a0aec0", fontSize: "13px" }}>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{sub.fullName}</td>
                          <td className="ltr">{sub.phone}</td>
                          <td className="ltr" style={{ fontSize: "13px", color: "#4a5568" }}>{sub.email}</td>
                          <td>
                            {sub.gender === "male" ? "ذكر" : sub.gender === "female" ? "أنثى" : <span style={{ color: "#cbd5e0" }}>—</span>}
                          </td>
                          <td className="ltr">
                            {sub.instagram ? (
                              <a
                                href={`https://instagram.com/${sub.instagram.replace(/^@/, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: "#e1306c", fontSize: "13px" }}
                              >
                                {sub.instagram.startsWith("@") ? sub.instagram : `@${sub.instagram}`}
                              </a>
                            ) : <span style={{ color: "#cbd5e0" }}>—</span>}
                          </td>
                          <td>{sub.country}</td>
                          <td style={{ fontFamily: "monospace", fontSize: "12px", color: sub.agreedPolicyVersion ? "#16a34a" : "#cbd5e0" }}>
                            {sub.agreedPolicyVersion || "—"}
                          </td>
                          <td style={{ fontSize: "13px", color: "#718096" }}>
                            {new Date(sub.createdAt).toLocaleDateString("ar-SA", {
                              year: "numeric", month: "long", day: "numeric",
                            })}
                          </td>
                          <td>
                            <div className="table-actions">
                              <a
                                href={`https://wa.me/${sub.phone.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-action"
                                style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
                              >
                                واتساب
                              </a>
                              <button
                                className="btn-action btn-delete"
                                onClick={() => handleDeleteSubscriber(sub._id)}
                              >
                                حذف
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
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

                {/* تاريخ تقديم الطلب */}
                <div style={{ marginBottom: "20px", position: "relative" }}>
                  <div style={{
                    position: "absolute", right: "-21px", top: "4px",
                    width: "10px", height: "10px", borderRadius: "50%",
                    background: "#6b7280", border: "2px solid #fff",
                    boxShadow: "0 0 0 2px #6b7280",
                  }} />
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ background: "#f3f4f6", color: "#6b7280", padding: "3px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: 700 }}>
                      تم إرسال الطلب
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#a0aec0" }}>
                    {new Date(selectedApp.createdAt).toLocaleString("ar-SA", {
                      timeZone: "Asia/Riyadh",
                      year: "numeric", month: "long", day: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </div>
                </div>

                {selectedApp.history.slice(1).map((entry, i) => {
                  const s = STATUS_MAP[entry.status] || { label: entry.status, color: "#6b7280", bg: "#f3f4f6" };
                  const isLast = i === selectedApp.history.slice(1).length - 1;
                  return (
                    <div key={i} style={{ marginBottom: isLast ? 0 : "20px", position: "relative" }}>
                      <div style={{
                        position: "absolute", right: "-21px", top: "4px",
                        width: "10px", height: "10px", borderRadius: "50%",
                        background: s.color, border: "2px solid #fff",
                        boxShadow: `0 0 0 2px ${s.color}`,
                      }} />
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ background: s.bg, color: s.color, padding: "3px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: 700 }}>
                          {s.label}
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#a0aec0", marginBottom: "4px", display: "flex", gap: "10px", alignItems: "center" }}>
                        <span>
                          {new Date(entry.changedAt).toLocaleString("ar-SA", {
                            timeZone: "Asia/Riyadh",
                            year: "numeric", month: "long", day: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                        {entry.changedBy && (
                          <span style={{ background: "#f1f5f9", color: "#475569", padding: "1px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 600 }}>
                            @{entry.changedBy}
                          </span>
                        )}
                      </div>
                      {entry.reason && (
                        <div style={{ fontSize: "13px", color: "#4a5568", background: "#f8fafc", padding: "8px 12px", borderRadius: "6px" }}>
                          {entry.reason}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
