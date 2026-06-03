// src/components/PrivacyPolicyModal.jsx

import { useEffect } from "react";
import { PRIVACY_POLICY } from "../data/privacyPolicy";
import "./PoliciesModal.css";

const PrivacyPolicyModal = ({ onClose }) => {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <div>
            <h2 className="modal-title">🔒 سياسة الخصوصية</h2>
            <p className="modal-subtitle">كيف نجمع بياناتك ونحميها ونستخدمها</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>

        <div className="modal-body">
          {PRIVACY_POLICY.map((section) => (
            <div key={section.id} className="policy-section">
              <h3 className="policy-section-title">
                <span className="policy-icon">{section.icon}</span>
                <span className="policy-num">{section.id}.</span>
                {section.title}
              </h3>
              <ul className="policy-points">
                {section.points.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>فهمت ✓</button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
