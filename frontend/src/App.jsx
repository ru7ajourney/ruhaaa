// src/App.jsx
// جذر التطبيق - تعريف كل المسارات

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { AuthProvider } from "./context/AuthContext";
import { UserAuthProvider } from "./context/UserAuthContext";

// Layout Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

// Public Pages
import Home from "./pages/Home";
import Trips from "./pages/Trips";
import TripDetail from "./pages/TripDetail";
import About from "./pages/About";
import Register from "./pages/Register";
import Policies from "./pages/Policies";
import Contact from "./pages/Contact";
import Gallery from "./pages/Gallery";
// Admin Pages
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import AdminTrips from "./pages/admin/AdminTrips";
import TripForm from "./pages/admin/TripForm";
import TripStats from "./pages/admin/TripStats";
import TripCalculator from "./pages/admin/TripCalculator";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminGallery from "./pages/admin/AdminGallery";
import AdminLegal from "./pages/admin/AdminLegal";
import AdminSubscribers from "./pages/admin/AdminSubscribers";
import AdminManagement from "./pages/admin/AdminManagement";
import UserAuth from "./pages/UserAuth";
import MyApplications from "./pages/MyApplications";
import Checkout from "./pages/Checkout";

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
    <PayPalScriptProvider options={{ clientId: "AZc2HJEaV0OCt9giyZtoUz0BNTtQeyY_JgomMFR6LcEniqOpycyFCV31eogEWIgNQCmZh4CHdMFTGfn-", currency: "USD", components: "buttons,googlepay" }}>
    <GoogleOAuthProvider clientId="259401227183-hi6g6bh83g1klvjn5kr39gqf22m2f27u.apps.googleusercontent.com">
    <UserAuthProvider>
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
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
          <Route
            path="/gallery"
            element={
              <PublicLayout flushFooter>
                <Gallery />
              </PublicLayout>
            }
          />
          {/* ==============================
              صفحات الآدمن (بدون Navbar العام)
              ============================== */}
          <Route path="/admin" element={<Login />} />

          <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/trips" element={<ProtectedRoute><AdminTrips /></ProtectedRoute>} />
          <Route path="/admin/trips/new" element={<ProtectedRoute><TripForm /></ProtectedRoute>} />
          <Route path="/admin/trips/edit/:id" element={<ProtectedRoute><TripForm /></ProtectedRoute>} />
          <Route path="/admin/trips/:id/stats" element={<ProtectedRoute><TripStats /></ProtectedRoute>} />
          <Route path="/admin/calculator" element={<ProtectedRoute><TripCalculator /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/gallery" element={<ProtectedRoute><AdminGallery /></ProtectedRoute>} />
          <Route path="/admin/legal" element={<ProtectedRoute><AdminLegal /></ProtectedRoute>} />
          <Route path="/admin/subscribers" element={<ProtectedRoute><AdminSubscribers /></ProtectedRoute>} />
          <Route path="/admin/admins" element={<ProtectedRoute><AdminManagement /></ProtectedRoute>} />

          {/* صفحات المستخدم */}
          <Route path="/my-account" element={<UserAuth />} />
          <Route
            path="/my-applications"
            element={<PublicLayout><MyApplications /></PublicLayout>}
          />
          <Route
            path="/checkout/:id"
            element={<PublicLayout><Checkout /></PublicLayout>}
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
    </UserAuthProvider>
    </GoogleOAuthProvider>
    </PayPalScriptProvider>
  );
}

export default App;
