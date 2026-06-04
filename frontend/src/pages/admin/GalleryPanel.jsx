// src/pages/admin/GalleryPanel.jsx

import { useState, useEffect, useCallback } from "react";
import Cropper from "react-easy-crop";
import { getCropImgStyle } from "../../utils/cropStyle";
import { galleryAPI } from "../../api";
import ImageUploader from "../../components/ImageUploader";

const FEATURED_LIMIT = 3;

const EMPTY_FORM = { url: "", title: "", isFeatured: false };

// ─── مكوّن اختيار مصدر الصورة (URL أو رفع) ───────────────────────────────
const ImageSourcePicker = ({ url, onUrlChange, onUploaded, folder = "ruha/gallery" }) => {
  const [mode, setMode] = useState(url ? "url" : "url");

  return (
    <div className="gp-source-picker">
      <div className="gp-source-tabs">
        <button
          type="button"
          className={`gp-source-tab${mode === "url" ? " gp-source-tab--active" : ""}`}
          onClick={() => setMode("url")}
        >
          🔗 رابط URL
        </button>
        <button
          type="button"
          className={`gp-source-tab${mode === "upload" ? " gp-source-tab--active" : ""}`}
          onClick={() => setMode("upload")}
        >
          ☁️ رفع لـ Cloudinary
        </button>
      </div>

      {mode === "url" ? (
        <input
          type="url"
          placeholder="https://..."
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          className="gp-source-url-input"
          style={{ direction: "ltr" }}
        />
      ) : (
        <ImageUploader
          currentUrl={url}
          onUploaded={(newUrl) => { onUploaded(newUrl); setMode("url"); }}
          folder={folder}
          shape="rect"
          placeholder="اضغط أو اسحب صورة للرفع على Cloudinary"
        />
      )}
    </div>
  );
};

// ─── محرر الاقتصاص ────────────────────────────────────────────────────────
const CropEditor = ({ imageUrl, croppedAreaPct, onCropChange }) => {
  const [open, setOpen]   = useState(false);
  const [crop, setCrop]   = useState({ x: 0, y: 0 });
  const [zoom, setZoom]   = useState(1);
  const onComplete = useCallback((pct) => onCropChange(pct), [onCropChange]);

  if (!imageUrl) return null;

  return open ? (
    <div className="gallery-crop-wrap">
      <div className="gallery-crop-box">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={10 / 7}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onComplete}
        />
      </div>
      <div className="gallery-crop-controls">
        <span>🔍 تكبير</span>
        <input
          type="range" min={1} max={3} step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
        />
        <button type="button" className="btn btn-primary gallery-crop-confirm" onClick={() => setOpen(false)}>
          ✓ تأكيد الاقتصاص
        </button>
      </div>
    </div>
  ) : (
    <div className="gallery-crop-preview" onClick={() => setOpen(true)}>
      <img src={imageUrl} alt="preview" style={getCropImgStyle(croppedAreaPct)} onError={(e) => (e.target.style.display = "none")} />
      <div className="gallery-crop-hint">✂️ اضغط لتعديل الاقتصاص</div>
    </div>
  );
};

// ─── الصفحة الرئيسية ──────────────────────────────────────────────────────
const GalleryPanel = () => {
  const [gallery, setGallery]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [formCrop, setFormCrop]   = useState(null);
  const [saving, setSaving]       = useState(false);

  // وضع التعديل
  const [editId, setEditId]       = useState(null);
  const [editForm, setEditForm]   = useState(EMPTY_FORM);
  const [editCrop, setEditCrop]   = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  const featuredCount = gallery.filter((p) => p.isFeatured).length;

  useEffect(() => {
    galleryAPI.getAll()
      .then(({ data }) => setGallery(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── إضافة ────────────────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.url.trim()) return;
    if (form.isFeatured && featuredCount >= FEATURED_LIMIT) {
      alert(`الحد الأقصى للصور المميزة هو ${FEATURED_LIMIT}.`); return;
    }
    setSaving(true);
    try {
      const { data } = await galleryAPI.create({
        imageUrl: form.url.trim(),
        title: form.title,
        isFeatured: form.isFeatured,
        cropArea: formCrop || { x: 0, y: 0, width: 100, height: 100 },
      });
      setGallery((prev) => [data, ...prev]);
      setForm(EMPTY_FORM);
      setFormCrop(null);
    } catch (err) {
      alert(err?.response?.data?.message || "فشل إضافة الصورة");
    } finally { setSaving(false); }
  };

  // ── فتح التعديل ───────────────────────────────────────────────────────────
  const startEdit = (photo) => {
    setEditId(photo._id);
    setEditForm({ url: photo.imageUrl, title: photo.title || "", isFeatured: photo.isFeatured });
    setEditCrop(photo.cropArea || null);
  };

  const cancelEdit = () => { setEditId(null); setEditForm(EMPTY_FORM); setEditCrop(null); };

  // ── حفظ التعديل ──────────────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!editForm.url.trim()) return;
    if (editForm.isFeatured && !gallery.find(p => p._id === editId)?.isFeatured && featuredCount >= FEATURED_LIMIT) {
      alert(`الحد الأقصى للصور المميزة هو ${FEATURED_LIMIT}.`); return;
    }
    setEditSaving(true);
    try {
      const { data } = await galleryAPI.update(editId, {
        imageUrl: editForm.url.trim(),
        title: editForm.title,
        isFeatured: editForm.isFeatured,
        cropArea: editCrop || { x: 0, y: 0, width: 100, height: 100 },
      });
      setGallery((prev) => prev.map((p) => (p._id === editId ? data : p)));
      cancelEdit();
    } catch (err) {
      alert(err?.response?.data?.message || "فشل حفظ التعديل");
    } finally { setEditSaving(false); }
  };

  // ── حذف ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الصورة؟")) return;
    try {
      await galleryAPI.delete(id);
      setGallery((prev) => prev.filter((p) => p._id !== id));
      if (editId === id) cancelEdit();
    } catch { alert("فشل حذف الصورة"); }
  };

  // ── toggle featured ───────────────────────────────────────────────────────
  const handleToggleFeatured = async (photo) => {
    const turningOn = !photo.isFeatured;
    if (turningOn && featuredCount >= FEATURED_LIMIT) {
      alert(`الحد الأقصى للصور المميزة هو ${FEATURED_LIMIT}.`); return;
    }
    try {
      const { data } = await galleryAPI.update(photo._id, { isFeatured: turningOn });
      setGallery((prev) => prev.map((p) => (p._id === photo._id ? data : p)));
    } catch (err) { alert(err?.response?.data?.message || "فشل التحديث"); }
  };

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">
          المعرض
          <span>المميزة: {featuredCount} / {FEATURED_LIMIT}</span>
        </h1>
      </div>

      {/* ── إضافة صورة ── */}
      <div className="gallery-add-card">
        <h3>إضافة صورة جديدة</h3>
        <form className="gallery-add-form" onSubmit={handleAdd}>

          <ImageSourcePicker
            url={form.url}
            onUrlChange={(v) => setForm({ ...form, url: v })}
            onUploaded={(v) => setForm({ ...form, url: v })}
          />

          <CropEditor
            imageUrl={form.url.trim()}
            croppedAreaPct={formCrop}
            onCropChange={setFormCrop}
          />

          <input
            type="text"
            placeholder="عنوان الصورة (اختياري)..."
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <label className={`gallery-featured-label${featuredCount >= FEATURED_LIMIT && !form.isFeatured ? " gallery-featured-label--disabled" : ""}`}>
            <input
              type="checkbox"
              checked={form.isFeatured}
              disabled={featuredCount >= FEATURED_LIMIT && !form.isFeatured}
              onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
            />
            صورة مميزة (تظهر في الصفحة الرئيسية)
          </label>

          <button type="submit" className="btn btn-primary" disabled={saving || !form.url.trim()}>
            {saving ? "جاري الإضافة..." : "إضافة الصورة"}
          </button>
        </form>
      </div>

      {/* ── قائمة الصور ── */}
      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : gallery.length === 0 ? (
        <div className="admin-empty"><p>لا توجد صور في المعرض بعد.</p></div>
      ) : (
        <div className="gallery-admin-grid">
          {gallery.map((photo) => (
            <div key={photo._id} className={`gallery-admin-item${photo.isFeatured ? " gallery-admin-item--featured" : ""}`}>

              {editId === photo._id ? (
                /* ── وضع التعديل ── */
                <div className="gallery-edit-panel">
                  <p className="gallery-edit-label">تعديل الصورة</p>

                  <ImageSourcePicker
                    url={editForm.url}
                    onUrlChange={(v) => setEditForm({ ...editForm, url: v })}
                    onUploaded={(v) => setEditForm({ ...editForm, url: v })}
                  />

                  <CropEditor
                    imageUrl={editForm.url.trim()}
                    croppedAreaPct={editCrop}
                    onCropChange={setEditCrop}
                  />

                  <input
                    type="text"
                    placeholder="العنوان..."
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="gallery-edit-input"
                  />

                  <label className={`gallery-featured-label${!editForm.isFeatured && featuredCount >= FEATURED_LIMIT ? " gallery-featured-label--disabled" : ""}`}>
                    <input
                      type="checkbox"
                      checked={editForm.isFeatured}
                      disabled={!editForm.isFeatured && featuredCount >= FEATURED_LIMIT}
                      onChange={(e) => setEditForm({ ...editForm, isFeatured: e.target.checked })}
                    />
                    صورة مميزة
                  </label>

                  <div className="gallery-edit-actions">
                    <button className="btn btn-primary" onClick={handleSaveEdit} disabled={editSaving || !editForm.url.trim()}>
                      {editSaving ? "جاري الحفظ..." : "حفظ"}
                    </button>
                    <button className="btn-action" onClick={cancelEdit}>إلغاء</button>
                    <button className="btn-action btn-delete" onClick={() => handleDelete(photo._id)}>حذف</button>
                  </div>
                </div>
              ) : (
                /* ── عرض عادي ── */
                <>
                  <div className="gallery-admin-thumb">
                    <img src={photo.imageUrl} alt={photo.title || "صورة"} style={getCropImgStyle(photo.cropArea)} />
                    {photo.isFeatured && <span className="gallery-featured-badge">⭐ مميزة</span>}
                  </div>
                  <div className="gallery-admin-info">
                    <span className="gallery-admin-title">
                      {photo.title || <em style={{ opacity: 0.5 }}>بدون عنوان</em>}
                    </span>
                    <label className={`gallery-toggle-label${!photo.isFeatured && featuredCount >= FEATURED_LIMIT ? " gallery-toggle-label--disabled" : ""}`}>
                      <input
                        type="checkbox"
                        checked={photo.isFeatured}
                        disabled={!photo.isFeatured && featuredCount >= FEATURED_LIMIT}
                        onChange={() => handleToggleFeatured(photo)}
                      />
                      مميزة
                    </label>
                    <button className="btn-action" onClick={() => startEdit(photo)}>تعديل</button>
                    <button className="btn-action btn-delete" onClick={() => handleDelete(photo._id)}>حذف</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default GalleryPanel;
