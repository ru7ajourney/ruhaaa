// src/pages/admin/Dashboard.jsx
// الداشبورد الرئيسي للآدمن - رحلات + طلبات التسجيل

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { tripsAPI, applicationsAPI } from "../../api";
import { useAuth } from "../../context/AuthContext";
import "./AdminStyles.css";

const STATUS_MAP = {
  pending:  { label: "قيد المراجعة", color: "#f59e0b", bg: "#fffbeb" },
  reviewed: { label: "تمت المراجعة", color: "#3b82f6", bg: "#eff6ff" },
  accepted: { label: "مقبول ✅",      color: "#16a34a", bg: "#f0fdf4" },
  rejected: { label: "مرفوض ❌",      color: "#dc2626", bg: "#fef2f2" },
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("trips");
  const [trips, setTrips] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appLoading, setAppLoading] = useState(true);

  const { admin, logout } = useAuth();
  const navigate = useNavigate();

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
  }, []);

  const handleDeleteTrip = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الرحلة؟")) return;
    try {
      await tripsAPI.delete(id);
      setTrips(trips.filter((t) => t._id !== id));
    } catch {
      alert("فشل حذف الرحلة");
    }
  };

  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      await applicationsAPI.updateStatus(appId, { status: newStatus });
      setApplications((prev) =>
        prev.map((a) => (a._id === appId ? { ...a, status: newStatus } : a))
      );
      if (selectedApp?._id === appId) {
        setSelectedApp((prev) => ({ ...prev, status: newStatus }));
      }
    } catch {
      alert("فشل تحديث الحالة");
    }
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

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="admin-header-inner">
          <h1 className="admin-logo">رُحى <span>Admin</span></h1>
          <div className="admin-header-actions">
            <span className="admin-name">مرحباً، {admin?.name}</span>
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
              <div className="stat-number">{applications.length}</div>
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
                      {trips.map((trip) => (
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
                              <Link to={`/admin/trips/edit/${trip._id}`} className="btn-action btn-edit">تعديل</Link>
                              <button className="btn-action btn-delete" onClick={() => handleDeleteTrip(trip._id)}>حذف</button>
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

          {activeTab === "applications" && (
            <div className="applications-layout">
              <div className="applications-list">
                <div className="admin-section-header">
                  <h2>طلبات التسجيل ({applications.length})</h2>
                </div>
                {appLoading ? (
                  <div className="page-loading"><div className="spinner" /></div>
                ) : applications.length === 0 ? (
                  <div className="admin-empty"><p>لا توجد طلبات بعد.</p></div>
                ) : (
                  <div className="app-cards">
                    {applications.map((app) => {
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

                    <div className="app-detail-grid">
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

                    <div className="app-detail-section">
                      <div className="detail-label">تغيير حالة الطلب</div>
                      <div className="status-buttons">
                        {Object.entries(STATUS_MAP).map(([key, val]) => (
                          <button
                            key={key}
                            className={`status-btn ${selectedApp.status === key ? "status-btn-active" : ""}`}
                            style={{ "--s-color": val.color, "--s-bg": val.bg }}
                            onClick={() => handleUpdateStatus(selectedApp._id, key)}
                          >
                            {val.label}
                          </button>
                        ))}
                      </div>
                    </div>

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
          )}

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
