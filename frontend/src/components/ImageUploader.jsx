// مكوّن رفع صورة إلى Cloudinary — قابل لإعادة الاستخدام في أي صفحة
// الاستخدام:
//   <ImageUploader
//     currentUrl={user.avatar}          // رابط الصورة الحالية (اختياري)
//     onUploaded={(url) => ...}          // callback بعد نجاح الرفع
//     folder="ruha/avatars"             // المجلد في Cloudinary (اختياري)
//     shape="circle"                    // "circle" | "rect" (اختياري، افتراضي: rect)
//     placeholder="اختر صورة"           // نص الزر (اختياري)
//   />

import { useRef, useState } from "react";
import useCloudinaryUpload from "../hooks/useCloudinaryUpload";
import "./ImageUploader.css";

const ACCEPTED = "image/jpeg,image/png,image/webp,image/gif";
const MAX_MB   = 5;

export default function ImageUploader({
  currentUrl   = "",
  onUploaded,
  folder       = "ruha",
  shape        = "rect",
  placeholder  = "اختر صورة أو اسحبها هنا",
}) {
  const inputRef              = useRef(null);
  const [preview, setPreview] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const { upload, uploading, progress, error, reset } = useCloudinaryUpload();

  const displayed = preview || currentUrl;

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("الملف يجب أن يكون صورة"); return; }
    if (file.size > MAX_MB * 1024 * 1024) { alert(`حجم الصورة يجب أن لا يتجاوز ${MAX_MB} MB`); return; }

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    try {
      const url = await upload(file, { folder });
      setPreview("");
      onUploaded?.(url);
    } catch {
      setPreview("");
    }
  };

  const onInputChange = (e) => handleFile(e.target.files[0]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div
      className={`img-uploader img-uploader--${shape}${dragOver ? " img-uploader--drag" : ""}`}
      onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        style={{ display: "none" }}
        onChange={onInputChange}
      />

      {/* الصورة الحالية أو المعاينة */}
      {displayed && !uploading && (
        <img src={displayed} alt="صورة" className="img-uploader__preview" />
      )}

      {/* شريط التحميل */}
      {uploading && (
        <div className="img-uploader__overlay">
          <div className="img-uploader__progress-ring">
            <svg viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
              <circle
                cx="22" cy="22" r="18" fill="none"
                stroke="#fff" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 18}`}
                strokeDashoffset={`${2 * Math.PI * 18 * (1 - progress / 100)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.2s" }}
              />
            </svg>
            <span className="img-uploader__pct">{progress}%</span>
          </div>
        </div>
      )}

      {/* placeholder لما ما في صورة */}
      {!displayed && !uploading && (
        <div className="img-uploader__placeholder">
          <span className="img-uploader__icon">📷</span>
          <span className="img-uploader__label">{placeholder}</span>
        </div>
      )}

      {/* زر "تغيير" فوق الصورة */}
      {displayed && !uploading && (
        <div className="img-uploader__change-badge">تغيير</div>
      )}

      {/* رسالة الخطأ */}
      {error && (
        <p className="img-uploader__error" onClick={(e) => { e.stopPropagation(); reset(); }}>
          ⚠️ {error} — اضغط للإغلاق
        </p>
      )}
    </div>
  );
}
