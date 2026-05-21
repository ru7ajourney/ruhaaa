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

const app = express();
const PORT = process.env.PORT || 5000;

// ==============================
// اتصل بقاعدة البيانات
// ==============================
connectDB();

// ==============================
// Middleware
// ==============================
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json()); // اقرأ JSON من الـ request body

// ==============================
// المسارات (Routes)
// ==============================
app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/applications", applicationRoutes);

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
});
