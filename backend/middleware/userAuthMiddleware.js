const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protectUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "غير مصرح — يجب تسجيل الدخول" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ message: "المستخدم غير موجود" });
    next();
  } catch {
    res.status(401).json({ message: "توكن غير صالح" });
  }
};

module.exports = { protectUser };
