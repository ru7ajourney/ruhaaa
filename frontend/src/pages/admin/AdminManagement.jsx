// src/pages/admin/AdminManagement.jsx
// إدارة الأدمنز — متاحة للمدير الأعلى فقط

import { useState, useEffect, useRef } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { adminsAPI, authAPI } from "../../api";
import { useAuth } from "../../context/AuthContext";
import "./AdminManagement.css";

const EMPTY_FORM = { name: "", username: "", email: "", password: "", role: "admin" };

const AdminManagement = () => {
  const { admin: currentAdmin } = useAuth();
  const [admins, setAdmins]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null); // null | { mode: "add" | "edit", data }
  const [form, setForm]       = useState(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null); // id to delete

  // Ping only while this page is open
  useEffect(() => {
    const lastPing = { current: 0 };
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastPing.current < 60_000) return;
      lastPing.current = now;
      authAPI.ping().catch(() => {});
    };
    const events = ["click", "keydown", "mousemove", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, handleActivity));
  }, []);

  const loadAdmins = async () => {
    try {
      const { data } = await adminsAPI.getAll();
      setAdmins(data.admins);
    } catch {
      setError("فشل تحميل الأدمنز");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAdmins(); }, []);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setError("");
    setModal({ mode: "add" });
  };

  const openEdit = (adm) => {
    setForm({
      name: adm.name || "",
      username: adm.username || "",
      email: adm.email || "",
      password: "",
      role: adm.role || "admin",
    });
    setError("");
    setModal({ mode: "edit", id: adm.id || adm._id });
  };

  const closeModal = () => { setModal(null); setError(""); };

  const handleSave = async () => {
    setError("");
    if (!form.email || !form.username) {
      setError("الإيميل واسم المستخدم مطلوبان");
      return;
    }
    if (modal.mode === "add" && !form.password) {
      setError("كلمة المرور مطلوبة للأدمن الجديد");
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;

      if (modal.mode === "add") {
        await adminsAPI.create(payload);
      } else {
        await adminsAPI.update(modal.id, payload);
      }
      await loadAdmins();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || "حدث خطأ، حاول مجدداً");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminsAPI.delete(id);
      setAdmins((prev) => prev.filter((a) => (a.id || a._id) !== id));
    } catch (err) {
      alert(err.response?.data?.message || "فشل حذف الأدمن");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const isSelf = (adm) => (adm.id || adm._id) === currentAdmin?.id;

  const isOnline = (lastSeen) => {
    if (!lastSeen) return false;
    return Date.now() - new Date(lastSeen).getTime() < 2 * 60 * 1000;
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return "لم يدخل بعد";
    const diff = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 1000);
    if (diff < 60) return "الآن";
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    return `منذ ${Math.floor(diff / 86400)} يوم`;
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1 className="admin-page-title">إدارة المديرين</h1>
        <button className="adm-add-btn" onClick={openAdd}>+ إضافة مدير</button>
      </div>

      {loading ? (
        <div className="adm-loading">جارٍ التحميل…</div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>اسم المستخدم</th>
                <th>الإيميل</th>
                <th>الصلاحية</th>
                <th>آخر ظهور</th>
                <th>تاريخ الإنشاء</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {admins.map((adm) => (
                <tr key={adm.id || adm._id} className={isSelf(adm) ? "adm-row--self" : ""}>
                  <td>
                    {adm.name}
                    {isSelf(adm) && <span className="adm-self-tag">أنت</span>}
                  </td>
                  <td>{adm.username}</td>
                  <td dir="ltr">{adm.email}</td>
                  <td>
                    <span className={`adm-role-badge adm-role-badge--${adm.role}`}>
                      {adm.role === "super" ? "مدير أعلى" : "مدير عادي"}
                    </span>
                  </td>
                  <td>
                    <span className="adm-lastseen">
                      <span className={`adm-online-dot ${isOnline(adm.lastSeen) ? "adm-online-dot--on" : ""}`} />
                      {formatLastSeen(adm.lastSeen)}
                    </span>
                  </td>
                  <td>{new Date(adm.createdAt).toLocaleDateString("ar-IL")}</td>
                  <td className="adm-actions">
                    <button className="adm-btn adm-btn--edit" onClick={() => openEdit(adm)}>تعديل</button>
                    {!isSelf(adm) && (
                      <button className="adm-btn adm-btn--delete" onClick={() => setDeleteConfirm(adm.id || adm._id)}>حذف</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {admins.length === 0 && (
            <div className="adm-empty">لا يوجد أدمنز حتى الآن</div>
          )}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {modal && (
        <div className="adm-modal-overlay" onClick={closeModal}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h2>{modal.mode === "add" ? "إضافة مدير جديد" : "تعديل المدير"}</h2>
              <button className="adm-modal-close" onClick={closeModal}>✕</button>
            </div>

            <div className="adm-modal-body">
              {error && <div className="adm-error">{error}</div>}

              <div className="adm-form-grid">
                <label className="adm-label">
                  الاسم
                  <input
                    className="adm-input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="الاسم الكامل"
                  />
                </label>
                <label className="adm-label">
                  اسم المستخدم *
                  <input
                    className="adm-input"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="username"
                    dir="ltr"
                  />
                </label>
                <label className="adm-label">
                  الإيميل *
                  <input
                    className="adm-input"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="admin@example.com"
                    dir="ltr"
                  />
                </label>
                <label className="adm-label">
                  كلمة المرور {modal.mode === "edit" && <span className="adm-optional">(اتركها فارغة للإبقاء)</span>}
                  <input
                    className="adm-input"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={modal.mode === "add" ? "كلمة المرور" : "••••••••"}
                    dir="ltr"
                  />
                </label>
                <label className="adm-label adm-label--full">
                  الصلاحية
                  {modal.mode === "edit" && modal.id && admins.find((a) => (a.id || a._id) === modal.id)?.role === "super" ? (
                    <div className="adm-role-locked">
                      <span className="adm-role-badge adm-role-badge--super">مدير أعلى</span>
                      <span className="adm-role-locked-note">لا يمكن تغيير صلاحية المدير الأعلى</span>
                    </div>
                  ) : (
                    <div className="adm-role-group">
                      <button
                        type="button"
                        className={`adm-role-btn ${form.role === "admin" ? "adm-role-btn--active" : ""}`}
                        onClick={() => setForm({ ...form, role: "admin" })}
                      >
                        مدير عادي
                      </button>
                      <button
                        type="button"
                        className={`adm-role-btn adm-role-btn--super ${form.role === "super" ? "adm-role-btn--active" : ""}`}
                        onClick={() => setForm({ ...form, role: "super" })}
                      >
                        مدير أعلى
                      </button>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="adm-modal-footer">
              <button className="adm-btn adm-btn--cancel" onClick={closeModal} disabled={saving}>إلغاء</button>
              <button className="adm-btn adm-btn--save" onClick={handleSave} disabled={saving}>
                {saving ? "جارٍ الحفظ…" : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteConfirm && (
        <div className="adm-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="adm-modal adm-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h2>تأكيد الحذف</h2>
              <button className="adm-modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>
            <div className="adm-modal-body">
              <p className="adm-confirm-text">هل أنت متأكد من حذف هذا الأدمن؟ لا يمكن التراجع عن هذا الإجراء.</p>
            </div>
            <div className="adm-modal-footer">
              <button className="adm-btn adm-btn--cancel" onClick={() => setDeleteConfirm(null)}>إلغاء</button>
              <button className="adm-btn adm-btn--delete" onClick={() => handleDelete(deleteConfirm)}>حذف نهائياً</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminManagement;
