import { useState, useEffect } from "react";
import { applicationsAPI } from "../../api";
import AdminLayout from "../../components/admin/AdminLayout";
import "./AdminStyles.css";

const ARABIC_TO_LATIN = {
  'ا':'A','أ':'A','إ':'A','آ':'A','ب':'B','ت':'T','ث':'T','ج':'J','ح':'H',
  'خ':'K','د':'D','ذ':'D','ر':'R','ز':'Z','س':'S','ش':'S','ص':'S','ض':'D',
  'ط':'T','ظ':'Z','ع':'A','غ':'G','ف':'F','ق':'Q','ك':'K','ل':'L','م':'M',
  'ن':'N','ه':'H','و':'W','ي':'Y','ى':'Y','ة':'T',
};
const getInitial = (name) => { const f = name?.charAt(0) || "?"; return ARABIC_TO_LATIN[f] || f.toUpperCase(); };
const fmtDate = (d) => new Date(d).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });

const STATUS_MAP = {
  pending:         { label: "قيد المراجعة",  color: "#f59e0b", bg: "#fffbeb" },
  reviewed:        { label: "تمت المراجعة",  color: "#3b82f6", bg: "#eff6ff" },
  accepted:        { label: "تم القبول",      color: "#16a34a", bg: "#f0fdf4" },
  rejected:        { label: "تم الرفض",       color: "#dc2626", bg: "#fef2f2" },
  payment_pending: { label: "انتظار الدفع",   color: "#7c3aed", bg: "#ede9fe" },
  confirmed:       { label: "مسجّل رسمياً",  color: "#065f46", bg: "#d1fae5" },
};

const AdminApplicants = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");

  useEffect(() => {
    applicationsAPI.getAll()
      .then(({ data }) => setApplications(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = applications.filter((a) =>
    a.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.phone?.includes(search) ||
    a.tripTitle?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1 className="admin-page-title">مسجّلو الرحلات</h1>
        <input type="text" placeholder="🔍 بحث بالاسم أو الرحلة أو الهاتف..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "10px 16px", border: "1.5px solid var(--color-border)", borderRadius: "10px", fontSize: "0.9rem", fontFamily: "inherit", width: "280px", outline: "none", background: "#fff" }} />
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty"><p>لا توجد طلبات.</p></div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>الاسم</th>
                <th>الإيميل</th>
                <th>الهاتف</th>
                <th>الرحلة</th>
                <th>الحالة</th>
                <th>التاريخ</th>
                <th>التواصل</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app, i) => {
                const s = STATUS_MAP[app.status] || STATUS_MAP.pending;
                return (
                  <tr key={app._id}>
                    <td style={{ color: "#a0aec0" }}>{i + 1}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="admin-users-avatar">{getInitial(app.fullName)}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{app.fullName}</div>
                          <div style={{ fontSize: "0.78rem", color: "#718096" }}>{app.country} - {app.city}</div>
                        </div>
                      </div>
                    </td>
                    <td className="ltr" style={{ color: "var(--color-text-light)", fontSize: "0.88rem" }}>{app.email}</td>
                    <td className="ltr" style={{ fontSize: "0.88rem" }}>{app.phone}</td>
                    <td style={{ fontWeight: 500, fontSize: "0.9rem" }}>{app.tripTitle}</td>
                    <td>
                      <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 100, fontSize: "0.78rem", fontWeight: 700 }}>
                        {s.label}
                      </span>
                    </td>
                    <td style={{ color: "#a0aec0", fontSize: "0.85rem" }}>{fmtDate(app.createdAt)}</td>
                    <td>
                      <div className="table-actions">
                        <a href={`https://wa.me/${app.phone?.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                          className="btn-action" style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
                          واتساب
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminApplicants;
