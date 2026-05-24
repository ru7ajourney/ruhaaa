const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Application = require("../models/Application");
const { protectUser } = require("../middleware/userAuthMiddleware");
const { createOrder, captureOrder } = require("../utils/paypal");

const router = express.Router();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// POST /api/users/register
router.post("/register", async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password)
      return res.status(400).json({ message: "جميع الحقول مطلوبة" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "الإيميل مستخدم بالفعل" });

    const user = await User.create({ fullName, email, password });
    res.status(201).json({
      message: "تم إنشاء الحساب بنجاح",
      token: generateToken(user._id),
      user: { id: user._id, fullName: user.fullName, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: "خطأ في السيرفر", error: err.message });
  }
});

// POST /api/users/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password)
      return res.status(400).json({ message: "الإيميل وكلمة المرور مطلوبان" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });

    res.json({
      message: "تم تسجيل الدخول بنجاح",
      token: generateToken(user._id),
      user: { id: user._id, fullName: user.fullName, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: "خطأ في السيرفر", error: err.message });
  }
});

// GET /api/users/me
router.get("/me", protectUser, (req, res) => {
  res.json({ user: { id: req.user._id, fullName: req.user.fullName, email: req.user.email } });
});

// GET /api/users/my-applications — جلب طلبات المستخدم بالإيميل
router.get("/my-applications", protectUser, async (req, res) => {
  try {
    const applications = await Application.find({
      $or: [{ userId: req.user._id }, { email: req.user.email }],
    })
      .populate("trip", "title destination coverImage duration price currency slug")
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: "خطأ في جلب الطلبات", error: err.message });
  }
});

// POST /api/users/applications/:id/create-paypal-order
router.post("/applications/:id/create-paypal-order", protectUser, async (req, res) => {
  try {
    const { amount, currency } = req.body;
    const application = await Application.findOne({
      _id: req.params.id,
      $or: [{ userId: req.user._id }, { email: req.user.email }],
    });

    if (!application) return res.status(404).json({ message: "الطلب غير موجود" });
    if (application.status !== "accepted")
      return res.status(400).json({ message: "يجب أن يكون الطلب مقبولاً أولاً" });

    const order = await createOrder(amount, currency || "USD");
    res.json({ orderId: order.id });
  } catch (err) {
    res.status(500).json({ message: "خطأ في إنشاء طلب الدفع", error: err.message });
  }
});

// POST /api/users/applications/:id/capture-paypal-order
router.post("/applications/:id/capture-paypal-order", protectUser, async (req, res) => {
  try {
    const { orderId, amount, currency } = req.body;
    const application = await Application.findOne({
      _id: req.params.id,
      $or: [{ userId: req.user._id }, { email: req.user.email }],
    });

    if (!application) return res.status(404).json({ message: "الطلب غير موجود" });

    const capture = await captureOrder(orderId);

    if (capture.status !== "COMPLETED") {
      return res.status(400).json({ message: "لم يتم تأكيد الدفع من PayPal" });
    }

    application.status = "payment_pending";
    application.paidAmount = amount || 0;
    application.paidCurrency = currency || "USD";
    application.history.push({
      status: "payment_pending",
      reason: `تم الدفع عبر PayPal بمبلغ ${amount} ${currency} — Order: ${orderId}`,
      changedAt: new Date(),
    });
    await application.save();

    res.json({ message: "تم الدفع بنجاح وسيتم تأكيد تسجيلك قريباً" });
  } catch (err) {
    res.status(500).json({ message: "خطأ في تأكيد الدفع", error: err.message });
  }
});

// POST /api/users/applications/:id/pay — المستخدم يؤكد إرسال العربون
router.post("/applications/:id/pay", protectUser, async (req, res) => {
  try {
    const { amount, currency } = req.body;
    const application = await Application.findOne({
      _id: req.params.id,
      $or: [{ userId: req.user._id }, { email: req.user.email }],
    });

    if (!application)
      return res.status(404).json({ message: "الطلب غير موجود" });

    if (application.status !== "accepted")
      return res.status(400).json({ message: "يجب أن يكون الطلب مقبولاً أولاً" });

    application.status = "payment_pending";
    application.paidAmount = amount || 0;
    application.paidCurrency = currency || "";
    application.history.push({
      status: "payment_pending",
      reason: `أرسل المتقدم تأكيد الدفع بمبلغ ${amount} ${currency} — في انتظار مراجعة الآدمن`,
      changedAt: new Date(),
    });
    await application.save();

    res.json({ message: "تم إرسال تأكيد الدفع، سنراجعه قريباً", application });
  } catch (err) {
    res.status(500).json({ message: "خطأ في السيرفر", error: err.message });
  }
});

// POST /api/users/google-auth — تسجيل دخول / اشتراك بجوجل
router.post("/google-auth", async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ message: "credential مطلوب" });

  try {
    const googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
      headers: { Authorization: `Bearer ${credential}` },
    });
    if (!googleRes.ok) return res.status(401).json({ message: "فشل التحقق من حساب جوجل" });
    const { sub: googleId, email, name, picture } = await googleRes.json();

    let user = await User.findOne({ email });

    if (user) {
      // حدّث googleId إذا لم يكن مسجّلاً
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = picture || user.avatar;
        await user.save();
      }
    } else {
      // أنشئ حساب جديد
      user = await User.create({ fullName: name, email, googleId, avatar: picture || "" });
    }

    res.json({
      message: "تم تسجيل الدخول بنجاح",
      token: generateToken(user._id),
      user: { id: user._id, fullName: user.fullName, email: user.email, avatar: user.avatar },
    });
  } catch (err) {
    res.status(401).json({ message: "فشل التحقق من حساب جوجل", error: err.message });
  }
});

module.exports = router;
