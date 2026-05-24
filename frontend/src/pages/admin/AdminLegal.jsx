// src/pages/admin/AdminLegal.jsx
import { useState, useEffect } from "react";
import { policyVersionsAPI } from "../../api";
import { POLICIES } from "../../data/policies";
import AdminLayout from "../../components/admin/AdminLayout";
import "./AdminStyles.css";

const AdminLegal = () => {
  const [versions, setVersions]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [saving, setSaving]                   = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [versionDetail, setVersionDetail]     = useState(null);
  const [detailLoading, setDetailLoading]     = useState(false);

  useEffect(() => {
    policyVersionsAPI.getAll()
      .then(({ data }) => setVersions(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await policyVersionsAPI.save(POLICIES);
      setVersions((prev) => [data, ...prev]);
      alert(`✅ تم حفظ النسخة: ${data.versionName}`);
    } catch (err) {
      alert(err?.response?.data?.message || "فشل حفظ النسخة");
    } finally {
      setSaving(false);
    }
  };

  const handleView = async (v) => {
    if (selectedVersion?._id === v._id) {
      setSelectedVersion(null);
      setVersionDetail(null);
      return;
    }
    setSelectedVersion(v);
    setDetailLoading(true);
    try {
      const { data } = await policyVersionsAPI.getById(v._id);
      setVersionDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه النسخة؟")) return;
    try {
      await policyVersionsAPI.delete(id);
      setVersions((prev) => prev.filter((v) => v._id !== id));
      if (selectedVersion?._id === id) {
        setSelectedVersion(null);
        setVersionDetail(null);
      }
    } catch { alert("فشل حذف النسخة"); }
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1 className="admin-page-title">القانونية</h1>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "جاري الحفظ..." : "💾 حفظ نسخة جديدة"}
        </button>
      </div>

      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", padding: "12px 16px", marginBottom: "24px", fontSize: "14px", color: "#92400e" }}>
        ⚠️ اضغط "حفظ نسخة جديدة" كلما عدّلت على ملف السياسات لتوثيق التغييرات وربطها بطلبات التسجيل.
      </div>

      {/* Current Policies Preview */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "20px 24px", marginBottom: "28px" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#2d3748", marginBottom: "16px" }}>
          📄 السياسات الحالية ({POLICIES.length} بند)
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {POLICIES.map((policy, i) => (
            <div key={i} style={{ background: "#f7fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "8px 14px", fontSize: "0.88rem", color: "#4a5568", fontWeight: 600 }}>
              {policy.icon} {policy.title}
            </div>
          ))}
        </div>
      </div>

      {/* Versions Table */}
      <div className="admin-section-header">
        <h2>النسخ المحفوظة ({versions.length})</h2>
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : versions.length === 0 ? (
        <div className="admin-empty"><p>لا توجد نسخ محفوظة بعد. اضغط "حفظ نسخة جديدة" لتوثيق السياسات الحالية.</p></div>
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
              {versions.map((v, idx) => (
                <>
                  <tr key={v._id} style={{ background: selectedVersion?._id === v._id ? "#f0fdf4" : "" }}>
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
                          onClick={() => handleView(v)}
                        >
                          {selectedVersion?._id === v._id ? "إخفاء" : "عرض"}
                        </button>
                        <button className="btn-action btn-delete" onClick={() => handleDelete(v._id)}>
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                  {selectedVersion?._id === v._id && (
                    <tr key={`${v._id}-detail`}>
                      <td colSpan={4} style={{ padding: "0 0 16px", background: "#f8fafc" }}>
                        {detailLoading ? (
                          <div style={{ padding: "20px", textAlign: "center" }}><div className="spinner" /></div>
                        ) : versionDetail ? (
                          <div style={{ padding: "16px 24px", maxHeight: "400px", overflowY: "auto" }}>
                            {versionDetail.policies.map((policy, i) => (
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
    </AdminLayout>
  );
};

export default AdminLegal;
