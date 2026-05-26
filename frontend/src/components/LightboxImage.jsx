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
          <div className="lbx-hint-pill">اضغط لفتح الصورة</div>
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
