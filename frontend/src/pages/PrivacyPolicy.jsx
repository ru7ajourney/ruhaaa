// src/pages/PrivacyPolicy.jsx

import { PRIVACY_POLICY } from "../data/privacyPolicy";
import PageHero from "../components/PageHero";
import "./Policies.css";

const PrivacyPolicy = () => {
  return (
    <div className="policies-page">
      <PageHero
        title="سياسة الخصوصية"
        subtitle={`آخر تحديث: ${new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "long", numberingSystem: "latn" })}`}
        icon="🔒"
      />

      <div className="container policies-body">
        <div className="policies-intro">
          <p>
            نحن في رُحى نأخذ خصوصيتك على محمل الجد. توضح هذه السياسة كيف نجمع بياناتك الشخصية
            ونستخدمها ونحميها عند استخدامك لمنصتنا أو تقديمك لطلب رحلة.
          </p>
        </div>

        <div className="policies-list">
          {PRIVACY_POLICY.map((section, index) => (
            <div key={section.id} className="policy-card">
              <div className="policy-card-header">
                <span className="policy-card-icon">{section.icon}</span>
                <h2 className="policy-card-title">
                  <span className="policy-card-num">{index + 1}</span>
                  {section.title}
                </h2>
              </div>
              <ul className="policy-card-points">
                {section.points.map((point, i) => (
                  <li key={i}>
                    <span className="point-dash">—</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="policies-closing">
          <p>
            باستخدامك لمنصة رُحى أو تقديمك لطلب رحلة، فأنت توافق على هذه السياسة وتُقر بقراءتها وفهمها.
          </p>
          <p>
            لأي استفسار حول خصوصيتك أو بياناتك، تواصل معنا على: ruha@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
