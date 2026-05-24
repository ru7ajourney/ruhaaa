// src/pages/admin/AdminUsers.jsx
import { useState, useEffect } from "react";
import { userAPI, applicationsAPI } from "../../api";
import AdminLayout from "../../components/admin/AdminLayout";
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

const STATUS_MAP = {
  pending:         { label: "قيد المراجعة",   color: "#f59e0b", bg: "#fffbeb" },
  reviewed:        { label: "تمت المراجعة",   color: "#3b82f6", bg: "#eff6ff" },
  accepted:        { label: "تم القبول",       color: "#16a34a", bg: "#f0fdf4" },
  rejected:        { label: "تم الرفض",        color: "#dc2626", bg: "#fef2f2" },
  payment_pending: { label: "انتظار الدفع",    color: "#7c3aed", bg: "#ede9fe" },
  confirmed:       { label: "مسجّل رسمياً",   color: "#065f46", bg: "#d1fae5" },
};

// ── Edit Modal ─────────────────────────────────────────────
const EditUserModal = ({ user, onClose, onSave }) => {
  const [form, setForm]   = useState({ fullName: user.fullName, email: user.email, isVerified: user.isVerified });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim()) {
      setError("الاسم والإيميل مطلوبان");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(user._id, form);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "فشل حفظ التغييرات");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "460px" }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">تعديل المستخدم</h2>
            <p className="modal-subtitle">{user.fullName}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
          {error && <div className="error-msg" style={{ marginBottom: "16px" }}>{error}</div>}

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="form-label">الاسم الكامل</label>
            <input
              className="form-input"
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="form-label">البريد الإلكتروني</label>
            <input
              className="form-input"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              dir="ltr"
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "0.95rem" }}>
              <input
                type="checkbox"
                checked={form.isVerified}
                onChange={(e) => setForm({ ...form, isVerified: e.target.checked })}
                style={{ width: "16px", height: "16px", accentColor: "var(--color-primary)" }}
              />
              الحساب مفعّل (تحقق من الإيميل)
            </label>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1, justifyContent: "center" }}>
              {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────
const AdminUsers = () => {
  const [tab, setTab]               = useState("site");
  const [users, setUsers]           = useState([]);
  const [applications, setApplications] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [appsLoading, setAppsLoading]   = useState(true);
  const [search, setSearch]         = useState("");
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    userAPI.adminGetAll()
      .then(({ data }) => setUsers(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setUsersLoading(false));

    applicationsAPI.getAll()
      .then(({ data }) => setApplications(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setAppsLoading(false));
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف مستخدم "${name}"؟\nسيتم حذف حسابه نهائياً.`)) return;
    try {
      await userAPI.adminDelete(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      alert(err?.response?.data?.message || "فشل حذف المستخدم");
    }
  };

  const handleBan = async (id) => {
    try {
      const { data } = await userAPI.adminBan(id);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isBanned: data.isBanned } : u));
    } catch (err) {
      alert(err?.response?.data?.message || "فشل تغيير حالة الحساب");
    }
  };

  const handleSaveEdit = async (id, data) => {
    const { data: updated } = await userAPI.adminUpdate(id, data);
    setUsers((prev) => prev.map((u) => (u._id === id ? updated : u)));
  };

  const filteredUsers = users.filter((u) =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredApps = applications.filter((a) =>
    a.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.phone?.includes(search) ||
    a.tripTitle?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1 className="admin-page-title">المستخدمون</h1>
        <input
          type="text"
          placeholder="🔍 بحث بالاسم أو الإيميل..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "10px 16px", border: "1.5px solid var(--color-border)", borderRadius: "10px", fontSize: "0.9rem", fontFamily: "inherit", width: "240px", outline: "none", background: "#fff" }}
        />
      </div>

      {/* Tabs */}
      <div className="admin-tabs" style={{ marginBottom: "24px" }}>
        <button className={`admin-tab ${tab === "site" ? "active" : ""}`} onClick={() => setTab("site")}>
          👤 مستخدمو الموقع
          <span className="tab-badge" style={{ background: "#718096" }}>{users.length}</span>
        </button>
        <button className={`admin-tab ${tab === "applicants" ? "active" : ""}`} onClick={() => setTab("applicants")}>
          📩 مسجّلو الرحلات
          <span className="tab-badge" style={{ background: "#718096" }}>{applications.length}</span>
        </button>
      </div>

      {/* ── Site Users Tab ── */}
      {tab === "site" && (
        <>
          {usersLoading ? (
            <div className="page-loading"><div className="spinner" /></div>
          ) : filteredUsers.length === 0 ? (
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
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => (
                    <tr key={u._id}>
                      <td style={{ color: "#a0aec0" }}>{i + 1}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.fullName} referrerPolicy="no-referrer" className="admin-users-avatar" />
                          ) : (
                            <div className="admin-users-avatar">{getInitial(u.fullName)}</div>
                          )}
                          <strong>{u.fullName}</strong>
                        </div>
                      </td>
                      <td style={{ direction: "ltr", textAlign: "right", color: "var(--color-text-light)" }}>{u.email}</td>
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
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {u.isVerified ? (
                            <span style={{ background: "#f0fdf4", color: "#16a34a", padding: "3px 10px", borderRadius: 20, fontSize: "0.8rem", fontWeight: 700 }}>✓ مفعّل</span>
                          ) : (
                            <span style={{ background: "#fef9c3", color: "#b45309", padding: "3px 10px", borderRadius: 20, fontSize: "0.8rem", fontWeight: 700 }}>⏳ غير مفعّل</span>
                          )}
                          {u.isBanned && (
                            <span style={{ background: "#fef2f2", color: "#dc2626", padding: "3px 10px", borderRadius: 20, fontSize: "0.8rem", fontWeight: 700 }}>🚫 محظور</span>
                          )}
                        </div>
                      </td>
                      <td style={{ color: "var(--color-text-light)", fontSize: "0.88rem" }}>{fmtDate(u.createdAt)}</td>
                      <td>
                        <div className="table-actions">
                          <button className="btn-action btn-edit" onClick={() => setEditingUser(u)}>
                            تعديل
                          </button>
                          <button
                            className="btn-action"
                            style={u.isBanned
                              ? { background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }
                              : { background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }
                            }
                            onClick={() => handleBan(u._id)}
                          >
                            {u.isBanned ? "رفع الحظر" : "حظر"}
                          </button>
                          <button className="btn-action btn-delete" onClick={() => handleDelete(u._id, u.fullName)}>
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
        </>
      )}

      {/* ── Trip Applicants Tab ── */}
      {tab === "applicants" && (
        <>
          {appsLoading ? (
            <div className="page-loading"><div className="spinner" /></div>
          ) : filteredApps.length === 0 ? (
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
                  {filteredApps.map((app, i) => {
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
                            <a href={`https://wa.me/${app.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
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
        </>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveEdit}
        />
      )}
    </AdminLayout>
  );
};

export default AdminUsers;
