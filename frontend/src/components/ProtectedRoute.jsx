// src/components/ProtectedRoute.jsx
// يحمي مسارات الآدمن - إذا ما دخل يوجهه لصفحة تسجيل الدخول

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { admin, loading } = useAuth();

  // في حالة التحقق من التوكن
  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  // إذا ما في آدمن مسجل - وجّهه لصفحة الدخول
  if (!admin) {
    return <Navigate to="/admin" replace />;
  }

  // إذا مسجل - اعرض المحتوى
  return children;
};

export default ProtectedRoute;
