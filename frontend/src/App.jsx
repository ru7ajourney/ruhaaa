// src/App.jsx
// جذر التطبيق - تعريف كل المسارات

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Layout Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

// Public Pages
import Home from "./pages/Home";
import Trips from "./pages/Trips";
import TripDetail from "./pages/TripDetail";
import About from "./pages/About";
import Register from "./pages/Register";
import Policies from "./pages/Policies";
import Contact from "./pages/Contact";

// Admin Pages
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import TripForm from "./pages/admin/TripForm";

// Global Styles
import "./styles/global.css";

// ==============================
// Layout للصفحات العامة (مع Navbar و Footer)
// ==============================
const PublicLayout = ({ children, flushFooter }) => (
  <>
    <Navbar />
    <main>{children}</main>
    <Footer flush={flushFooter} />
  </>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ==============================
              الصفحات العامة
              ============================== */}
          <Route
            path="/"
            element={
              <PublicLayout flushFooter>
                <Home />
              </PublicLayout>
            }
          />
          <Route
            path="/trips"
            element={
              <PublicLayout>
                <Trips />
              </PublicLayout>
            }
          />
          <Route
            path="/trips/:slug"
            element={
              <PublicLayout>
                <TripDetail />
              </PublicLayout>
            }
          />
          <Route
            path="/about"
            element={
              <PublicLayout>
                <About />
              </PublicLayout>
            }
          />
          <Route
            path="/register"
            element={
              <PublicLayout>
                <Register />
              </PublicLayout>
            }
          />
          <Route
            path="/policies"
            element={
              <PublicLayout>
                <Policies />
              </PublicLayout>
            }
          />
          <Route
            path="/contact"
            element={
              <PublicLayout flushFooter>
                <Contact />
              </PublicLayout>
            }
          />

          {/* ==============================
              صفحات الآدمن (بدون Navbar العام)
              ============================== */}
          <Route path="/admin" element={<Login />} />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/trips/new"
            element={
              <ProtectedRoute>
                <TripForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/trips/edit/:id"
            element={
              <ProtectedRoute>
                <TripForm />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route
            path="*"
            element={
              <PublicLayout>
                <div
                  className="container"
                  style={{ padding: "100px 24px", textAlign: "center" }}
                >
                  <h1 style={{ fontSize: "4rem", color: "var(--color-primary)" }}>
                    404
                  </h1>
                  <p style={{ marginBottom: 20 }}>الصفحة غير موجودة</p>
                  <a href="/" className="btn btn-primary">
                    العودة للرئيسية
                  </a>
                </div>
              </PublicLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
