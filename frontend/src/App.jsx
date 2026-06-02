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
import SuperRoute from "./components/SuperRoute";
import AdminLayout from "./components/admin/AdminLayout";
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
import AdminPeople from "./pages/admin/AdminPeople";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminGallery from "./pages/admin/AdminGallery";
import AdminLegal from "./pages/admin/AdminLegal";
import AdminSubscribers from "./pages/admin/AdminSubscribers";
import AdminManagement from "./pages/admin/AdminManagement";
import UserAuth from "./pages/UserAuth";
import MyApplications from "./pages/MyApplications";
import Checkout from "./pages/Checkout";
import UserProfile from "./pages/UserProfile";

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
    <PayPalScriptProvider options={{ clientId: "BAAmd2xrRvrEKMmVw27ZgqEfOUlaM44AcAxQ2R4RKS4xN9ut1kOWsy7aBWOTDZ67sew1uvbTwtsdUzK2zs", currency: "USD", components: "buttons,googlepay" }}>
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
          <Route path="/admin/trips/new" element={<ProtectedRoute><SuperRoute><TripForm /></SuperRoute></ProtectedRoute>} />
          <Route path="/admin/trips/edit/:id" element={<ProtectedRoute><SuperRoute><TripForm /></SuperRoute></ProtectedRoute>} />
          <Route path="/admin/trips/:id/stats" element={<ProtectedRoute><TripStats /></ProtectedRoute>} />
          <Route path="/admin/calculator" element={<ProtectedRoute><SuperRoute><TripCalculator /></SuperRoute></ProtectedRoute>} />
          <Route path="/admin/users"         element={<ProtectedRoute><AdminPeople /></ProtectedRoute>} />
          <Route path="/admin/applications" element={<ProtectedRoute><AdminApplications /></ProtectedRoute>} />
          <Route path="/admin/gallery"      element={<ProtectedRoute><AdminGallery /></ProtectedRoute>} />
          <Route path="/admin/subscribers"  element={<ProtectedRoute><AdminSubscribers /></ProtectedRoute>} />
          <Route path="/admin/legal"       element={<ProtectedRoute><SuperRoute><AdminLegal /></SuperRoute></ProtectedRoute>} />
          <Route path="/admin/admins" element={<ProtectedRoute><SuperRoute><AdminManagement /></SuperRoute></ProtectedRoute>} />

          {/* 404 للأدمن — موحد لأي رابط غير معروف تحت /admin */}
          <Route path="/admin/*" element={
            <ProtectedRoute>
              <AdminLayout>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", textAlign:"center", gap:"16px" }}>
                  <div style={{ fontSize:"5rem", lineHeight:1 }}>404</div>
                  <h2 style={{ fontSize:"1.4rem", fontWeight:800, color:"var(--color-secondary,#2d3748)", margin:0 }}>الصفحة غير موجودة</h2>
                  <p style={{ color:"var(--color-text-light,#718096)", margin:0, fontSize:"0.95rem" }}>الرابط الذي أدخلته غير موجود أو تم نقله.</p>
                </div>
              </AdminLayout>
            </ProtectedRoute>
          } />

          {/* صفحات المستخدم */}
          <Route path="/my-account" element={<UserAuth />} />
          <Route
            path="/my-profile"
            element={<PublicLayout><UserProfile /></PublicLayout>}
          />
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
