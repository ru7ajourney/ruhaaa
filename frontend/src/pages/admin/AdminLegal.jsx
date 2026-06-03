// src/pages/admin/AdminLegal.jsx
import { useState, useEffect } from "react";
import { policyVersionsAPI } from "../../api";
import { POLICIES } from "../../data/policies";
import { PRIVACY_POLICY } from "../../data/privacyPolicy";
import AdminLayout from "../../components/admin/AdminLayout";
import "./AdminStyles.css";

const VersionsTable = ({ versions, loading, selectedVersion, onView, onDelete }) => {
  const [detail, setDetail]       = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const handleView = async (v) => {
    if (selectedVersion?._id === v._id) { onView(null); setDetail(null); return; }
    onView(v);
    setDetailLoading(true);
    try {
      const { data } = await policyVersionsAPI.getById(v._id);
      setDetail(data);
    } catch { } finally { setDetailLoading(false); }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (versions.length === 0) return <div className="admin-empty"><p>لا توجد نسخ محفوظة بعد.</p></div>;

  return (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr><th>#</th><th>اسم النسخة</th><th>تاريخ الحفظ</th><th>الإجراءات</th></tr>
        </thead>
        <tbody>
          {versions.map((v, idx) => (
            <>
              <tr key={v._id} style={{ background: selectedVersion?._id === v._id ? "#f0fdf4" : "" }}>
                <td style={{ color: "#a0aec0", fontSize: "13px" }}>{idx + 1}</td>
                <td style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "15px" }}>{v.versionName}</td>
                <td style={{ fontSize: "13px", color: "#718096" }}>
                  {new Date(v.createdAt).toLocaleString("ar-SA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td>
                  <div className="table-actions">
                    <button className="btn-action" style={{ background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe" }} onClick={() => handleView(v)}>
                      {selectedVersion?._id === v._id ? "إخفاء" : "عرض"}
                    </button>
                    <button className="btn-action btn-delete" onClick={() => onDelete(v._id)}>حذف</button>
                  </div>
                </td>
              </tr>
              {selectedVersion?._id === v._id && (
                <tr key={`${v._id}-detail`}>
                  <td colSpan={4} style={{ padding: "0 0 16px", background: "#f8fafc" }}>
                    {detailLoading ? (
                      <div style={{ padding: "20px", textAlign: "center" }}><div className="spinner" /></div>
                    ) : detail ? (
                      <div style={{ padding: "16px 24px", maxHeight: "400px", overflowY: "auto" }}>
                        {detail.policies.map((policy, i) => (
                          <div key={i} style={{ marginBottom: "16px" }}>
                            <div style={{ fontWeight: 700, color: "#1a202c", marginBottom: "6px", fontSize: "14px" }}>
                              {policy.icon} {i + 1}. {policy.title}
                            </div>
                            <ul style={{ margin: 0, padding: "0 20px", listStyle: "disc" }}>
                              {policy.points.map((point, j) => (
                                <li key={j} style={{ fontSize: "13px", color: "#4a5568", marginBottom: "4px", lineHeight: 1.6 }}>{point}</li>
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
  );
};

const AdminLegal = () => {
  const [generalVersions, setGeneralVersions] = useState([]);
  const [privacyVersions, setPrivacyVersions] = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [savingGeneral, setSavingGeneral]     = useState(false);
  const [savingPrivacy, setSavingPrivacy]     = useState(false);
  const [selectedGeneral, setSelectedGeneral] = useState(null);
  const [selectedPrivacy, setSelectedPrivacy] = useState(null);

  useEffect(() => {
    Promise.all([
      policyVersionsAPI.getAll("general"),
      policyVersionsAPI.getAll("privacy"),
    ]).then(([g, p]) => {
      setGeneralVersions(Array.isArray(g.data) ? g.data : []);
      setPrivacyVersions(Array.isArray(p.data) ? p.data : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSaveGeneral = async () => {
    setSavingGeneral(true);
    try {
      const { data } = await policyVersionsAPI.save(POLICIES, "general");
      setGeneralVersions((prev) => [data, ...prev]);
      alert(`✅ تم حفظ نسخة السياسات العامة: ${data.versionName}`);
    } catch (err) { alert(err?.response?.data?.message || "فشل الحفظ"); }
    finally { setSavingGeneral(false); }
  };

  const handleSavePrivacy = async () => {
    setSavingPrivacy(true);
    try {
      const { data } = await policyVersionsAPI.save(PRIVACY_POLICY, "privacy");
      setPrivacyVersions((prev) => [data, ...prev]);
      alert(`✅ تم حفظ نسخة سياسة الخصوصية: ${data.versionName}`);
    } catch (err) { alert(err?.response?.data?.message || "فشل الحفظ"); }
    finally { setSavingPrivacy(false); }
  };

  const handleDeleteGeneral = async (id) => {
    if (!window.confirm("حذف هذه النسخة؟")) return;
    try {
      await policyVersionsAPI.delete(id);
      setGeneralVersions((prev) => prev.filter((v) => v._id !== id));
      if (selectedGeneral?._id === id) setSelectedGeneral(null);
    } catch { alert("فشل الحذف"); }
  };

  const handleDeletePrivacy = async (id) => {
    if (!window.confirm("حذف هذه النسخة؟")) return;
    try {
      await policyVersionsAPI.delete(id);
      setPrivacyVersions((prev) => prev.filter((v) => v._id !== id));
      if (selectedPrivacy?._id === id) setSelectedPrivacy(null);
    } catch { alert("فشل الحذف"); }
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1 className="admin-page-title">⚖️ القانونية</h1>
      </div>

      {/* ==============================
          الشروط والسياسات العامة
          ============================== */}
      <div style={{ marginBottom: 48 }}>
        <div className="admin-section-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2>📄 الشروط والسياسات العامة</h2>
          <button className="btn btn-primary" onClick={handleSaveGeneral} disabled={savingGeneral}>
            {savingGeneral ? "جاري الحفظ..." : "💾 حفظ نسخة جديدة"}
          </button>
        </div>

        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", padding: "10px 16px", margin: "12px 0 20px", fontSize: "13px", color: "#92400e" }}>
          ⚠️ اضغط "حفظ نسخة جديدة" كلما عدّلت على ملف <code>policies.js</code> لتوثيق التغييرات.
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px 20px", marginBottom: "20px" }}>
          <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#718096", marginBottom: 10 }}>البنود الحالية ({POLICIES.length})</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {POLICIES.map((p, i) => (
              <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 14px", background: "#f7fafc" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "#1a202c", fontSize: "14px", marginBottom: 6 }}>
                  <span>{p.icon}</span><span style={{ color: "#c8622a" }}>{i + 1}.</span><span>{p.title}</span>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
                  {p.points.map((point, j) => (
                    <li key={j} style={{ fontSize: "13px", color: "#4a5568", lineHeight: 1.6, display: "flex", gap: 6 }}>
                      <span style={{ color: "#a0aec0", flexShrink: 0 }}>—</span><span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <VersionsTable
          versions={generalVersions}
          loading={loading}
          selectedVersion={selectedGeneral}
          onView={setSelectedGeneral}
          onDelete={handleDeleteGeneral}
        />
      </div>

      {/* ==============================
          سياسة الخصوصية
          ============================== */}
      <div>
        <div className="admin-section-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2>🔒 سياسة الخصوصية</h2>
          <button className="btn btn-primary" onClick={handleSavePrivacy} disabled={savingPrivacy}>
            {savingPrivacy ? "جاري الحفظ..." : "💾 حفظ نسخة جديدة"}
          </button>
        </div>

        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "10px 16px", margin: "12px 0 20px", fontSize: "13px", color: "#1e40af" }}>
          ℹ️ اضغط "حفظ نسخة جديدة" كلما عدّلت على ملف <code>privacyPolicy.js</code> لتوثيق التغييرات.
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px 20px", marginBottom: "20px" }}>
          <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#718096", marginBottom: 10 }}>البنود الحالية ({PRIVACY_POLICY.length})</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {PRIVACY_POLICY.map((p, i) => (
              <div key={i} style={{ border: "1px solid #bfdbfe", borderRadius: "8px", padding: "10px 14px", background: "#eff6ff" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "#1a202c", fontSize: "14px", marginBottom: 6 }}>
                  <span>{p.icon}</span><span style={{ color: "#1e40af" }}>{i + 1}.</span><span>{p.title}</span>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
                  {p.points.map((point, j) => (
                    <li key={j} style={{ fontSize: "13px", color: "#4a5568", lineHeight: 1.6, display: "flex", gap: 6 }}>
                      <span style={{ color: "#93c5fd", flexShrink: 0 }}>—</span><span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <VersionsTable
          versions={privacyVersions}
          loading={loading}
          selectedVersion={selectedPrivacy}
          onView={setSelectedPrivacy}
          onDelete={handleDeletePrivacy}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminLegal;
