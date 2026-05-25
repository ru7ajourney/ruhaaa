// src/pages/admin/Dashboard.jsx
// الداشبورد — ملخص سريع

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { tripsAPI, applicationsAPI, subscribersAPI, userAPI } from "../../api";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/admin/AdminLayout";
import "./AdminStyles.css";

const Dashboard = () => {
  const { isSuper } = useAuth();
  const [stats, setStats] = useState({
    trips: 0,
    activeTrips: 0,
    pendingApps: 0,
    confirmedApps: 0,
    totalApps: 0,
    subscribers: 0,
    users: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentApps, setRecentApps] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [tripsRes, appsRes, subsRes, usersRes] = await Promise.allSettled([
          tripsAPI.getAdminAll(),
          applicationsAPI.getAll(),
          subscribersAPI.getAll(),
          userAPI.adminGetAll(),
        ]);

        const trips = tripsRes.status === "fulfilled" ? tripsRes.value.data : [];
        const apps  = appsRes.status  === "fulfilled" ? appsRes.value.data  : [];
        const subs  = subsRes.status  === "fulfilled" ? subsRes.value.data  : [];
        const users = usersRes.status === "fulfilled" ? usersRes.value.data : [];

        setStats({
          trips:        trips.length,
          activeTrips:  trips.filter((t) => t.isActive).length,
          pendingApps:  apps.filter((a) => a.status === "pending").length,
          confirmedApps: apps.filter((a) => a.status === "confirmed").length,
          totalApps:    apps.length,
          subscribers:  subs.length,
          users:        users.length,
        });

        setRecentApps(
          [...apps]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const STATUS_COLORS = {
    pending:         { color: "#f59e0b", bg: "#fffbeb", label: "قيد المراجعة" },
    reviewed:        { color: "#3b82f6", bg: "#eff6ff", label: "تمت المراجعة" },
    accepted:        { color: "#16a34a", bg: "#f0fdf4", label: "تم القبول"    },
    rejected:        { color: "#dc2626", bg: "#fef2f2", label: "تم الرفض"     },
    payment_pending: { color: "#7c3aed", bg: "#ede9fe", label: "انتظار الدفع"  },
    confirmed:       { color: "#065f46", bg: "#d1fae5", label: "مسجّل رسمياً" },
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1 className="admin-page-title">الرئيسية</h1>
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="dash-stats">
            <Link to="/admin/trips" className="dash-stat-card">
              <div className="dash-stat-icon">✈️</div>
              <div className="dash-stat-number">{stats.trips}</div>
              <div className="dash-stat-label">إجمالي الرحلات</div>
              <div className="dash-stat-sub">{stats.activeTrips} نشطة</div>
            </Link>

            <Link
              to="/admin/trips"
              className="dash-stat-card"
              style={stats.pendingApps > 0 ? { borderColor: "#f59e0b", borderWidth: "2px" } : {}}
            >
              <div className="dash-stat-icon">📩</div>
              <div className="dash-stat-number" style={{ color: stats.pendingApps > 0 ? "#f59e0b" : "" }}>
                {stats.pendingApps}
              </div>
              <div className="dash-stat-label">طلبات جديدة</div>
              <div className="dash-stat-sub">{stats.totalApps} إجمالي</div>
            </Link>

            <Link to="/admin/trips" className="dash-stat-card">
              <div className="dash-stat-icon">⭐</div>
              <div className="dash-stat-number" style={{ color: "#065f46" }}>{stats.confirmedApps}</div>
              <div className="dash-stat-label">مسجّلون رسمياً</div>
              <div className="dash-stat-sub">تم تأكيد دفعهم</div>
            </Link>

            <Link to="/admin/users" className="dash-stat-card">
              <div className="dash-stat-icon">👤</div>
              <div className="dash-stat-number">{stats.users}</div>
              <div className="dash-stat-label">مستخدمو الموقع</div>
              <div className="dash-stat-sub">حسابات مسجّلة</div>
            </Link>

            <Link to="/admin/users" className="dash-stat-card">
              <div className="dash-stat-icon">📋</div>
              <div className="dash-stat-number">{stats.subscribers}</div>
              <div className="dash-stat-label">المشتركون</div>
              <div className="dash-stat-sub">من نموذج الاشتراك</div>
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="dash-section">
            <h2 className="dash-section-title">وصول سريع</h2>
            <div className="dash-quick-actions">
              <Link to="/admin/trips/new" className="dash-quick-btn dash-quick-btn--primary">
                <span>+</span> رحلة جديدة
              </Link>
              <Link to="/admin/trips" className="dash-quick-btn">
                📩 مراجعة الطلبات
                {stats.pendingApps > 0 && (
                  <span className="dash-badge">{stats.pendingApps}</span>
                )}
              </Link>
              <Link to="/admin/users" className="dash-quick-btn">👥 المستخدمون</Link>
              {isSuper && (
                <>
                  <Link to="/admin/legal" className="dash-quick-btn">📜 السياسات</Link>
                  <Link to="/admin/calculator" className="dash-quick-btn">🧮 حاسبة التكاليف</Link>
                  <Link to="/admin/admins" className="dash-quick-btn">🛡️ المديرون</Link>
                </>
              )}
            </div>
          </div>

          {/* Recent Applications */}
          {recentApps.length > 0 && (
            <div className="dash-section">
              <div className="dash-section-header">
                <h2 className="dash-section-title">أحدث الطلبات</h2>
                <Link to="/admin/trips" className="dash-view-all">عرض الكل ←</Link>
              </div>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>الاسم</th>
                      <th>الرحلة</th>
                      <th>الحالة</th>
                      <th>التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentApps.map((app) => {
                      const s = STATUS_COLORS[app.status] || STATUS_COLORS.pending;
                      return (
                        <tr key={app._id}>
                          <td style={{ fontWeight: 600 }}>{app.fullName}</td>
                          <td style={{ color: "#718096", fontSize: "0.9rem" }}>{app.tripTitle}</td>
                          <td>
                            <span
                              style={{
                                background: s.bg,
                                color: s.color,
                                padding: "3px 10px",
                                borderRadius: "100px",
                                fontSize: "0.8rem",
                                fontWeight: 700,
                              }}
                            >
                              {s.label}
                            </span>
                          </td>
                          <td style={{ color: "#a0aec0", fontSize: "0.85rem" }}>
                            {new Date(app.createdAt).toLocaleDateString("ar-SA")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
};

export default Dashboard;
