// src/components/PoliciesModal.jsx
// شباك السياسات — يُفتح عند الضغط على رابط الشروط

import { useEffect } from "react";
import { POLICIES } from "../data/policies";
import "./PoliciesModal.css";

const PoliciesModal = ({ onClose }) => {
  // أغلق الشباك عند الضغط على Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden"; // امنع التمرير خلف الشباك

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* أوقف الحدث عن الانتشار عشان الضغط جوا ما يغلق الشباك */}
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">سياسات وشروط رُحى</h2>
            <p className="modal-subtitle">يرجى قراءة الشروط التالية بعناية قبل التسجيل</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="إغلاق">
            ✕
          </button>
        </div>

        {/* المحتوى */}
        <div className="modal-content">

          {/* توضيح مهم */}
          <div style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "10px",
            padding: "16px 20px",
            marginBottom: "24px",
            display: "flex",
            gap: "12px",
            alignItems: "flex-start",
          }}>
            <span style={{ fontSize: "22px", lineHeight: 1 }}>💡</span>
            <div>
              <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#15803d", fontSize: "15px" }}>
                الموافقة على الشروط لا تعني الدفع الآن
              </p>
              <p style={{ margin: 0, color: "#166534", fontSize: "14px", lineHeight: 1.7 }}>
                بإرسال طلبك والموافقة على هذه الشروط، لن يُطلب منك دفع أي مبلغ في الوقت الحالي.
                التسجيل النهائي يتطلب موافقة من الطرفين — موافقة فريق رُحى على قبولك، وموافقتك أنت على تأكيد المشاركة — وعندها فقط يتم الحديث عن الدفع.
              </p>
            </div>
          </div>

          {POLICIES.map((policy, index) => (
            <div key={policy.id} className="policy-block">
              {/* عنوان القسم */}
              <div className="policy-header">
                <span className="policy-icon">{policy.icon}</span>
                <h3 className="policy-title">
                  <span className="policy-num">{index + 1}.</span>
                  {policy.title}
                </h3>
              </div>

              {/* النقاط */}
              <ul className="policy-points">
                {policy.points.map((point, i) => (
                  <li key={i} className="policy-point">
                    <span className="point-bullet">—</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* ملاحظة ختامية */}
          <div className="policy-footer-note">
            بالموافقة على هذه الشروط، تُقر بأنك قرأتها وفهمتها وتوافق على الالتزام بها كاملاً.
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            فهمت وأوافق ✓
          </button>
        </div>
      </div>
    </div>
  );
};

export default PoliciesModal;
