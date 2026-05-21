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

      // تحقق من صحة التوكن
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // أضف بيانات الآدمن للـ request (بدون كلمة المرور)
      req.admin = await Admin.findById(decoded.id).select("-password");

      next(); // تابع للمسار التالي
    } catch (error) {
      return res.status(401).json({ message: "التوكن غير صالح" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "غير مصرح - لا يوجد توكن" });
  }
};

module.exports = { protect };
