import { useState } from "react";

const API_BASE = (import.meta.env.VITE_API_URL || "") + "/api";

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
      formData.append("file",   file);
      formData.append("folder", folder);

      const token = localStorage.getItem("ruha_user_token");

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      });

      xhr.addEventListener("load", () => {
        setUploading(false);
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          setProgress(100);
          resolve(data.url);
        } else {
          const msg = (() => {
            try { return JSON.parse(xhr.responseText)?.message; } catch { return null; }
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

      xhr.open("POST", `${API_BASE}/upload`);
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    });
  };

  const reset = () => { setProgress(0); setError(""); };

  return { upload, uploading, progress, error, reset };
}
