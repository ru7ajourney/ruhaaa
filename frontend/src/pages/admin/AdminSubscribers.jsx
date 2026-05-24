// src/pages/admin/AdminSubscribers.jsx
import { useState, useEffect } from "react";
import { subscribersAPI } from "../../api";
import AdminLayout from "../../components/admin/AdminLayout";
import "./AdminStyles.css";

const AdminSubscribers = () => {
  const [subscribers, setSubscribers]     = useState([]);
  const [loading, setLoading]             = useState(false);
  const [countries, setCountries]         = useState([]);
  const [search, setSearch]               = useState("");
  const [country, setCountry]             = useState("");
  const [gender, setGender]               = useState("");

  const fetchData = async (q = search, c = country, g = gender) => {
    setLoading(true);
    try {
      const [subRes, ctrRes] = await Promise.all([
        subscribersAPI.getAll(q, c, g),
        countries.length === 0 ? subscribersAPI.getCountries() : Promise.resolve({ data: countries }),
      ]);
      setSubscribers(Array.isArray(subRes.data) ? subRes.data : []);
      if (countries.length === 0) setCountries(Array.isArray(ctrRes.data) ? ctrRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المشترك؟")) return;
    try {
      await subscribersAPI.delete(id);
      setSubscribers((prev) => prev.filter((s) => s._id !== id));
    } catch { alert("فشل حذف المشترك"); }
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1 className="admin-page-title">
          المشتركون
          <span>({subscribers.length})</span>
        </h1>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="ابحث بالاسم أو الهاتف أو الإيميل..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchData(search, country, gender)}
          style={{ flex: 1, minWidth: "200px", padding: "11px 16px", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", fontFamily: "inherit", outline: "none" }}
        />
        <select
          value={gender}
          onChange={(e) => { setGender(e.target.value); fetchData(search, country, e.target.value); }}
          style={{ padding: "11px 16px", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", background: "#fff", cursor: "pointer", fontFamily: "inherit" }}
        >
          <option value="">👤 الجنس</option>
          <option value="male">ذكر</option>
          <option value="female">أنثى</option>
        </select>
        <select
          value={country}
          onChange={(e) => { setCountry(e.target.value); fetchData(search, e.target.value, gender); }}
          style={{ padding: "11px 16px", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", background: "#fff", cursor: "pointer", fontFamily: "inherit", minWidth: "160px" }}
        >
          <option value="">🌍 كل الدول</option>
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn btn-primary" onClick={() => fetchData(search, country, gender)}>
          🔍 بحث
        </button>
      </div>

      {/* Table */}
      {!loading && subscribers.length === 0 ? (
        <div className="admin-empty">
          <p>{search || country ? "لا توجد نتائج." : "لا يوجد مشتركون بعد."}</p>
        </div>
      ) : (
        <div className="admin-table-wrapper" style={{ opacity: loading ? 0.5 : 1, transition: "opacity 0.15s" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>الاسم</th>
                <th>الهاتف</th>
                <th>الإيميل</th>
                <th>الجنس</th>
                <th>الإنستغرام</th>
                <th>البلد</th>
                <th>نسخة السياسات</th>
                <th>تاريخ التسجيل</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((sub, idx) => (
                <tr key={sub._id}>
                  <td style={{ color: "#a0aec0", fontSize: "13px" }}>{idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>{sub.fullName}</td>
                  <td className="ltr">{sub.phone}</td>
                  <td className="ltr" style={{ fontSize: "13px", color: "#4a5568" }}>{sub.email}</td>
                  <td>{sub.gender === "male" ? "ذكر" : sub.gender === "female" ? "أنثى" : <span style={{ color: "#cbd5e0" }}>—</span>}</td>
                  <td className="ltr">
                    {sub.instagram ? (
                      <a href={`https://instagram.com/${sub.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" style={{ color: "#e1306c", fontSize: "13px" }}>
                        {sub.instagram.startsWith("@") ? sub.instagram : `@${sub.instagram}`}
                      </a>
                    ) : <span style={{ color: "#cbd5e0" }}>—</span>}
                  </td>
                  <td>{sub.country}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "12px", color: sub.agreedPolicyVersion ? "#16a34a" : "#cbd5e0" }}>
                    {sub.agreedPolicyVersion || "—"}
                  </td>
                  <td style={{ fontSize: "13px", color: "#718096" }}>
                    {new Date(sub.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}
                  </td>
                  <td>
                    <div className="table-actions">
                      <a
                        href={`https://wa.me/${sub.phone.replace(/\D/g, "")}`}
                        target="_blank" rel="noreferrer"
                        className="btn-action"
                        style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
                      >
                        واتساب
                      </a>
                      <button className="btn-action btn-delete" onClick={() => handleDelete(sub._id)}>حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSubscribers;
