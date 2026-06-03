// src/pages/PrivacyPolicy.jsx

import { PRIVACY_POLICY } from "../data/privacyPolicy";
import PageHero from "../components/PageHero";
import "./Policies.css";

const PrivacyPolicy = () => {
  return (
    <div>
      <PageHero title="سياسة الخصوصية" subtitle="كيف نجمع بياناتك ونحميها ونستخدمها" icon="🔒" />
      <div className="container policies-body">
        {PRIVACY_POLICY.map((section) => (
          <div key={section.id} className="policy-card">
            <div className="policy-card-title">
              <span className="policy-card-icon">{section.icon}</span>
              <span className="policy-card-num">{section.id}.</span>
              <h2>{section.title}</h2>
            </div>
            <ul className="policy-card-points">
              {section.points.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrivacyPolicy;
