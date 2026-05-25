// src/components/SuperRoute.jsx
// يحمي المسارات المخصصة للمدير الأعلى فقط
// الأدمن العادي يرى صفحة "غير موجودة" بدلاً من أي تلميح بوجود الصفحة

import { useAuth } from "../context/AuthContext";
import AdminLayout from "./admin/AdminLayout";

const SuperRoute = ({ children }) => {
  const { admin, loading, isSuper } = useAuth();

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!admin || !isSuper) {
    return (
      <AdminLayout>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          textAlign: "center",
          gap: "16px",
        }}>
          <div style={{ fontSize: "5rem", lineHeight: 1 }}>404</div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-secondary, #2d3748)", margin: 0 }}>
            الصفحة غير موجودة
          </h2>
          <p style={{ color: "var(--color-text-light, #718096)", margin: 0, fontSize: "0.95rem" }}>
            الرابط الذي أدخلته غير موجود أو تم نقله.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return children;
};

export default SuperRoute;
