// src/components/admin/AdminLayout.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AdminLayout.css";

const NAV = [
  { path: "/admin/dashboard",   icon: "🏠", label: "الرئيسية"     },
  { path: "/admin/trips",       icon: "✈️", label: "الرحلات"       },
  { path: "/admin/users",       icon: "👥", label: "المستخدمون"    },
  { path: "/admin/gallery",     icon: "🖼️", label: "المعرض"        },
  { path: "/admin/subscribers", icon: "📋", label: "المشتركون"     },
  { path: "/admin/legal",       icon: "📜", label: "القانونية"     },
  { path: "/admin/calculator",  icon: "🧮", label: "الحاسبة"       },
];

const AdminLayout = ({ children }) => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/admin");
  };

  const isActive = (path) => {
    if (path === "/admin/trips") {
      return (
        location.pathname === "/admin/trips" ||
        location.pathname.startsWith("/admin/trips/")
      );
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
