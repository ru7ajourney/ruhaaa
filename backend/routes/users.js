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
  const year = new Date().getFullYear();
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to: email,
    subject: `${otp} — كود تفعيل حسابك في رُحى`,
    html: `<!DOCTYPE html>
<html lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0ede8;font-family:Arial,Helvetica,sans-serif;direction:rtl;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0ede8;padding:40px 16px;">
  <tr><td align="center">
    <table width="500" cellpadding="0" cellspacing="0" border="0" style="max-width:500px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;">

      <tr>
        <td align="center" style="background:#c8622a;padding:36px 40px;">
          <p style="margin:0;font-size:34px;font-weight:800;color:#ffffff;">رُحى</p>
          <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">سفر وتطوع</p>
        </td>
      </tr>

      <tr>
        <td align="center" style="padding:40px 40px 16px;">
          <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#2c4a3e;text-align:center;">مرحباً ${fullName} 👋</p>
          <p style="margin:0;font-size:15px;color:#666;line-height:1.8;text-align:center;">شكراً لانضمامك إلى رُحى<br>أدخل الكود التالي لتفعيل حسابك</p>
        </td>
      </tr>

      <tr>
        <td align="center" style="padding:24px 40px;">
          <table cellpadding="0" cellspacing="0" border="0" style="background:#faf8f5;border:2px dashed #c8622a;border-radius:14px;width:100%;">
            <tr>
              <td align="center" style="padding:28px 20px;">
                <p style="margin:0 0 8px;font-size:12px;color:#999;text-align:center;letter-spacing:2px;">كود التفعيل</p>
                <p style="margin:0;font-size:44px;font-weight:800;color:#c8622a;letter-spacing:16px;text-align:center;">${otp}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td align="center" style="padding:0 40px 32px;">
          <table cellpadding="0" cellspacing="0" border="0" style="background:#fff8f0;border-radius:10px;width:100%;">
            <tr>
              <td align="center" style="padding:16px 20px;">
                <p style="margin:0;font-size:13px;color:#a04e20;line-height:1.8;text-align:center;">
                  ⏱ الكود صالح لمدة <strong>10 دقائق</strong> فقط<br>
                  🔒 لا تشاركه مع أي شخص
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td align="center" style="background:#faf8f5;padding:20px 40px;border-top:1px solid #ece8e1;">
          <p style="margin:0;font-size:12px;color:#aaa;line-height:1.8;text-align:center;">
            إذا لم تطلب هذا الكود، يمكنك تجاهل هذا الإيميل<br>
            © ${year} رُحى — جميع الحقوق محفوظة
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`,
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
