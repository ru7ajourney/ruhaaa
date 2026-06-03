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
          <button className="modal-close" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>

        <div className="modal-content">
          {PRIVACY_POLICY.map((section, index) => (
            <div key={section.id} className="policy-block">
              <div className="policy-header">
                <span className="policy-icon">{section.icon}</span>
                <h3 className="policy-title">
                  <span className="policy-num">{index + 1}.</span>
                  {section.title}
                </h3>
              </div>
              <ul className="policy-points">
                {section.points.map((point, i) => (
                  <li key={i} className="policy-point">
                    <span className="point-bullet">—</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="policy-footer-note">
            باستخدامك للمنصة، تُقر بأنك قرأت هذه السياسة وفهمتها وتوافق عليها.
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>فهمت ✓</button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
