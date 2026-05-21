// src/pages/Policies.jsx
// صفحة سياسات رُحى المستقلة

import { POLICIES } from "../data/policies";
import "./Policies.css";

const Policies = () => {
  return (
    <div className="policies-page">
      {/* Header */}
      <div className="policies-header">
        <div className="container">
          <h1>سياسات وشروط رُحى</h1>
          <p>آخر تحديث: {new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "long" })}</p>
        </div>
      </div>

      <div className="container policies-body">
        {/* مقدمة */}
        <div className="policies-intro">
          <p>
            مشروع رُحى يوفر تجربة سفر وتطوع ثقافي منظمة ومرافقة. للحفاظ على جودة التجربة
            لجميع المشاركين، نطلب من كل متقدم قراءة الشروط التالية والالتزام بها كاملاً.
          </p>
        </div>

        {/* السياسات */}
        <div className="policies-list">
          {POLICIES.map((policy, index) => (
            <div key={policy.id} className="policy-card">
              <div className="policy-card-header">
                <span className="policy-card-icon">{policy.icon}</span>
                <h2 className="policy-card-title">
                  <span className="policy-card-num">{index + 1}</span>
                  {policy.title}
                </h2>
              </div>
              <ul className="policy-card-points">
                {policy.points.map((point, i) => (
                  <li key={i}>
                    <span className="point-dash">—</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ملاحظة ختامية */}
        <div className="policies-closing">
          <p>
            بتقديم طلب التسجيل في أي رحلة من رحلات رُحى، فأنت تُقر بأنك قرأت هذه الشروط
            وفهمتها وتوافق على الالتزام بها كاملاً.
          </p>
          <p>
            لأي استفسار حول هذه الشروط، تواصل معنا عبر واتساب أو البريد الإلكتروني.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Policies;
