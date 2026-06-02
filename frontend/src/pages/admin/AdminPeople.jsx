import { useState, useEffect } from "react";
import { userAPI } from "../../api";
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

const EditUserModal = ({ user, onClose, onSave }) => {
  const [form, setForm]     = useState({ fullName: user.fullName, email: user.email || "", isVerified: user.isVerified });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) { setError("الاسم مطلوب"); return; }
    setSaving(true); setError("");
    try { await onSave(user._id, form); onClose(); }
    catch (err) { setError(err?.response?.data?.message || "فشل حفظ التغييرات"); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "460px" }}>
        <div className="modal-header">
          <div><h2 className="modal-title">تعديل المستخدم</h2><p className="modal-subtitle">{user.fullName}</p></div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
          {error && <div className="error-msg" style={{ marginBottom: "16px" }}>{error}</div>}
          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="form-label">الاسم الكامل</label>
            <input className="form-input" type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </div>
          {!user.email?.endsWith("@ruha.internal") && (
            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label className="form-label">البريد الإلكتروني</label>
              <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} dir="ltr" />
            </div>
          )}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "0.95rem" }}>
              <input type="checkbox" checked={form.isVerified} onChange={(e) => setForm({ ...form, isVerified: e.target.checked })}
                style={{ width: "16px", height: "16px", accentColor: "var(--color-primary)" }} />
              الحساب مفعّل
            </label>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1, justifyContent: "center" }}>
              {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminPeople = () => {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    userAPI.adminGetAll()
      .then(({ data }) => setUsers(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف "${name}"؟`)) return;
    try { await userAPI.adminDelete(id); setUsers((p) => p.filter((u) => u._id !== id)); }
    catch (err) { alert(err?.response?.data?.message || "فشل الحذف"); }
  };

  const handleBan = async (id) => {
    try {
      const { data } = await userAPI.adminBan(id);
      setUsers((p) => p.map((u) => u._id === id ? { ...u, isBanned: data.isBanned } : u));
    } catch (err) { alert(err?.response?.data?.message || "فشل تغيير الحالة"); }
  };

  const handleSaveEdit = async (id, data) => {
    const { data: updated } = await userAPI.adminUpdate(id, data);
    setUsers((p) => p.map((u) => u._id === id ? updated : u));
  };

  const filtered = users.filter((u) =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  );

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1 className="admin-page-title">مستخدمو الموقع</h1>
        <input type="text" placeholder="🔍 بحث بالاسم أو الإيميل أو الهاتف..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "10px 16px", border: "1.5px solid var(--color-border)", borderRadius: "10px", fontSize: "0.9rem", fontFamily: "inherit", width: "280px", outline: "none", background: "#fff" }} />
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty"><p>لا يوجد مستخدمون.</p></div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>المستخدم</th>
                <th>البريد الإلكتروني</th>
                <th>رقم الهاتف</th>
                <th>طريقة التسجيل</th>
                <th>الحالة</th>
                <th>تاريخ الانضمام</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u._id}>
                  <td style={{ color: "#a0aec0" }}>{i + 1}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {u.avatar
                        ? <img src={u.avatar} alt={u.fullName} referrerPolicy="no-referrer" className="admin-users-avatar" />
                        : <div className="admin-users-avatar">{getInitial(u.fullName)}</div>}
                      <strong>{u.fullName}</strong>
                    </div>
                  </td>
                  <td style={{ direction: "ltr", textAlign: "right", color: "var(--color-text-light)", fontSize: "0.88rem" }}>
                    {u.email?.endsWith("@ruha.internal") ? <span style={{ color: "#cbd5e0" }}>—</span> : (u.email || <span style={{ color: "#cbd5e0" }}>—</span>)}
                  </td>
                  <td style={{ direction: "ltr", textAlign: "right", fontSize: "0.88rem" }}>
                    {u.phone ? <span>{u.phone}</span> : <span style={{ color: "#cbd5e0" }}>—</span>}
                  </td>
                  <td>
                    {u.email?.endsWith("@ruha.internal")
                      ? <span>📱 هاتف</span>
                      : u.googleId
                        ? <span style={{ display: "flex", alignItems: "center", gap: 6 }}><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={16} alt="Google" /> Google</span>
                        : <span style={{ color: "var(--color-text-light)" }}>✉️ إيميل</span>}
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {u.isVerified
                        ? <span style={{ background: "#f0fdf4", color: "#16a34a", padding: "3px 10px", borderRadius: 20, fontSize: "0.8rem", fontWeight: 700 }}>✓ مفعّل</span>
                        : <span style={{ background: "#fef9c3", color: "#b45309", padding: "3px 10px", borderRadius: 20, fontSize: "0.8rem", fontWeight: 700 }}>⏳ غير مفعّل</span>}
                      {u.isBanned && <span style={{ background: "#fef2f2", color: "#dc2626", padding: "3px 10px", borderRadius: 20, fontSize: "0.8rem", fontWeight: 700 }}>🚫 محظور</span>}
                    </div>
                  </td>
                  <td style={{ color: "var(--color-text-light)", fontSize: "0.88rem" }}>{fmtDate(u.createdAt)}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-action btn-edit" onClick={() => setEditingUser(u)}>تعديل</button>
                      <button className="btn-action"
                        style={u.isBanned
                          ? { background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }
                          : { background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}
                        onClick={() => handleBan(u._id)}>
                        {u.isBanned ? "رفع الحظر" : "حظر"}
                      </button>
                      <button className="btn-action btn-delete" onClick={() => handleDelete(u._id, u.fullName)}>حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveEdit} />}
    </AdminLayout>
  );
};

export default AdminPeople;
