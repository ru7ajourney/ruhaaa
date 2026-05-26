import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "./LightboxImage.css";

const LightboxImage = ({ src, alt, caption, className, style, ...imgProps }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div className="lbx-trigger" onClick={() => setOpen(true)}>
        <img src={src} alt={alt} className={className} style={style} {...imgProps} />
        <div className="lbx-hint" aria-hidden="true">
          <div className="lbx-hint-pill">
            <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.5 1.5a1.5 1.5 0 0 0-3 0V9H9V6.75a1.5 1.5 0 0 0-3 0V12H4.5L7 17.25A4.5 4.5 0 0 0 11.25 19.5h1.5a4.5 4.5 0 0 0 4.5-4.5V10.5a1.5 1.5 0 0 0-3 0V9a1.5 1.5 0 0 0-3 0V1.5z" opacity="0.9"/>
            </svg>
            <span>اضغط لعرض الصورة</span>
          </div>
        </div>
      </div>

      {open && createPortal(
        <div className="lbx-overlay" onClick={() => setOpen(false)}>
          <button className="lbx-close" onClick={() => setOpen(false)} aria-label="إغلاق">✕</button>
          <figure className="lbx-figure" onClick={(e) => e.stopPropagation()}>
            <img src={src} alt={alt} className="lbx-full-img" />
            {(caption || alt) && (
              <figcaption className="lbx-caption">{caption || alt}</figcaption>
            )}
          </figure>
        </div>,
        document.body
      )}
    </>
  );
};

export default LightboxImage;
