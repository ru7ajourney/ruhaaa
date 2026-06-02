const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const twilio = require("twilio");
const { Resend } = require("resend");
const User = require("../models/User");
const PhoneOtpTemp = require("../models/PhoneOtpTemp");
const Application = require("../models/Application");
const Trip = require("../models/Trip");
const { protectUser } = require("../middleware/userAuthMiddleware");
const { protect: protectAdmin } = require("../middleware/authMiddleware");
const { createOrder, captureOrder } = require("../utils/paypal");

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const sendPaymentConfirmationEmail = async ({ email, fullName, tripTitle, amountPaid, currency, totalPaid, tripPrice, fullyPaid, isDeposit }) => {
  if (!process.env.RESEND_API_KEY) return;
  const year = new Date().getFullYear();
  const remaining = Math.max(0, (tripPrice || 0) - (totalPaid || 0));
  const paymentType = isDeposit ? "العربون" : fullyPaid ? "إكمال الدفع بالكامل" : "دفعة جزئية";
  const headerColor = fullyPaid ? "linear-gradient(145deg,#15803d 0%,#166534 100%)" : "linear-gradient(145deg,#c8622a 0%,#a04e20 100%)";
  const headerIcon = fullyPaid ? "🎉" : "💳";

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to: email,
    subject: fullyPaid
      ? `🎉 تم إكمال دفع رحلتك — ${tripTitle}`
      : `💳 تم استلام دفعتك — ${tripTitle}`,
    html: `<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link href="https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f0ede8;font-family:Arial,Helvetica,sans-serif;direction:rtl;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0ede8;padding:48px 16px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.10);">

      <!-- HEADER -->
      <tr>
        <td align="center" style="background:${headerColor};padding:44px 40px 36px;">
          <p style="margin:0;font-family:'Aref Ruqaa',Georgia,serif;font-size:48px;font-weight:700;color:#ffffff;line-height:1;">رُحى</p>
          <p style="margin:8px 0 0;font-size:16px;color:rgba(255,255,255,0.75);letter-spacing:3px;">سفر &nbsp;•&nbsp; تطوع &nbsp;•&nbsp; اكتشاف</p>
          <table cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
            <tr>
              <td style="background:rgba(255,255,255,0.15);border-radius:20px;padding:8px 24px;">
                <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.95);">${headerIcon} ${paymentType}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- GREETING -->
      <tr>
        <td align="center" style="padding:44px 48px 8px;">
          <p style="margin:0 0 12px;font-size:24px;font-weight:700;color:#2c4a3e;text-align:center;">
            ${fullyPaid ? "مبروك! 🎉 اكتمل دفعك" : `أهلاً، ${fullName}!`}
          </p>
          <p style="margin:0;font-size:16px;color:#555;line-height:2;text-align:center;">
            ${fullyPaid
              ? `تم استلام كامل مبلغ رحلة <strong>${tripTitle}</strong><br>نحن متحمسون لرحلتك القادمة!`
              : `تم استلام دفعتك لرحلة <strong>${tripTitle}</strong><br>شكراً لثقتك بنا.`
            }
          </p>
        </td>
      </tr>

      <!-- DIVIDER -->
      <tr>
        <td align="center" style="padding:28px 48px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="border-top:1px solid #ece8e1;"></td></tr>
          </table>
        </td>
      </tr>

      <!-- PAYMENT DETAILS -->
      <tr>
        <td style="padding:32px 48px;">
          <p style="margin:0 0 20px;font-size:15px;font-weight:700;color:#2c4a3e;">تفاصيل الدفعة</p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf8f5;border-radius:12px;border:1px solid #ece8e1;">
            <tr>
              <td style="padding:14px 20px;border-bottom:1px solid #ece8e1;color:#888;font-size:14px;">المبلغ المدفوع الآن</td>
              <td style="padding:14px 20px;border-bottom:1px solid #ece8e1;text-align:left;font-size:18px;font-weight:800;color:#c8622a;">${amountPaid} ${currency}</td>
            </tr>
            <tr>
              <td style="padding:14px 20px;border-bottom:1px solid #ece8e1;color:#888;font-size:14px;">إجمالي المدفوع</td>
              <td style="padding:14px 20px;border-bottom:1px solid #ece8e1;text-align:left;font-size:15px;font-weight:700;color:#2c4a3e;">${totalPaid} ${currency}</td>
            </tr>
            ${tripPrice ? `
            <tr>
              <td style="padding:14px 20px;border-bottom:1px solid #ece8e1;color:#888;font-size:14px;">سعر الرحلة الكلي</td>
              <td style="padding:14px 20px;border-bottom:1px solid #ece8e1;text-align:left;font-size:14px;color:#555;">${tripPrice} ${currency}</td>
            </tr>
            <tr>
              <td style="padding:14px 20px;color:#888;font-size:14px;">المبلغ المتبقي</td>
              <td style="padding:14px 20px;text-align:left;font-size:15px;font-weight:700;color:${remaining > 0 ? "#b45309" : "#15803d"};">${remaining > 0 ? `${remaining} ${currency}` : "✅ مكتمل"}</td>
            </tr>` : ""}
          </table>
        </td>
      </tr>

      ${fullyPaid ? `
      <!-- CONGRATS -->
      <tr>
        <td align="center" style="padding:0 48px 40px;">
          <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:12px;border:1px solid #bbf7d0;">
            <tr>
              <td align="center" style="padding:20px 24px;">
                <p style="margin:0;font-size:15px;color:#15803d;line-height:2;text-align:center;">
                  🎉 &nbsp;تم إكمال دفع رحلتك بالكامل!<br>
                  سيتواصل معك الفريق قريباً لمشاركة تفاصيل الرحلة.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>` : `
      <!-- REMINDER -->
      <tr>
        <td align="center" style="padding:0 48px 40px;">
          <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#fdf6f0;border-radius:12px;border:1px solid #f5dece;">
            <tr>
              <td align="center" style="padding:18px 24px;">
                <p style="margin:0;font-size:14px;color:#b06030;line-height:2.2;text-align:center;">
                  ${isDeposit ? "✅ &nbsp;تم حجز مقعدك رسمياً في الرحلة." : ""}
                  ${remaining > 0 ? `<br>💰 &nbsp;المبلغ المتبقي <strong>${remaining} ${currency}</strong> — يمكنك دفعه على دفعات.` : ""}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`}

      <!-- FOOTER -->
      <tr>
        <td align="center" style="background:#faf8f5;padding:24px 48px;border-top:1px solid #ece8e1;">
          <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#c8622a;text-align:center;">رُحى — سفر وتطوع</p>
          <p style="margin:0;font-size:14px;color:#999;line-height:2.2;text-align:center;">
            © ${year} رُحى &nbsp;·&nbsp; جميع الحقوق محفوظة
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

const notifyAdminFullPayment = async ({ fullName, email, tripTitle, totalPaid, currency }) => {
  const to = process.env.ADMIN_EMAIL_NOTIFY || process.env.ADMIN_EMAIL;
  if (!to || !process.env.RESEND_API_KEY) return;
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to,
    subject: `💰 إكمال دفع كامل — ${fullName} — ${tripTitle}`,
    html: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#15803d 0%,#166534 100%);padding:36px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">💰 إكمال دفع كامل</h1>
            <p style="margin:10px 0 0;color:#bbf7d0;font-size:16px;">${tripTitle}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#718096;font-size:14px;width:160px;">الاسم</td>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#1a202c;font-size:14px;font-weight:600;">${fullName}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#718096;font-size:14px;">الإيميل</td>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#1a202c;font-size:14px;">${email}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#718096;font-size:14px;">إجمالي المدفوع</td>
                <td style="padding:10px 0;font-size:18px;font-weight:800;color:#15803d;">${totalPaid} ${currency}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f0fdf4;padding:20px 40px;border-top:1px solid #bbf7d0;text-align:center;">
            <p style="margin:0;color:#15803d;font-size:14px;font-weight:600;">✅ أكمل هذا المتقدم دفع كامل مبلغ الرحلة</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
};

const sendOtpEmail = async (email, otp, fullName) => {
  const year = new Date().getFullYear();
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to: email,
    subject: `${otp} — كود تفعيل حسابك في رُحى`,
    html: `<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link href="https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f0ede8;font-family:Arial,Helvetica,sans-serif;direction:rtl;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0ede8;padding:48px 16px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.10);">

      <!-- HEADER -->
      <tr>
        <td align="center" style="background:linear-gradient(145deg,#c8622a 0%,#a04e20 100%);padding:44px 40px 36px;">
          <p style="margin:0;font-family:'Aref Ruqaa',Georgia,serif;font-size:48px;font-weight:700;color:#ffffff;line-height:1;">رُحى</p>
          <p style="margin:8px 0 0;font-size:16px;color:rgba(255,255,255,0.75);letter-spacing:3px;">سفر &nbsp;•&nbsp; تطوع &nbsp;•&nbsp; اكتشاف</p>
          <table cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
            <tr>
              <td style="background:rgba(255,255,255,0.15);border-radius:20px;padding:8px 24px;">
                <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.95);">تفعيل الحساب</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- GREETING -->
      <tr>
        <td align="center" style="padding:44px 48px 8px;">
          <p style="margin:0 0 12px;font-size:24px;font-weight:700;color:#2c4a3e;text-align:center;">أهلاً وسهلاً، ${fullName}! 🌍</p>
          <p style="margin:0;font-size:17px;color:#555;line-height:2;text-align:center;">
            يسعدنا انضمامك إلى عائلة رُحى —<br>
            خطوة واحدة تفصلك عن عالم من التجارب والمغامرات.
          </p>
        </td>
      </tr>

      <!-- DIVIDER -->
      <tr>
        <td align="center" style="padding:28px 48px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="border-top:1px solid #ece8e1;"></td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- OTP BOX -->
      <tr>
        <td align="center" style="padding:32px 48px;">
          <p style="margin:0 0 20px;font-size:16px;color:#999;text-align:center;letter-spacing:1px;">— كود التفعيل الخاص بك —</p>
          <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:linear-gradient(135deg,#fff8f4,#faf3ee);border:2px solid #e8b49a;border-radius:16px;">
            <tr>
              <td align="center" style="padding:32px 24px;">
                <p style="margin:0;font-size:52px;font-weight:800;color:#c8622a;letter-spacing:20px;text-align:center;font-family:Arial,Helvetica,sans-serif;">${otp}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- WARNING -->
      <tr>
        <td align="center" style="padding:0 48px 40px;">
          <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#fdf6f0;border-radius:12px;border:1px solid #f5dece;">
            <tr>
              <td align="center" style="padding:18px 24px;">
                <p style="margin:0;font-size:15px;color:#b06030;line-height:2.2;text-align:center;">
                  ⏳ &nbsp;صالح لمدة <strong>10 دقائق</strong> فقط — لا تتأخر!<br>
                  🔐 &nbsp;هذا الكود سري، لا تشاركه مع أحد.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td align="center" style="background:#faf8f5;padding:24px 48px;border-top:1px solid #ece8e1;">
          <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#c8622a;text-align:center;">رُحى — سفر وتطوع</p>
          <p style="margin:0;font-size:14px;color:#999;line-height:2.2;text-align:center;">
            إن لم تكن أنت من طلب هذا الكود، يمكنك تجاهل هذا البريد بأمان تام.<br>
            © ${year} رُحى &nbsp;·&nbsp; جميع الحقوق محفوظة
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

const sendResetEmail = async (email, otp, fullName) => {
  const year = new Date().getFullYear();
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to: email,
    subject: `${otp} — كود إعادة تعيين كلمة المرور في رُحى`,
    html: `<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link href="https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f0ede8;font-family:Arial,Helvetica,sans-serif;direction:rtl;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0ede8;padding:48px 16px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.10);">
      <tr>
        <td align="center" style="background:linear-gradient(145deg,#c8622a 0%,#a04e20 100%);padding:44px 40px 36px;">
          <p style="margin:0;font-family:'Aref Ruqaa',Georgia,serif;font-size:48px;font-weight:700;color:#ffffff;line-height:1;">رُحى</p>
          <p style="margin:8px 0 0;font-size:16px;color:rgba(255,255,255,0.75);letter-spacing:3px;">سفر &nbsp;•&nbsp; تطوع &nbsp;•&nbsp; اكتشاف</p>
          <table cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
            <tr>
              <td style="background:rgba(255,255,255,0.15);border-radius:20px;padding:8px 24px;">
                <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.95);">إعادة تعيين كلمة المرور</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding:44px 48px 8px;">
          <p style="margin:0 0 12px;font-size:24px;font-weight:700;color:#2c4a3e;text-align:center;">مرحباً، ${fullName}</p>
          <p style="margin:0;font-size:17px;color:#555;line-height:2;text-align:center;">
            تلقينا طلباً لإعادة تعيين كلمة مرور حسابك في رُحى.<br>
            استخدم الكود أدناه لإتمام العملية.
          </p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding:28px 48px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid #ece8e1;"></td></tr></table>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding:32px 48px;">
          <p style="margin:0 0 20px;font-size:16px;color:#999;text-align:center;letter-spacing:1px;">— كود إعادة التعيين —</p>
          <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:linear-gradient(135deg,#fff8f4,#faf3ee);border:2px solid #e8b49a;border-radius:16px;">
            <tr>
              <td align="center" style="padding:32px 24px;">
                <p style="margin:0;font-size:52px;font-weight:800;color:#c8622a;letter-spacing:20px;text-align:center;font-family:Arial,Helvetica,sans-serif;">${otp}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding:0 48px 40px;">
          <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#fdf6f0;border-radius:12px;border:1px solid #f5dece;">
            <tr>
              <td align="center" style="padding:18px 24px;">
                <p style="margin:0;font-size:15px;color:#b06030;line-height:2.2;text-align:center;">
                  ⏳ &nbsp;صالح لمدة <strong>10 دقائق</strong> فقط.<br>
                  🔐 &nbsp;إن لم تطلب هذا، تجاهل الرسالة — حسابك بأمان.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center" style="background:#faf8f5;padding:24px 48px;border-top:1px solid #ece8e1;">
          <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#c8622a;text-align:center;">رُحى — سفر وتطوع</p>
          <p style="margin:0;font-size:14px;color:#999;line-height:2.2;text-align:center;">© ${year} رُحى &nbsp;·&nbsp; جميع الحقوق محفوظة</p>
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
  const { fullName, email, password, country } = req.body;
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
      if (country) user.country = country;
      await user.save();
    } else {
      user = await User.create({ fullName, email, password, otp, otpExpires, country: country || "" });
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

// POST /api/users/forgot-password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email, isVerified: true });
    if (!user)
      return res.status(404).json({ message: "لا يوجد حساب مرتبط بهذا الإيميل" });

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendResetEmail(email, otp, user.fullName);
    res.json({ message: "تم إرسال كود إعادة التعيين على إيميلك" });
  } catch (err) {
    res.status(500).json({ message: "خطأ في السيرفر", error: err.message });
  }
});

// POST /api/users/reset-password
router.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });
    if (!user.otp || user.otp !== otp)
      return res.status(400).json({ message: "الكود غير صحيح" });
    if (new Date() > user.otpExpires)
      return res.status(400).json({ message: "انتهت صلاحية الكود، اطلب كوداً جديداً" });
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });

    user.password = newPassword;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({ message: "تم تغيير كلمة المرور بنجاح" });
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

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const daysLeft = (changedAt) => {
  if (!changedAt) return 0;
  const diff = THIRTY_DAYS_MS - (Date.now() - new Date(changedAt));
  return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
};
const buildUserPayload = (u) => {
  const isPhoneUser = u.email?.endsWith("@ruha.internal");
  return {
    id:       u._id,
    fullName: u.fullName,
    email:    isPhoneUser ? null : u.email,
    phone:    u.phone || null,
    isPhoneUser,
    nameChangedAt:  u.nameChangedAt  || null,
    phoneChangedAt: u.phoneChangedAt || null,
    nameDaysLeft:   daysLeft(u.nameChangedAt),
    phoneDaysLeft:  daysLeft(u.phoneChangedAt),
  };
};

// GET /api/users/me
router.get("/me", protectUser, (req, res) => {
  res.json({
    user:  buildUserPayload(req.user),
    token: generateToken(req.user._id),
  });
});

// PUT /api/users/profile/name
router.put("/profile/name", protectUser, async (req, res) => {
  try {
    const { fullName } = req.body;
    if (!fullName?.trim()) return res.status(400).json({ message: "الاسم مطلوب" });
    if (daysLeft(req.user.nameChangedAt) > 0)
      return res.status(400).json({ message: `لا يمكن تغيير الاسم — يتاح بعد ${daysLeft(req.user.nameChangedAt)} يوم` });
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { fullName: fullName.trim(), nameChangedAt: new Date() },
      { new: true }
    );
    res.json({ user: buildUserPayload(updated) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/profile/phone  (لمستخدمي الإيميل فقط)
router.put("/profile/phone", protectUser, async (req, res) => {
  try {
    const isPhoneUser = req.user.email?.endsWith("@ruha.internal");
    if (isPhoneUser) return res.status(400).json({ message: "لا يمكن تغيير رقم الهاتف من هنا" });
    if (daysLeft(req.user.phoneChangedAt) > 0)
      return res.status(400).json({ message: `لا يمكن تغيير الرقم — يتاح بعد ${daysLeft(req.user.phoneChangedAt)} يوم` });
    const { phone } = req.body;
    let normalized = null;
    if (phone?.trim()) {
      normalized = normalizePhone(phone);
      const taken = await User.findOne({ phone: normalized, _id: { $ne: req.user._id } });
      if (taken) return res.status(400).json({ message: "هذا الرقم مرتبط بحساب آخر" });
    }
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { phone: normalized, phoneChangedAt: new Date() },
      { new: true }
    );
    res.json({ user: buildUserPayload(updated) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/profile/request-email  (لمستخدمي الهاتف لإضافة إيميل)
router.post("/profile/request-email", protectUser, async (req, res) => {
  try {
    const isPhoneUser = req.user.email?.endsWith("@ruha.internal");
    if (!isPhoneUser) return res.status(400).json({ message: "حسابك مرتبط بإيميل بالفعل" });
    const { email } = req.body;
    if (!email?.trim()) return res.status(400).json({ message: "الإيميل مطلوب" });
    const normalized = email.trim().toLowerCase();
    const taken = await User.findOne({ email: normalized });
    if (taken) return res.status(400).json({ message: "هذا الإيميل مستخدم بحساب آخر" });
    const otp = generateOtp();
    await User.findByIdAndUpdate(req.user._id, {
      pendingEmail:           normalized,
      pendingEmailOtp:        otp,
      pendingEmailOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
    });
    await sendOtpEmail(normalized, otp, req.user.fullName);
    res.json({ message: "تم إرسال كود التحقق إلى الإيميل" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/profile/verify-email
router.post("/profile/verify-email", protectUser, async (req, res) => {
  try {
    const { otp } = req.body;
    const u = await User.findById(req.user._id);
    if (!u.pendingEmail || !u.pendingEmailOtp) return res.status(400).json({ message: "لا يوجد طلب تحقق نشط" });
    if (u.pendingEmailOtp !== otp) return res.status(400).json({ message: "الكود غير صحيح" });
    if (new Date() > u.pendingEmailOtpExpires) return res.status(400).json({ message: "انتهت صلاحية الكود" });
    const updated = await User.findByIdAndUpdate(
      u._id,
      { email: u.pendingEmail, pendingEmail: null, pendingEmailOtp: null, pendingEmailOtpExpires: null },
      { new: true }
    );
    res.json({ user: buildUserPayload(updated) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/my-applications — جلب طلبات المستخدم بالإيميل
router.get("/my-applications", protectUser, async (req, res) => {
  try {
    const applications = await Application.find({
      $or: [{ userId: req.user._id }, { email: req.user.email }],
    })
      .populate("trip", "title destination coverImage duration price currency slug availableDates")
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
    }).populate("trip", "price");

    if (!application) return res.status(404).json({ message: "الطلب غير موجود" });
    if (application.status === "rejected")
      return res.status(400).json({ message: "لا يمكن الدفع لطلب مرفوض" });
    if (application.fullyPaid)
      return res.status(400).json({ message: "تم دفع كامل مبلغ الرحلة بالفعل" });

    const tripPrice = application.trip?.price || 0;
    const requestedAmount = Number(amount);

    if (!application.depositPaid) {
      const minDeposit = Math.round(tripPrice * 0.3);
      if (!requestedAmount || requestedAmount < minDeposit) {
        return res.status(400).json({ message: `الحد الأدنى للعربون هو ${minDeposit} USD` });
      }
    } else {
      if (!requestedAmount || requestedAmount < 1) {
        return res.status(400).json({ message: "المبلغ يجب أن يكون 1 USD على الأقل" });
      }
    }

    const order = await createOrder(requestedAmount, currency || "USD", application._id.toString());
    res.json({ orderId: order.id });
  } catch (err) {
    res.status(500).json({ message: "خطأ في إنشاء طلب الدفع", error: err.message });
  }
});

// POST /api/users/applications/:id/capture-paypal-order
router.post("/applications/:id/capture-paypal-order", protectUser, async (req, res) => {
  try {
    const { orderId } = req.body;
    const application = await Application.findOne({
      _id: req.params.id,
      $or: [{ userId: req.user._id }, { email: req.user.email }],
    }).populate("trip", "price title currency");

    if (!application) return res.status(404).json({ message: "الطلب غير موجود" });
    if (application.fullyPaid) return res.status(400).json({ message: "تم دفع كامل مبلغ الرحلة بالفعل" });

    const capture = await captureOrder(orderId);

    if (capture.status !== "COMPLETED") {
      return res.status(400).json({ message: "لم يتم تأكيد الدفع من PayPal" });
    }

    const capturedAmount = parseFloat(
      capture.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || "0"
    );
    const capturedCurrency =
      capture.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.currency_code || "USD";

    const tripPrice = application.trip?.price || 0;

    if (!application.depositPaid) {
      // أول دفعة — العربون
      const minDeposit = Math.round(tripPrice * 0.3);
      if (capturedAmount < minDeposit) {
        return res.status(400).json({
          message: `المبلغ المدفوع (${capturedAmount}) أقل من الحد الأدنى للعربون (${minDeposit})`,
        });
      }
      application.depositPaid = true;
      application.paidAmount = capturedAmount;
      application.paidCurrency = capturedCurrency;
      application.paymentMethod = "paypal";
      application.status = "accepted";
      application.history.push({
        status: "accepted",
        reason: `تم حجز المقعد تلقائياً بعد الدفع عبر PayPal — ${capturedAmount} ${capturedCurrency} — Order: ${orderId}`,
        changedAt: new Date(),
      });
    } else {
      // دفعة إضافية — إكمال المبلغ
      application.paidAmount = Math.round(((application.paidAmount || 0) + capturedAmount) * 100) / 100;
      if (tripPrice > 0 && application.paidAmount >= tripPrice) {
        application.fullyPaid = true;
      }
      application.history.push({
        status: application.status,
        reason: `دفعة إضافية عبر PayPal — ${capturedAmount} ${capturedCurrency} — إجمالي المدفوع: ${application.paidAmount} — Order: ${orderId}`,
        changedAt: new Date(),
      });
    }

    await application.save();

    const currency = application.paidCurrency || application.trip?.currency || "USD";

    // إيميل تأكيد للمستخدم
    sendPaymentConfirmationEmail({
      email: application.email,
      fullName: application.fullName,
      tripTitle: application.tripTitle,
      amountPaid: capturedAmount,
      currency,
      totalPaid: application.paidAmount,
      tripPrice,
      fullyPaid: application.fullyPaid,
      isDeposit: !application.depositPaid || (application.depositPaid && application.paidAmount === capturedAmount),
    }).catch((e) => console.error("Payment email failed:", e.message));

    // إشعار للأدمن عند إكمال الدفع كاملاً
    if (application.fullyPaid) {
      notifyAdminFullPayment({
        fullName: application.fullName,
        email: application.email,
        tripTitle: application.tripTitle,
        totalPaid: application.paidAmount,
        currency,
      }).catch((e) => console.error("Admin payment notification failed:", e.message));
    }

    res.json({
      message: application.fullyPaid ? "تم إكمال الدفع بالكامل! 🎉" : "تم الدفع بنجاح، حُجز مقعدك!",
      fullyPaid: application.fullyPaid,
    });
  } catch (err) {
    res.status(500).json({ message: "خطأ في تأكيد الدفع", error: err.message });
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

// GET /api/users/admin/all — جلب جميع المستخدمين (أدمن فقط)
router.get("/admin/all", protectAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password -otp -otpExpires")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "خطأ في السيرفر", error: err.message });
  }
});

// PATCH /api/users/admin/:id — تعديل مستخدم (أدمن)
router.patch("/admin/:id", protectAdmin, async (req, res) => {
  try {
    const { fullName, email, isVerified } = req.body;
    const update = {};
    if (fullName !== undefined) update.fullName = fullName.trim();
    if (email    !== undefined) update.email    = email.trim().toLowerCase();
    if (isVerified !== undefined) update.isVerified = isVerified;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    ).select("-password -otp -otpExpires");

    if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });
    res.json(user);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: "الإيميل مستخدم بالفعل" });
    res.status(500).json({ message: "خطأ في السيرفر", error: err.message });
  }
});

// POST /api/users/admin/:id/ban — تعليق/رفع تعليق مستخدم (أدمن)
router.post("/admin/:id/ban", protectAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });
    user.isBanned = !user.isBanned;
    await user.save();
    res.json({ isBanned: user.isBanned });
  } catch (err) {
    res.status(500).json({ message: "خطأ في السيرفر", error: err.message });
  }
});

// DELETE /api/users/admin/:id — حذف مستخدم (أدمن)
router.delete("/admin/:id", protectAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });
    res.json({ message: "تم حذف المستخدم" });
  } catch (err) {
    res.status(500).json({ message: "خطأ في السيرفر", error: err.message });
  }
});

// ==============================
// Phone (WhatsApp OTP) Auth
// ==============================

const normalizePhone = (p) => {
  let s = String(p).replace(/[\s\-\(\)]/g, "");
  if (!s.startsWith("+")) s = "+" + s;
  return s;
};

const sendWhatsAppOtp = async (phone, otp) => {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_WHATSAPP_FROM;
  if (!sid || !token || !from) throw new Error("Twilio غير مفعّل — أضف متغيرات البيئة");
  const client = twilio(sid, token);
  await client.messages.create({
    from: `whatsapp:${from}`,
    to:   `whatsapp:${phone}`,
    body: `كود التحقق لـ *رُحى*: ${otp}\n⏳ ينتهي خلال 10 دقائق.`,
  });
};

// POST /api/users/phone-send-otp
router.post("/phone-send-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: "رقم الهاتف مطلوب" });

    const normalized = normalizePhone(phone);
    const otp        = generateOtp();
    const expires    = new Date(Date.now() + 10 * 60 * 1000);

    const existing = await User.findOne({ phone: normalized });

    if (existing) {
      existing.phoneOtp        = otp;
      existing.phoneOtpExpires = expires;
      await existing.save();
    } else {
      await PhoneOtpTemp.findOneAndUpdate(
        { phone: normalized },
        { otp, createdAt: new Date() },
        { upsert: true }
      );
    }

    await sendWhatsAppOtp(normalized, otp);

    res.json({ message: "تم إرسال الكود على واتساب", exists: !!existing });
  } catch (err) {
    console.error("phone-send-otp:", err.message);
    res.status(500).json({ message: err.message || "فشل إرسال الكود" });
  }
});

// POST /api/users/phone-verify-otp
router.post("/phone-verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: "الهاتف والكود مطلوبان" });

    const normalized = normalizePhone(phone);

    const existing = await User.findOne({ phone: normalized });

    if (existing) {
      if (!existing.phoneOtp || existing.phoneOtp !== otp)
        return res.status(400).json({ message: "الكود غير صحيح" });
      if (new Date() > existing.phoneOtpExpires)
        return res.status(400).json({ message: "انتهت صلاحية الكود، اطلب كوداً جديداً" });
      if (existing.isBanned)
        return res.status(403).json({ message: "تم تعليق هذا الحساب" });

      existing.phoneOtp        = null;
      existing.phoneOtpExpires = null;
      await existing.save();

      return res.json({
        token: generateToken(existing._id),
        user:  { id: existing._id, fullName: existing.fullName, email: existing.email, phone: existing.phone },
      });
    }

    const temp = await PhoneOtpTemp.findOne({ phone: normalized });
    if (!temp || temp.otp !== otp)
      return res.status(400).json({ message: "الكود غير صحيح" });

    await PhoneOtpTemp.deleteOne({ phone: normalized });

    const regToken = jwt.sign(
      { phone: normalized, purpose: "phone-registration" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ needsName: true, registrationToken: regToken });
  } catch (err) {
    console.error("phone-verify-otp:", err.message);
    res.status(500).json({ message: "خطأ في التحقق" });
  }
});

// POST /api/users/phone-complete
router.post("/phone-complete", async (req, res) => {
  try {
    const { registrationToken, fullName, country } = req.body;
    if (!registrationToken || !fullName?.trim())
      return res.status(400).json({ message: "الاسم ورمز التسجيل مطلوبان" });

    let decoded;
    try {
      decoded = jwt.verify(registrationToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: "انتهت صلاحية جلسة التسجيل، ابدأ من جديد" });
    }
    if (decoded.purpose !== "phone-registration")
      return res.status(400).json({ message: "رمز غير صالح" });

    const { phone } = decoded;
    const internalEmail = `phone_${phone.replace(/\+/g, "")}@ruha.internal`;

    // تحقق من وجود مستخدم بالرقم أو الإيميل الداخلي (يمنع duplicate key)
    const existing = await User.findOne({ $or: [{ phone }, { email: internalEmail }] });
    if (existing) {
      return res.json({
        token: generateToken(existing._id),
        user:  { id: existing._id, fullName: existing.fullName, email: existing.email, phone: existing.phone },
      });
    }

    const user = await User.create({
      fullName:   fullName.trim(),
      email:      internalEmail,
      phone,
      country:    country || "",
      isVerified: true,
    });

    res.status(201).json({
      token: generateToken(user._id),
      user:  { id: user._id, fullName: user.fullName, email: user.email, phone: user.phone },
    });
  } catch (err) {
    console.error("phone-complete error:", err.code, err.message);
    const msg = err.code === 11000
      ? "هذا الرقم مرتبط بحساب موجود، حاول تسجيل الدخول"
      : "خطأ في إنشاء الحساب";
    res.status(500).json({ message: msg, detail: err.message });
  }
});

module.exports = router;
