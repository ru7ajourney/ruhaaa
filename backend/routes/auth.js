// routes/auth.js
// مسارات تسجيل الدخول والخروج للآدمن

const express = require("express");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// ==============================
// دالة مساعدة: أنشئ JWT Token
// ==============================
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// ==============================
// POST /api/auth/login
// تسجيل دخول الآدمن
// ==============================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // تحقق من وجود البيانات
    if (!email || !password) {
      return res.status(400).json({ message: "الإيميل وكلمة المرور مطلوبان" });
    }

    // ابحث عن الآدمن بالإيميل
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
    }

    // تحقق من كلمة المرور
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
    }

    // أرسل التوكن
    res.json({
      message: "تم تسجيل الدخول بنجاح",
      token: generateToken(admin._id),
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        username: admin.username,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "خطأ في السيرفر", error: error.message });
  }
});

// ==============================
// GET /api/auth/me
// تحقق من صحة التوكن (محمي)
// ==============================
router.get("/me", protect, async (req, res) => {
  res.json({
    admin: {
      id: req.admin._id,
      email: req.admin.email,
      name: req.admin.name,
      username: req.admin.username,
    },
  });
});

module.exports = router;
