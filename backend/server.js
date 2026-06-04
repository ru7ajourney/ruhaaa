// server.js
// نقطة البداية للباك اند - Express Server

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// استورد المسارات
const authRoutes = require("./routes/auth");
const tripRoutes = require("./routes/trips");
const applicationRoutes = require("./routes/applications");
const galleryRoutes = require("./routes/gallery");
const subscribersRoutes = require("./routes/subscribers");
const policyVersionsRoutes = require("./routes/policyVersions");
const userRoutes = require("./routes/users");
const adminsRoutes = require("./routes/admins");
const geoRoutes = require("./routes/geo");
const jobApplicationsRoutes = require("./routes/jobApplications");
const uploadRoutes          = require("./routes/upload");

const path = require("path");
const app = express();
const PORT = process.env.PORT || 5000;

// ==============================
// اتصل بقاعدة البيانات
// ==============================
connectDB();

// ==============================
// Middleware
// ==============================
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return callback(null, true);
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ==============================
// المسارات (Routes)
// ==============================
app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/subscribers", subscribersRoutes);
app.use("/api/policy-versions", policyVersionsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admins", adminsRoutes);
app.use("/api/geo", geoRoutes);
app.use("/api/job-applications", jobApplicationsRoutes);
app.use("/api/upload",          uploadRoutes);

// مسار للتأكد من تشغيل السيرفر
app.get("/", (req, res) => {
  res.json({ message: "🌍 Ruha API is running!" });
});

// ==============================
// معالجة الأخطاء الغير متوقعة
// ==============================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "خطأ داخلي في السيرفر" });
});

// ==============================
// شغّل السيرفر
// ==============================
app.listen(PORT, () => {
  console.log(`🚀 Ruha Server running on http://localhost:${PORT}`);

  // keep-alive ping every 14 minutes to prevent Render free tier sleep
  if (process.env.RENDER_EXTERNAL_URL) {
    setInterval(() => {
      fetch(`${process.env.RENDER_EXTERNAL_URL}/`)
        .then(() => console.log("keep-alive ping sent"))
        .catch(() => {});
    }, 14 * 60 * 1000);
  }
});
