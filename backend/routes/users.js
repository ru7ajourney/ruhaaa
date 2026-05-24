const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Resend } = require("resend");
const User = require("../models/User");
const Application = require("../models/Application");
const { protectUser } = require("../middleware/userAuthMiddleware");
const { createOrder, captureOrder } = require("../utils/paypal");

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const sendOtpEmail = async (email, otp, fullName) => {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to: email,
    subject: `${otp} — كود تفعيل حسابك في رُحى`,
    html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#faf8f5;border-radius:12px;">
        <h2 style="color:#c8622a;margin-bottom:8px;">رُحى — سفر وتطوع</h2>
        <p style="color:#2d2d2d;font-size:16px;">مرحباً ${fullName}،</p>
        <p style="color:#555;font-size:15px;">كود تفعيل حسابك:</p>
        <div style="background:#fff;border:2px solid #c8622a;border-radius:10px;padding:20px;text-align:center;margin:20px 0;">
          <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#c8622a;">${otp}</span>
        </div>
        <p style="color:#888;font-size:13px;">صالح لمدة 10 دقائق. لا تشاركه مع أحد.</p>
      </div>
    `,
  });
};

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

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 دقائق

    let user = await User.findOne({ email });

    if (user) {
      if (user.isVerified)
        return res.status(400).json({ message: "الإيميل مستخدم بالفعل" });
      // حساب غير مفعّل — حدّث بياناته وأعد الكود
      user.fullName = fullName;
      user.password = password;
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    } else {
      user = await User.create({ fullName, email, password, otp, otpExpires });
    }

    await sendOtpEmail(email, otp, fullName);

    res.status(201).json({
      message: "تم إرسال كود التفعيل على إيميلك",
      email,
    });
  } catch (err) {
    res.status(500).json({ message: "خطأ في السيرفر", error: err.message });
  }
});

// POST /api/users/verify-email
router.post("/verify-email", async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });
    if (user.isVerified) return res.status(400).json({ message: "الحساب مفعّل بالفعل" });
    if (!user.otp || user.otp !== otp)
      return res.status(400).json({ message: "الكود غير صحيح" });
    if (new Date() > user.otpExpires)
      return res.status(400).json({ message: "انتهت صلاحية الكود، اطلب كوداً جديداً" });

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({
      message: "تم تفعيل الحساب بنجاح",
      token: generateToken(user._id),
      user: { id: user._id, fullName: user.fullName, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: "خطأ في السيرفر", error: err.message });
  }
});

// POST /api/users/resend-otp
router.post("/resend-otp", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });
    if (user.isVerified) return res.status(400).json({ message: "الحساب مفعّل بالفعل" });

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtpEmail(email, otp, user.fullName);
    res.json({ message: "تم إرسال كود جديد" });
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

    if (!user.isVerified)
      return res.status(403).json({ message: "يجب تفعيل حسابك أولاً", needsVerification: true, email: user.email });

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
      user = await User.create({ fullName: name, email, googleId, avatar: picture || "", isVerified: true });
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
