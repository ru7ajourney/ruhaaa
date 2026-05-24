// src/pages/admin/TripForm.jsx
// فورم إضافة وتعديل الرحلات

import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { tripsAPI } from "../../api";
import AdminLayout from "../../components/admin/AdminLayout";
import "./AdminStyles.css";

// القيم الافتراضية للفورم
const EMPTY_FORM = {
    title: "",
    slug: "",
    destination: "",
    country: "",
    shortDescription: "",
    description: "",
    duration: "",
    price: "",
    currency: "USD",
    coverImage: "",
    totalSpots: 10,
    isFeatured: false,
    isActive: true,
    includes: [""],
    excludes: [""],
    program: [{ day: 1, title: "", description: "" }],
    availableDates: [{ startDate: "", endDate: "", spotsTotal: 8, spotsTaken: 0 }],
};

const TripForm = () => {
    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const navigate = useNavigate();
    const { id } = useParams(); // إذا موجود = وضع التعديل
    const isEditMode = Boolean(id);

    // في وضع التعديل: جلب بيانات الرحلة
    useEffect(() => {
        if (isEditMode) {
            const fetchTrip = async () => {
                setFetchLoading(true);
                try {
                    const { data } = await tripsAPI.getAdminById(id);
                    // حوّل البيانات لتناسب الفورم
                    setForm({
                        ...data,
                        totalSpots: data.totalSpots ?? 0,
                        includes: data.includes?.length ? data.includes : [""],
                        excludes: data.excludes?.length ? data.excludes : [""],
                        program: data.program?.length
                            ? data.program
                            : [{ day: 1, title: "", description: "" }],
                        availableDates: data.availableDates?.length
                            ? data.availableDates.map((d) => ({
                                ...d,
                                startDate: d.startDate?.split("T")[0] || "",
                                endDate: d.endDate?.split("T")[0] || "",
                            }))
                            : [{ startDate: "", endDate: "", spotsTotal: 8, spotsTaken: 0 }],
                    });
                } catch (err) {
                    setError("فشل تحميل بيانات الرحلة");
                } finally {
                    setFetchLoading(false);
                }
            };
            fetchTrip();
        }
    }, [id]);

    // ==============================
    // تحديث الحقول البسيطة
    // ==============================
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    // ==============================
    // تحديث قوائم (includes, excludes)
    // ==============================
    const handleListChange = (listName, index, value) => {
        setForm((prev) => {
            const newList = [...prev[listName]];
            newList[index] = value;
            return { ...prev, [listName]: newList };
        });
    };

    const addListItem = (listName) => {
        setForm((prev) => ({ ...prev, [listName]: [...prev[listName], ""] }));
    };

    const removeListItem = (listName, index) => {
        setForm((prev) => ({
            ...prev,
            [listName]: prev[listName].filter((_, i) => i !== index),
        }));
    };

    // ==============================
    // تحديث البرنامج اليومي
    // ==============================
    const handleProgramChange = (index, field, value) => {
        setForm((prev) => {
            const newProgram = [...prev.program];
            newProgram[index] = { ...newProgram[index], [field]: value };
            return { ...prev, program: newProgram };
        });
    };

    const addProgramDay = () => {
        setForm((prev) => ({
            ...prev,
            program: [
                ...prev.program,
                { day: prev.program.length + 1, title: "", description: "" },
            ],
        }));
    };

    const removeProgramDay = (index) => {
        setForm((prev) => ({
            ...prev,
            program: prev.program.filter((_, i) => i !== index),
        }));
    };

    // ==============================
    // تحديث التواريخ المتاحة
    // ==============================
    const handleDateChange = (index, field, value) => {
        setForm((prev) => {
            const newDates = [...prev.availableDates];
            newDates[index] = { ...newDates[index], [field]: value };
            return { ...prev, availableDates: newDates };
        });
    };

    const addDate = () => {
        setForm((prev) => ({
            ...prev,
            availableDates: [
                ...prev.availableDates,
                { startDate: "", endDate: "", spotsTotal: 8, spotsTaken: 0 },
            ],
        }));
    };

    const removeDate = (index) => {
        setForm((prev) => ({
            ...prev,
            availableDates: prev.availableDates.filter((_, i) => i !== index),
        }));
    };

    // ==============================
    // إرسال الفورم
    // ==============================
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            // نظّف البيانات الفارغة
            const cleanedForm = {
                ...form,
                includes: form.includes.filter((i) => i.trim() !== ""),
                excludes: form.excludes.filter((i) => i.trim() !== ""),
                program: form.program.filter((d) => d.title.trim() !== ""),
                availableDates: form.availableDates.filter(
                    (d) => d.startDate && d.endDate
                ),
            };

            if (isEditMode) {
                await tripsAPI.update(id, cleanedForm);
                setSuccess("تم تعديل الرحلة بنجاح! ✅");
            } else {
                await tripsAPI.create(cleanedForm);
                setSuccess("تم إضافة الرحلة بنجاح! ✅");
                setForm(EMPTY_FORM); // أفرغ الفورم
            }

            setTimeout(() => navigate("/admin/trips"), 1500);
        } catch (err) {
            setError(err.response?.data?.message || "حدث خطأ أثناء الحفظ");
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading) {
        return (
            <AdminLayout>
                <div className="page-loading"><div className="spinner" /></div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-page-header">
                <h1 className="admin-page-title">
                    {isEditMode ? "تعديل الرحلة" : "إضافة رحلة جديدة"}
                </h1>
                <Link to="/admin/trips" className="btn btn-secondary">← الرحلات</Link>
            </div>
            <div>

                    {error && <div className="error-msg">{error}</div>}
                    {success && <div className="success-msg">{success}</div>}

                    <form onSubmit={handleSubmit} className="trip-form">
                        {/* ==============================
                معلومات أساسية
                ============================== */}
                        <div className="form-section">
                            <h3 className="form-section-title">📋 المعلومات الأساسية</h3>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">عنوان الرحلة *</label>
                                    <input
                                        name="title"
                                        className="form-input"
                                        value={form.title}
                                        onChange={handleChange}
                                        placeholder="مثال: رحلة إيطاليا - تطوع وثقافة"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">الوجهة (عربي) *</label>
                                    <input
                                        name="destination"
                                        className="form-input"
                                        value={form.destination}
                                        onChange={handleChange}
                                        placeholder="مثال: إيطاليا"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">الدولة (إنجليزي) *</label>
                                    <input
                                        name="country"
                                        className="form-input"
                                        value={form.country}
                                        onChange={handleChange}
                                        placeholder="مثال: Italy"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        رابط الرحلة (Slug)
                                        <span style={{ fontWeight: 400, color: "var(--color-text-light)", fontSize: "0.85rem", marginRight: 8 }}>
                                            — مثال: italy-grapesfield
                                        </span>
                                    </label>
                                    <input
                                        name="slug"
                                        className="form-input"
                                        value={form.slug || ""}
                                        onChange={handleChange}
                                        placeholder="italy-grapesfield"
                                        style={{ direction: "ltr", textAlign: "left" }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">مدة الرحلة (أيام) *</label>
                                    <input
                                        name="duration"
                                        type="number"
                                        className="form-input"
                                        value={form.duration}
                                        onChange={handleChange}
                                        min="1"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">إجمالي الأماكن المتاحة *</label>
                                    <input
                                        name="totalSpots"
                                        type="number"
                                        className="form-input"
                                        value={form.totalSpots}
                                        onChange={handleChange}
                                        min="0"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">السعر *</label>
                                    <input
                                        name="price"
                                        type="number"
                                        className="form-input"
                                        value={form.price}
                                        onChange={handleChange}
                                        min="0"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">العملة</label>
                                    <select
                                        name="currency"
                                        className="form-input"
                                        value={form.currency}
                                        onChange={handleChange}
                                    >
                                        <option value="USD">USD - دولار</option>
                                        <option value="ILS">ILS - شيكل</option>
                                        <option value="EUR">EUR - يورو</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">رابط الصورة الرئيسية</label>
                                <input
                                    name="coverImage"
                                    className="form-input"
                                    value={form.coverImage}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">الوصف المختصر * (200 حرف)</label>
                                <input
                                    name="shortDescription"
                                    className="form-input"
                                    value={form.shortDescription}
                                    onChange={handleChange}
                                    maxLength={200}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">وصف الرحلة الكامل *</label>
                                <textarea
                                    name="description"
                                    className="form-input form-textarea"
                                    value={form.description}
                                    onChange={handleChange}
                                    rows={5}
                                    required
                                />
                            </div>

                            <div className="form-checkboxes">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={form.isActive}
                                        onChange={handleChange}
                                    />
                                    نشطة (ظاهرة للزوار)
                                </label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="isFeatured"
                                        checked={form.isFeatured}
                                        onChange={handleChange}
                                    />
                                    مميزة (تظهر في الصفحة الرئيسية)
                                </label>
                            </div>
                        </div>

                        {/* ==============================
                التواريخ المتاحة
                ============================== */}
                        <div className="form-section">
                            <h3 className="form-section-title">📅 التواريخ المتاحة</h3>

                            {form.availableDates.map((date, i) => (
                                <div key={i} className="dynamic-row">
                                    <div className="form-row flex-1">
                                        <div className="form-group">
                                            <label className="form-label">تاريخ البداية</label>
                                            <input
                                                type="date"
                                                className="form-input"
                                                value={date.startDate}
                                                onChange={(e) => handleDateChange(i, "startDate", e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">تاريخ النهاية</label>
                                            <input
                                                type="date"
                                                className="form-input"
                                                value={date.endDate}
                                                onChange={(e) => handleDateChange(i, "endDate", e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">عدد الأماكن</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={date.spotsTotal}
                                                onChange={(e) => handleDateChange(i, "spotsTotal", e.target.value)}
                                                min="1"
                                            />
                                        </div>
                                    </div>
                                    {form.availableDates.length > 1 && (
                                        <button
                                            type="button"
                                            className="btn-remove"
                                            onClick={() => removeDate(i)}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}

                            <button type="button" className="btn-add" onClick={addDate}>
                                + أضف تاريخاً
                            </button>
                        </div>

                        {/* ==============================
                البرنامج اليومي
                ============================== */}
                        <div className="form-section">
                            <h3 className="form-section-title">🗓 البرنامج اليومي</h3>

                            {form.program.map((day, i) => (
                                <div key={i} className="dynamic-row program-row">
                                    <div className="day-num-badge">يوم {day.day}</div>
                                    <div className="form-group flex-1">
                                        <input
                                            className="form-input"
                                            value={day.title}
                                            onChange={(e) => handleProgramChange(i, "title", e.target.value)}
                                            placeholder="عنوان اليوم"
                                        />
                                        <textarea
                                            className="form-input form-textarea"
                                            value={day.description}
                                            onChange={(e) => handleProgramChange(i, "description", e.target.value)}
                                            placeholder="وصف النشاطات"
                                            rows={2}
                                            style={{ marginTop: 8 }}
                                        />
                                    </div>
                                    {form.program.length > 1 && (
                                        <button
                                            type="button"
                                            className="btn-remove"
                                            onClick={() => removeProgramDay(i)}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}

                            <button type="button" className="btn-add" onClick={addProgramDay}>
                                + أضف يوماً
                            </button>
                        </div>

                        {/* ==============================
                يشمل / لا يشمل
                ============================== */}
                        <div className="form-section">
                            <h3 className="form-section-title">✅ السعر يشمل / لا يشمل</h3>

                            <div className="includes-form-grid">
                                {/* يشمل */}
                                <div>
                                    <h4 className="includes-sub">يشمل</h4>
                                    {form.includes.map((item, i) => (
                                        <div key={i} className="inline-input-row">
                                            <input
                                                className="form-input"
                                                value={item}
                                                onChange={(e) => handleListChange("includes", i, e.target.value)}
                                                placeholder="مثال: السكن"
                                            />
                                            {form.includes.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="btn-remove"
                                                    onClick={() => removeListItem("includes", i)}
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="btn-add"
                                        onClick={() => addListItem("includes")}
                                    >
                                        + أضف
                                    </button>
                                </div>

                                {/* لا يشمل */}
                                <div>
                                    <h4 className="includes-sub">لا يشمل</h4>
                                    {form.excludes.map((item, i) => (
                                        <div key={i} className="inline-input-row">
                                            <input
                                                className="form-input"
                                                value={item}
                                                onChange={(e) => handleListChange("excludes", i, e.target.value)}
                                                placeholder="مثال: تذاكر الطيران"
                                            />
                                            {form.excludes.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="btn-remove"
                                                    onClick={() => removeListItem("excludes", i)}
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="btn-add"
                                        onClick={() => addListItem("excludes")}
                                    >
                                        + أضف
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* زر الحفظ */}
                        <div className="form-submit">
                            <button
                                type="submit"
                                className="btn btn-primary form-submit-btn"
                                disabled={loading}
                            >
                                {loading
                                    ? "جاري الحفظ..."
                                    : isEditMode
                                        ? "💾 حفظ التعديلات"
                                        : "✅ إضافة الرحلة"}
                            </button>
                            <Link to="/admin/trips" className="btn btn-secondary">
                                إلغاء
                            </Link>
                        </div>
                    </form>
                </div>
        </AdminLayout>
    );
};

export default TripForm;