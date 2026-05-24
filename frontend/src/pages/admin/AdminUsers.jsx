import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { userAPI } from "../../api";
import "./AdminStyles.css";

const ARABIC_TO_LATIN = {
  'ا':'A','أ':'A','إ':'A','آ':'A','ب':'B','ت':'T','ث':'T','ج':'J','ح':'H',
  'خ':'K','د':'D','ذ':'D','ر':'R','ز':'Z','س':'S','ش':'S','ص':'S','ض':'D',
  'ط':'T','ظ':'Z','ع':'A','غ':'G','ف':'F','ق':'Q','ك':'K','ل':'L','م':'M',
  'ن':'N','ه':'H','و':'W','ي':'Y','ى':'Y','ة':'T',
};

const getInitial = (name) => {
  const first = name?.charAt(0) || "?";
  return ARABIC_TO_LATIN[first] || first.toUpperCase();
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });

const AdminUsers = () => {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  useEffect(() => {
    userAPI.adminGetAll()
      .then(({ data }) => setUsers(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

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

          {/* رأس الصفحة */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.4rem", color: "var(--color-secondary)" }}>
                👥 المستخدمون
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.88rem", color: "var(--color-text-light)" }}>
                إجمالي {users.length} مستخدم مسجّل
              </p>
            </div>
            <input
              type="text"
              placeholder="🔍 ابحث بالاسم أو الإيميل..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "9px 16px", border: "1.5px solid var(--color-border)",
                borderRadius: 10, fontSize: "0.9rem", fontFamily: "inherit",
                background: "var(--color-white)", width: 260, outline: "none",
              }}
            />
          </div>

          {/* الجدول */}
          {filtered.length === 0 ? (
            <div className="admin-empty"><p>لا يوجد مستخدمون.</p></div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>المستخدم</th>
                    <th>البريد الإلكتروني</th>
                    <th>طريقة التسجيل</th>
                    <th>الحالة</th>
                    <th>تاريخ الانضمام</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr key={u._id}>
                      <td>{i + 1}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt={u.fullName}
                              referrerPolicy="no-referrer"
                              style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{
                              width: 34, height: 34, borderRadius: "50%",
                              background: "var(--color-primary)", color: "#fff",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontWeight: 700, fontSize: "0.85rem", flexShrink: 0,
                            }}>
                              {getInitial(u.fullName)}
                            </div>
                          )}
                          <strong>{u.fullName}</strong>
                        </div>
                      </td>
                      <td style={{ direction: "ltr", textAlign: "right", color: "var(--color-text-light)" }}>
                        {u.email}
                      </td>
                      <td>
                        {u.googleId ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={16} alt="Google" />
                            Google
                          </span>
                        ) : (
                          <span style={{ color: "var(--color-text-light)" }}>✉️ إيميل</span>
                        )}
                      </td>
                      <td>
                        {u.isVerified ? (
                          <span style={{ background: "#f0fdf4", color: "#16a34a", padding: "3px 10px", borderRadius: 20, fontSize: "0.8rem", fontWeight: 700 }}>
                            ✓ مفعّل
                          </span>
                        ) : (
                          <span style={{ background: "#fef9c3", color: "#b45309", padding: "3px 10px", borderRadius: 20, fontSize: "0.8rem", fontWeight: 700 }}>
                            ⏳ غير مفعّل
                          </span>
                        )}
                      </td>
                      <td style={{ color: "var(--color-text-light)", fontSize: "0.88rem" }}>
                        {fmtDate(u.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminUsers;
