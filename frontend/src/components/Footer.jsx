// src/components/Footer.jsx

import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = ({ flush }) => {
  return (
    <footer className={`footer${flush ? " footer--flush" : ""}`}>
      <div className="container">
        <div className="footer-grid">
          {/* عن رُحى */}
          <div className="footer-col">
            <h3 className="footer-logo">رُحى</h3>
            <p className="footer-desc">
              نساعدك تسافر وتتطوع في الخارج بتكاليف بسيطة ومرافق متخصص يخطط
              لك كل شيء من أول سطر.
            </p>
          </div>

          {/* روابط سريعة */}
          <div className="footer-col">
            <h4>روابط سريعة</h4>
            <ul>
              <li><Link to="/">الرئيسية</Link></li>
              <li><Link to="/trips">الرحلات</Link></li>
              <li><Link to="/about">عن رُحى</Link></li>
              <li><Link to="/contact">تواصل معنا</Link></li>
              <li><Link to="/policies">الشروط والسياسات</Link></li>
              <li><Link to="/privacy-policy">سياسة الخصوصية</Link></li>
            </ul>
          </div>

          {/* تواصل */}
          <div className="footer-col">
            <h4>تواصل معنا</h4>
            <ul className="footer-contact">
              <li>📧 ruha@email.com</li>
              <li>📱 واتساب: +970-xxx-xxxx</li>
              <li>📸 Instagram: @ruha.travel</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} رُحى - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
