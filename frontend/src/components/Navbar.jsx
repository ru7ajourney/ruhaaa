// src/components/Navbar.jsx
// شريط التنقل العلوي

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        {/* الشعار */}
        <Link to="/" className="navbar-logo">
          <span className="logo-arabic">رُحى</span>
          <span className="logo-tagline">سفر وتطوع</span>
        </Link>

        {/* روابط التنقل - سطح المكتب */}
        <ul className="navbar-links">
          <li>
            <Link to="/" className={isActive("/") ? "active" : ""}>
              الرئيسية
            </Link>
          </li>
          <li>
            <Link to="/trips" className={isActive("/trips") ? "active" : ""}>
              الرحلات
            </Link>
          </li>
          <li>
            <Link to="/about" className={isActive("/about") ? "active" : ""}>
              عن رُحى
            </Link>
          </li>
          <li>
            <Link to="/contact" className={isActive("/contact") ? "active" : ""}>
              تواصل معنا
            </Link>
          </li>
        </ul>

        {/* زر القائمة للموبايل */}
        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="فتح القائمة"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* القائمة المنسدلة للموبايل */}
      {menuOpen && (
        <div className="navbar-mobile">
          <ul>
            <li>
              <Link to="/" onClick={() => setMenuOpen(false)}>الرئيسية</Link>
            </li>
            <li>
              <Link to="/trips" onClick={() => setMenuOpen(false)}>الرحلات</Link>
            </li>
            <li>
              <Link to="/about" onClick={() => setMenuOpen(false)}>عن رُحى</Link>
            </li>
            <li>
              <Link to="/contact" onClick={() => setMenuOpen(false)}>تواصل معنا</Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
