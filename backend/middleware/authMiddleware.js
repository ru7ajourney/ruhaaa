// middleware/authMiddleware.js
// حماية المسارات الخاصة بالآدمن - يتحقق من التوكن

const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const protect = async (req, res, next) => {
  let token;

  // ابحث عن التوكن في الـ Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // استخرج التوكن من "Bearer TOKEN"
      token = req.headers.authorization.split(" ")[1];

      // تحقق من صحة التوكن — يستخدم سر مخصص للأدمن فقط
      const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET);

      // أضف بيانات الآدمن للـ request (بدون كلمة المرور)
      req.admin = await Admin.findByIdAndUpdate(
        decoded.id,
        { lastSeen: new Date() },
        { new: true, select: "-password" }
      );

      if (!req.admin) {
        return res.status(401).json({ message: "غير مصرح - ليس آدمن" });
      }

      next(); // تابع للمسار التالي
    } catch (error) {
      return res.status(401).json({ message: "التوكن غير صالح" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "غير مصرح - لا يوجد توكن" });
  }
};

const protectSuper = async (req, res, next) => {
  await new Promise((resolve) => {
    protect(req, res, resolve);
  });
  if (res.headersSent) return;
  if (req.admin?.role !== "super") {
    return res.status(403).json({ message: "هذا الإجراء مخصص للمدير الأعلى فقط" });
  }
  next();
};

module.exports = { protect, protectSuper };
