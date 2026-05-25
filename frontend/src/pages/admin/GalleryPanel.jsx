// src/pages/admin/GalleryPanel.jsx
// محتوى المعرض — بدون AdminLayout (يُستخدم داخل صفحات أخرى)

import { useState, useEffect, useCallback } from "react";
import Cropper from "react-easy-crop";
import { getCropImgStyle } from "../../utils/cropStyle";
import { galleryAPI } from "../../api";

const FEATURED_LIMIT = 3;

const GalleryPanel = () => {
  const [gallery, setGallery]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [newPhoto, setNewPhoto]     = useState({ url: "", title: "", isFeatured: false });
  const [saving, setSaving]         = useState(false);
  const [cropMode, setCropMode]     = useState(false);
  const [crop, setCrop]             = useState({ x: 0, y: 0 });
  const [zoom, setZoom]             = useState(1);
  const [croppedAreaPct, setCroppedAreaPct] = useState(null);

  const featuredCount = gallery.filter((p) => p.isFeatured).length;

  const onCropComplete = useCallback((pct) => setCroppedAreaPct(pct), []);

  const resetCrop = () => {
    setCropMode(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPct(null);
  };

  useEffect(() => {
    galleryAPI.getAll()
      .then(({ data }) => setGallery(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newPhoto.url.trim()) return;
    if (newPhoto.isFeatured && featuredCount >= FEATURED_LIMIT) {
      alert(`الحد الأقصى للصور المميزة هو ${FEATURED_LIMIT} صور فقط.`);
      return;
    }
    setSaving(true);
    try {
      const cropArea = croppedAreaPct || { x: 0, y: 0, width: 100, height: 100 };
      const { data } = await galleryAPI.create({
        imageUrl: newPhoto.url.trim(),
        title: newPhoto.title,
        isFeatured: newPhoto.isFeatured,
        cropArea,
      });
      setGallery((prev) => [data, ...prev]);
      setNewPhoto({ url: "", title: "", isFeatured: false });
      resetCrop();
    } catch (err) {
      alert(err?.response?.data?.message || "فشل إضافة الصورة");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFeatured = async (photo) => {
    const turningOn = !photo.isFeatured;
    if (turningOn && featuredCount >= FEATURED_LIMIT) {
      alert(`الحد الأقصى للصور المميزة هو ${FEATURED_LIMIT} صور لملء سطر واحد في الصفحة الرئيسية.`);
      return;
    }
    try {
      const { data } = await galleryAPI.update(photo._id, { isFeatured: turningOn });
      setGallery((prev) => prev.map((p) => (p._id === photo._id ? data : p)));
    } catch (err) {
      alert(err?.response?.data?.message || "فشل تحديث الصورة");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الصورة؟")) return;
    try {
      await galleryAPI.delete(id);
      setGallery((prev) => prev.filter((p) => p._id !== id));
    } catch { alert("فشل حذف الصورة"); }
  };

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">
          المعرض
          <span>الصور المميزة: {featuredCount} / {FEATURED_LIMIT}</span>
        </h1>
      </div>

      {/* Add Photo */}
      <div className="gallery-add-card">
        <h3>إضافة صورة جديدة</h3>
        <form className="gallery-add-form" onSubmit={handleAdd}>
          <input
            type="url"
            placeholder="رابط الصورة (URL)..."
            value={newPhoto.url}
            onChange={(e) => setNewPhoto({ ...newPhoto, url: e.target.value })}
            required
          />

          {newPhoto.url.trim() && (
            cropMode ? (
              <div className="gallery-crop-wrap">
                <div className="gallery-crop-box">
                  <Cropper
                    image={newPhoto.url.trim()}
                    crop={crop}
                    zoom={zoom}
                    aspect={10 / 7}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>
                <div className="gallery-crop-controls">
                  <span>🔍 تكبير</span>
                  <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
                  <button type="button" className="btn btn-primary gallery-crop-confirm" onClick={() => setCropMode(false)}>
                    ✓ تأكيد الاختيار
                  </button>
                </div>
              </div>
            ) : (
              <div className="gallery-crop-preview" onClick={() => setCropMode(true)}>
                <img src={newPhoto.url.trim()} alt="preview" style={getCropImgStyle(croppedAreaPct)} onError={(e) => (e.target.style.display = "none")} />
                <div className="gallery-crop-hint">✂️ اضغط لتعديل الاقتصاص</div>
              </div>
            )
          )}

          <input
            type="text"
            placeholder="عنوان الصورة (اختياري)..."
            value={newPhoto.title}
            onChange={(e) => setNewPhoto({ ...newPhoto, title: e.target.value })}
          />

          <label className={`gallery-featured-label ${featuredCount >= FEATURED_LIMIT && !newPhoto.isFeatured ? "gallery-featured-label--disabled" : ""}`}>
            <input
              type="checkbox"
              checked={newPhoto.isFeatured}
              disabled={featuredCount >= FEATURED_LIMIT && !newPhoto.isFeatured}
              onChange={(e) => {
                if (e.target.checked && featuredCount >= FEATURED_LIMIT) {
                  alert(`الحد الأقصى للصور المميزة هو ${FEATURED_LIMIT} صور فقط.`);
                  return;
                }
                setNewPhoto({ ...newPhoto, isFeatured: e.target.checked });
              }}
            />
            صورة مميزة (تظهر في الصفحة الرئيسية)
          </label>

          <button type="submit" className="btn btn-primary" disabled={saving || !newPhoto.url.trim()}>
            {saving ? "جاري الإضافة..." : "إضافة الصورة"}
          </button>
        </form>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : gallery.length === 0 ? (
        <div className="admin-empty"><p>لا توجد صور في المعرض بعد.</p></div>
      ) : (
        <div className="gallery-admin-grid">
          {gallery.map((photo) => (
            <div key={photo._id} className={`gallery-admin-item ${photo.isFeatured ? "gallery-admin-item--featured" : ""}`}>
              <div className="gallery-admin-thumb">
                <img src={photo.imageUrl} alt={photo.title || "صورة"} style={getCropImgStyle(photo.cropArea)} />
                {photo.isFeatured && <span className="gallery-featured-badge">⭐ مميزة</span>}
              </div>
              <div className="gallery-admin-info">
                <span className="gallery-admin-title">
                  {photo.title || <em style={{ opacity: 0.5 }}>بدون عنوان</em>}
                </span>
                <label className={`gallery-toggle-label ${!photo.isFeatured && featuredCount >= FEATURED_LIMIT ? "gallery-toggle-label--disabled" : ""}`}>
                  <input
                    type="checkbox"
                    checked={photo.isFeatured}
                    disabled={!photo.isFeatured && featuredCount >= FEATURED_LIMIT}
                    onChange={() => handleToggleFeatured(photo)}
                  />
                  صورة مميزة
                </label>
                <button className="btn-action btn-delete" onClick={() => handleDelete(photo._id)}>
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default GalleryPanel;
