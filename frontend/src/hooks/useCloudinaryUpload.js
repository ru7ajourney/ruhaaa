import { useState } from "react";

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export default function useCloudinaryUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [error,     setError]     = useState("");

  const upload = (file, { folder = "ruha" } = {}) => {
    return new Promise((resolve, reject) => {
      if (!file) { reject(new Error("لم يتم اختيار ملف")); return; }
      if (!CLOUD_NAME || !UPLOAD_PRESET) {
        reject(new Error("VITE_CLOUDINARY_CLOUD_NAME و VITE_CLOUDINARY_UPLOAD_PRESET غير مضبوطين"));
        return;
      }

      setUploading(true);
      setProgress(0);
      setError("");

      const formData = new FormData();
      formData.append("file",           file);
      formData.append("upload_preset",  UPLOAD_PRESET);
      formData.append("folder",         folder);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      });

      xhr.addEventListener("load", () => {
        setUploading(false);
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          setProgress(100);
          resolve(data.secure_url);
        } else {
          const msg = JSON.parse(xhr.responseText)?.error?.message || "فشل رفع الصورة";
          setError(msg);
          reject(new Error(msg));
        }
      });

      xhr.addEventListener("error", () => {
        setUploading(false);
        const msg = "خطأ في الاتصال — تحقق من الإنترنت";
        setError(msg);
        reject(new Error(msg));
      });

      xhr.open("POST", UPLOAD_URL);
      xhr.send(formData);
    });
  };

  const reset = () => { setProgress(0); setError(""); };

  return { upload, uploading, progress, error, reset };
}
