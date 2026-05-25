// src/components/admin/AdminLayout.jsx
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AdminLayout.css";

const NAV = [
  { path: "/admin/dashboard", icon: "🏠", label: "الرئيسية" },
  { path: "/admin/trips",     icon: "✈️", label: "الرحلات"  },
  { path: "/admin/users",     icon: "👥", label: "المستخدمون" },
];

const LIBRARY_NAV = [
  { path: "/admin/calculator", icon: "🧮", label: "الحاسبة"    },
  { path: "/admin/legal",      icon: "📜", label: "القانونية"  },
  { path: "/admin/admins",     icon: "🛡️", label: "المديرون"  },
];

const AdminLayout = ({ children }) => {
  const { admin, logout, isSuper } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const isLibraryPath = LIBRARY_NAV.some((item) => location.pathname.startsWith(item.path));
  const [libraryOpen, setLibraryOpen] = useState(isLibraryPath);

  const handleLogout = () => { logout(); navigate("/admin"); };

  const isActive = (path) => {
    if (path === "/admin/trips") {
      return location.pathname === "/admin/trips" || location.pathname.startsWith("/admin/trips/");
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <span className="sidebar-logo-text">رُحى</span>
          <span className="sidebar-logo-sub">Admin</span>
        </div>

        <nav className="admin-sidebar-nav">
          {NAV.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive(item.path) ? "sidebar-link--active" : ""}`}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span className="sidebar-link-label">{item.label}</span>
            </Link>
          ))}

          {isSuper && (
            <>
              <button
                className={`sidebar-link sidebar-library-btn ${isLibraryPath ? "sidebar-library-btn--active" : ""}`}
                onClick={() => setLibraryOpen((o) => !o)}
              >
                <span className="sidebar-link-icon">📚</span>
                <span className="sidebar-link-label">المكتبة</span>
                <span className={`sidebar-library-arrow ${libraryOpen ? "sidebar-library-arrow--open" : ""}`}>›</span>
              </button>

              {libraryOpen && (
                <div className="sidebar-library-items">
                  {LIBRARY_NAV.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`sidebar-link sidebar-link--sub ${isActive(item.path) ? "sidebar-link--active" : ""}`}
                    >
                      <span className="sidebar-link-icon">{item.icon}</span>
                      <span className="sidebar-link-label">{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="sidebar-admin-info">
            <div className="sidebar-admin-avatar">
              {(admin?.name || admin?.username || "A")[0].toUpperCase()}
            </div>
            <div className="sidebar-admin-name">
              {admin?.name || admin?.username}
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            خروج
          </button>
        </div>
      </aside>

      <main className="admin-page-content">
        <div className="admin-page-inner">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
