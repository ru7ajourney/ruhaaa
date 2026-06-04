import { useState } from "react";

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const UPLOAD_URL    = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export default function useCloudinaryUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [error,     setError]     = useState("");

  const upload = (file, { folder = "ruha" } = {}) => {
    return new Promise((resolve, reject) => {
      if (!file) { reject(new Error("لم يتم اختيار ملف")); return; }

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
          setProgress(100);
          resolve(JSON.parse(xhr.responseText).secure_url);
        } else {
          const msg = (() => {
            try { return JSON.parse(xhr.responseText)?.error?.message; } catch { return null; }
          })() || "فشل رفع الصورة";
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
