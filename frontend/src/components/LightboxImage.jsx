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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7.5" />
            <line x1="20" y1="20" x2="15.8" y2="15.8" />
            <line x1="11" y1="8.5" x2="11" y2="13.5" />
            <line x1="8.5" y1="11" x2="13.5" y2="11" />
          </svg>
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
