import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext";
import "./Navbar.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, loggingOut } = useUserAuth();

  const isActive = (path) => location.pathname === path;

  // أغلق الـ dropdown لما يضغط برّا
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate("/");
  };

  if (loggingOut) {
    return (
      <div className="logout-overlay">
        <div className="logout-overlay-content">
          <div className="spinner" />
          <p>جاري تسجيل الخروج...</p>
        </div>
      </div>
    );
  }

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
          <li><Link to="/" className={isActive("/") ? "active" : ""}>الرئيسية</Link></li>
          <li><Link to="/trips" className={isActive("/trips") ? "active" : ""}>الرحلات</Link></li>
          <li><Link to="/about" className={isActive("/about") ? "active" : ""}>عن رُحى</Link></li>
          <li><Link to="/gallery" className={isActive("/gallery") ? "active" : ""}>المعرض</Link></li>
          <li><Link to="/contact" className={isActive("/contact") ? "active" : ""}>تواصل معنا</Link></li>
        </ul>

        {/* زر حسابي */}
        {user ? (
          <div className="navbar-account-wrapper" ref={dropdownRef}>
            <button
              className="navbar-account-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              👤 {user.fullName.split(" ")[0]}
              <span className="account-arrow">▾</span>
            </button>
            {dropdownOpen && (
              <div className="account-dropdown">
                <Link to="/my-applications" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                  📋 طلباتي
                </Link>
                <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                  🚪 تسجيل خروج
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/my-account" className="navbar-account-btn">حسابي</Link>
        )}

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
            <li><Link to="/" onClick={() => setMenuOpen(false)}>الرئيسية</Link></li>
            <li><Link to="/trips" onClick={() => setMenuOpen(false)}>الرحلات</Link></li>
            <li><Link to="/about" onClick={() => setMenuOpen(false)}>عن رُحى</Link></li>
            <li><Link to="/gallery" onClick={() => setMenuOpen(false)}>المعرض</Link></li>
            <li><Link to="/contact" onClick={() => setMenuOpen(false)}>تواصل معنا</Link></li>
            {user ? (
              <>
                <li><Link to="/my-applications" onClick={() => setMenuOpen(false)}>📋 طلباتي</Link></li>
                <li><button className="mobile-logout-btn" onClick={() => { logout(); setMenuOpen(false); navigate("/"); }}>🚪 خروج</button></li>
              </>
            ) : (
              <li><Link to="/my-account" onClick={() => setMenuOpen(false)}>حسابي</Link></li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
