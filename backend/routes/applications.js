// routes/applications.js
// مسارات طلبات التسجيل في الرحلات

const express = require("express");
const Application = require("../models/Application");
const Trip = require("../models/Trip");
const Subscriber = require("../models/Subscriber");
const PolicyVersion = require("../models/PolicyVersion");
const { protect } = require("../middleware/authMiddleware");
const { protectUser } = require("../middleware/userAuthMiddleware");
const { Resend } = require("resend");

const router = express.Router();

const resend = new Resend(process.env.RESEND_API_KEY);

async function notifyNewApplication(application) {
  const to = process.env.ADMIN_EMAIL_NOTIFY || process.env.ADMIN_EMAIL;
  if (!to || !process.env.RESEND_API_KEY) return;

  const date = new Date(application.createdAt).toLocaleString("ar-SA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to,
    subject: `🌍 طلب تسجيل جديد — ${application.tripTitle}`,
    html: `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);padding:36px 40px;text-align:center;">
            <p style="margin:0 0 6px 0;color:#a0aec0;font-size:13px;letter-spacing:2px;text-transform:uppercase;">رحى — Ruha</p>
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">طلب تسجيل جديد</h1>
            <p style="margin:10px 0 0;color:#63b3ed;font-size:16px;font-weight:600;">${application.tripTitle}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">

            <!-- Alert bar -->
            <div style="background:#ebf8ff;border-right:4px solid #3182ce;border-radius:6px;padding:14px 18px;margin-bottom:28px;">
              <p style="margin:0;color:#2b6cb0;font-size:14px;">وصل طلب جديد بتاريخ <strong>${date}</strong></p>
            </div>

            <!-- Section: معلومات المتقدم -->
            <h3 style="margin:0 0 14px;color:#1a202c;font-size:15px;font-weight:700;border-bottom:2px solid #e2e8f0;padding-bottom:8px;">معلومات المتقدم</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#718096;font-size:14px;width:140px;">الاسم الكامل</td>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#1a202c;font-size:14px;font-weight:600;">${application.fullName}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#718096;font-size:14px;">البلد / المدينة</td>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#1a202c;font-size:14px;">${application.country} — ${application.city}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#718096;font-size:14px;">الجوال</td>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#1a202c;font-size:14px;">${application.phone}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#718096;font-size:14px;">الإيميل</td>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#1a202c;font-size:14px;">${application.email}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#718096;font-size:14px;">الإنستغرام</td>
                <td style="padding:10px 0;color:#e1306c;font-size:14px;">
                  <a href="https://instagram.com/${application.instagram.replace(/^@/, '')}" style="color:#e1306c;text-decoration:none;">
                    ${application.instagram.startsWith('@') ? application.instagram : '@' + application.instagram}
                  </a>
                </td>
              </tr>
            </table>

            <!-- Section: تفاصيل الطلب -->
            <h3 style="margin:0 0 14px;color:#1a202c;font-size:15px;font-weight:700;border-bottom:2px solid #e2e8f0;padding-bottom:8px;">تفاصيل الطلب</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#718096;font-size:14px;width:140px;">التاريخ المفضل</td>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#1a202c;font-size:14px;">${application.preferredDate}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#718096;font-size:14px;">مستعد للعربون</td>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;">
                  <span style="background:${application.readyForDeposit ? "#c6f6d5" : "#fed7d7"};color:${application.readyForDeposit ? "#276749" : "#9b2c2c"};padding:3px 10px;border-radius:20px;font-size:13px;font-weight:600;">
                    ${application.readyForDeposit ? "نعم ✓" : "لا"}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;${application.aboutMe ? "border-bottom:1px solid #f0f0f0;" : ""}color:#718096;font-size:14px;">يتكلم إنجليزي</td>
                <td style="padding:10px 0;${application.aboutMe ? "border-bottom:1px solid #f0f0f0;" : ""}font-size:14px;">
                  <span style="background:${application.hasEnglish ? "#c6f6d5" : "#edf2f7"};color:${application.hasEnglish ? "#276749" : "#4a5568"};padding:3px 10px;border-radius:20px;font-size:13px;font-weight:600;">
                    ${application.hasEnglish ? "نعم ✓" : "لا"}
                  </span>
                </td>
              </tr>
              ${application.aboutMe ? `
              <tr>
                <td style="padding:10px 0;color:#718096;font-size:14px;vertical-align:top;">عن نفسه</td>
                <td style="padding:10px 0;color:#1a202c;font-size:14px;line-height:1.6;">${application.aboutMe}</td>
              </tr>` : ""}
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f7fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;color:#a0aec0;font-size:12px;">رقم الطلب: <span style="font-family:monospace;color:#718096;">${application._id}</span></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  });
}

// ==============================
// POST /api/applications
// إرسال طلب تسجيل جديد (عام - بدون تسجيل دخول)
// ==============================
const optionalUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return next();
  try {
    const jwt = require("jsonwebtoken");
    const User = require("../models/User");
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (user) req.user = user;
  } catch {}
  next();
};

router.post("/", optionalUser, async (req, res) => {
  try {
    const {
      tripId,
      fullName,
      country,
      city,
      phone,
      email,
      agreeVolunteering,
      hasEnglish,
      readyForDeposit,
      aboutMe,
      preferredDate,
      instagram,
      gender,
    } = req.body;

    // تحقق إذا كان المستخدم محظوراً
    if (req.user?.isBanned) {
      return res.status(403).json({ message: "حسابك محظور من التسجيل في الرحلات. للاستفسار تواصل معنا." });
    }

    // تحقق من وجود الرحلة
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: "الرحلة غير موجودة" });
    }

    // جيب آخر نسخة سياسات محفوظة
    const latestPolicy = await PolicyVersion.findOne().sort({ createdAt: -1 }).select("versionName");

    // أنشئ الطلب
    const application = await Application.create({
      trip: tripId,
      tripTitle: trip.title,
      userId: req.user?._id || null,
      fullName,
      country,
      city,
      phone,
      email,
      agreeVolunteering,
      hasEnglish,
      readyForDeposit,
      aboutMe,
      preferredDate: preferredDate || "غير محدد",
      instagram: instagram || "",
      gender,
      agreedPolicyVersion: latestPolicy?.versionName || "",
      history: [{ status: "pending", reason: "تم إرسال الطلب" }],
    });

    res.status(201).json({
      message: "تم إرسال طلبك بنجاح! سنتواصل معك قريباً.",
      applicationId: application._id,
    });

    // حفظ/تحديث المشترك - لو فشل ما يأثر على الطلب
    Subscriber.findOneAndUpdate(
      { $or: [{ email: application.email }, { phone: application.phone }] },
      { fullName, phone, email, country, city, instagram: instagram || "", gender: gender || "", agreedPolicyVersion: latestPolicy?.versionName || "" },
      { upsert: true, new: true }
    ).catch((err) => console.error("Subscriber save failed:", err.message));

    // إشعار بريدي للآدمن - لو فشل ما يأثر على الطلب
    notifyNewApplication(application).catch((err) =>
      console.error("Email notification failed:", err.message)
    );
  } catch (error) {
    res.status(400).json({ message: "خطأ في إرسال الطلب", error: error.message });
  }
});

// ==============================
// GET /api/applications (آدمن فقط)
// جلب كل الطلبات
// ==============================
router.get("/", protect, async (req, res) => {
  try {
    const { status, tripId } = req.query;

    // فلتر اختياري
    const filter = {};
    if (status) filter.status = status;
    if (tripId) filter.trip = tripId;

    const applications = await Application.find(filter)
      .populate("trip", "title destination price currency")
      .sort({ createdAt: -1 }); // الأحدث أولاً

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: "خطأ في جلب الطلبات", error: error.message });
  }
});

// ==============================
// GET /api/applications/:id (آدمن فقط)
// تفاصيل طلب واحد
// ==============================
router.get("/:id", protect, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate(
      "trip",
      "title destination duration price"
    );

    if (!application) {
      return res.status(404).json({ message: "الطلب غير موجود" });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: "خطأ في جلب الطلب", error: error.message });
  }
});

// ==============================
// POST /api/applications/:id/confirm-deposit (آدمن فقط)
// تأكيد دفع العربون
// ==============================
router.post("/:id/confirm-deposit", protect, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ message: "الطلب غير موجود" });

    if (application.status !== "accepted") {
      return res.status(400).json({ message: "لا يمكن تأكيد العربون إلا بعد قبول الطلب" });
    }
    if (application.depositPaid) {
      return res.status(400).json({ message: "العربون مؤكد بالفعل" });
    }

    application.depositPaid = true;
    application.history.push({
      status: application.status,
      reason: "تم تأكيد دفع العربون",
      changedBy: req.admin?.username || req.admin?.name || "",
      changedAt: new Date(),
    });
    await application.save();

    res.json({ message: "تم تأكيد دفع العربون", application });
  } catch (error) {
    res.status(500).json({ message: "خطأ في تأكيد العربون", error: error.message });
  }
});

// ==============================
// PUT /api/applications/:id (آدمن فقط)
// تحديث حالة الطلب وملاحظات الآدمن
// ==============================
router.put("/:id", protect, async (req, res) => {
  try {
    const { status, adminNotes, clientNotes } = req.body;

    const oldApp = await Application.findById(req.params.id);
    if (!oldApp) return res.status(404).json({ message: "الطلب غير موجود" });

    // الحالات المسموحة: pending ↔ accepted ↔ rejected (الأدمن يتحكم بالكامل)
    const VALID = ["pending", "accepted", "rejected"];
    if (status && !VALID.includes(status)) {
      return res.status(400).json({ message: "حالة غير صالحة" });
    }

    const updateFields = {};
    if (adminNotes !== undefined) updateFields.adminNotes = adminNotes;
    if (clientNotes !== undefined) updateFields.clientNotes = clientNotes;

    if (status && status !== oldApp.status) {

      // إذا تم القبول → تحقق أن المقاعد المؤكدة (depositPaid) لم تمتلئ لهذا التاريخ
      if (status === "accepted") {
        const trip = await Trip.findById(oldApp.trip);
        if (trip && oldApp.preferredDate) {
          const fmt = (d) => {
            const dt = new Date(d);
            return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
          };
          const matchedDate = trip.availableDates?.find(
            (d) => `${fmt(d.startDate)} - ${fmt(d.endDate)}` === oldApp.preferredDate
          );
          if (matchedDate) {
            const depositedCount = await Application.countDocuments({
              trip: oldApp.trip,
              preferredDate: oldApp.preferredDate,
              status: "accepted",
              depositPaid: true,
              _id: { $ne: oldApp._id },
            });
            if (depositedCount >= matchedDate.spotsTotal) {
              return res.status(400).json({
                message: `المقاعد المؤكدة لهذا التاريخ ممتلئة (${depositedCount}/${matchedDate.spotsTotal}) — لا يمكن قبول المزيد`,
              });
            }
          }
        }
      }

      updateFields.status = status;

      // إذا تم الرفض وكان العربون مدفوعاً → نلغي العربون ونُرجع المقعد ونطلب ريفند
      if (status === "rejected" && oldApp.depositPaid) {
        updateFields.depositPaid = false;
        updateFields.refundStatus = "required";
      }

      updateFields.$push = {
        history: {
          status,
          reason: adminNotes || "",
          changedBy: req.admin?.username || req.admin?.name || "",
          changedAt: new Date(),
        },
      };
    }

    const application = await Application.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    res.json({ message: "تم تحديث الطلب بنجاح", application });
  } catch (error) {
    res.status(400).json({ message: "خطأ في تحديث الطلب", error: error.message });
  }
});

// ==============================
// POST /api/applications/:id/complete-refund (آدمن فقط)
// تأكيد إتمام الريفند
// ==============================
router.post("/:id/complete-refund", protect, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ message: "الطلب غير موجود" });

    if (application.refundStatus !== "required") {
      return res.status(400).json({ message: "لا يوجد ريفند مطلوب لهذا الطلب" });
    }

    application.refundStatus = "completed";
    application.history.push({
      status: application.status,
      reason: "تم إتمام الريفند",
      changedBy: req.admin?.username || req.admin?.name || "",
      changedAt: new Date(),
    });
    await application.save();

    res.json({ message: "تم تأكيد الريفند", application });
  } catch (error) {
    res.status(500).json({ message: "خطأ في تأكيد الريفند", error: error.message });
  }
});

// ==============================
// DELETE /api/applications/:id (آدمن فقط)
// حذف طلب — ممنوع إذا كان الريفند لم يتم بعد
// ==============================
// PATCH /api/applications/:id/assign-date (آدمن فقط)
// تعيين أو تغيير تاريخ الرحلة للمتقدم
router.post("/:id/assign-date", protect, async (req, res) => {
  try {
    const { dateId } = req.body;
    if (!dateId) return res.status(400).json({ message: "dateId مطلوب" });

    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ message: "الطلب غير موجود" });

    const Trip = require("../models/Trip");
    const trip = await Trip.findById(application.trip);
    if (!trip) return res.status(404).json({ message: "الرحلة غير موجودة" });

    const fmt = (d) => { const dt = new Date(d); return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`; };
    const oldPreferredDate = application.preferredDate;

    // إعادة التعيين لـ "غير متأكد"
    if (dateId === "__unset__") {
      if (application.depositPaid && application.selectedDateId) {
        const oldDate = trip.availableDates.find((d) => d._id.toString() === application.selectedDateId.toString());
        if (oldDate && oldDate.spotsTaken > 0) { oldDate.spotsTaken -= 1; await trip.save(); }
      }
      application.selectedDateId = null;
      application.preferredDate  = "غير متأكد";
      application.history.push({
        status:    application.status,
        reason:    `تم تغيير التاريخ إلى "غير متأكد"${oldPreferredDate && oldPreferredDate !== "غير متأكد" ? ` (كان: ${oldPreferredDate})` : ""}`,
        changedAt: new Date(),
      });
      await application.save();
      return res.json({ message: "تم التحديث", preferredDate: "غير متأكد", selectedDateId: null });
    }

    const selectedDate = trip.availableDates.find((d) => d._id.toString() === String(dateId));
    if (!selectedDate) return res.status(404).json({ message: "التاريخ غير موجود في هذه الرحلة" });

    const dateLabel = `${fmt(selectedDate.startDate)} - ${fmt(selectedDate.endDate)}`;

    // حدّث spotsTaken إذا كان الشخص دفع العربون
    if (application.depositPaid) {
      if (application.selectedDateId) {
        const oldDate = trip.availableDates.find((d) => d._id.toString() === application.selectedDateId.toString());
        if (oldDate && oldDate.spotsTaken > 0) oldDate.spotsTaken -= 1;
      }
      selectedDate.spotsTaken = (selectedDate.spotsTaken || 0) + 1;
      await trip.save();
    }

    application.selectedDateId = dateId;
    application.preferredDate  = dateLabel;

    const paymentNote = application.depositPaid
      ? ` — المدفوع: ${application.paidAmount} ${application.paidCurrency || "USD"}${application.fullyPaid ? " (مكتمل)" : `, المتبقي: ${Math.max(0, (application.trip?.price || 0) - application.paidAmount)} ${application.paidCurrency || "USD"}`}`
      : "";

    application.history.push({
      status:    application.status,
      reason:    oldPreferredDate && oldPreferredDate !== "غير محدد" && oldPreferredDate !== dateLabel
        ? `تم نقل التاريخ من "${oldPreferredDate}" إلى "${dateLabel}"${paymentNote}`
        : `تم تعيين التاريخ: ${dateLabel}${paymentNote}`,
      changedAt: new Date(),
    });

    await application.save();
    res.json({
      message: "تم تعيين التاريخ بنجاح",
      preferredDate: dateLabel,
      selectedDateId: dateId,
    });
  } catch (err) {
    res.status(500).json({ message: "خطأ في تعيين التاريخ", error: err.message });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ message: "الطلب غير موجود" });

    if (application.refundStatus === "required") {
      return res.status(400).json({ message: "لا يمكن حذف هذا الطلب قبل إتمام الريفند" });
    }

    await application.deleteOne();
    res.json({ message: "تم حذف الطلب بنجاح" });
  } catch (error) {
    res.status(500).json({ message: "خطأ في حذف الطلب", error: error.message });
  }
});

// POST /api/applications/migrate/paypal-payments — مؤقت، يُحذف بعد الاستخدام
router.post("/migrate/paypal-payments", protect, async (req, res) => {
  try {
    const toUpdate = await Application.find({
      depositPaid: true,
      paymentMethod: { $in: [null, undefined] },
    });

    if (toUpdate.length === 0) {
      return res.json({ message: "لا يوجد طلبات تحتاج تحديث", updated: 0 });
    }

    const result = await Application.updateMany(
      { depositPaid: true, paymentMethod: { $in: [null, undefined] } },
      { $set: { paymentMethod: "paypal" } }
    );

    res.json({
      message: `تم تحديث ${result.modifiedCount} طلب بنجاح`,
      updated: result.modifiedCount,
      applications: toUpdate.map((a) => ({ name: a.fullName, trip: a.tripTitle, paid: a.paidAmount })),
    });
  } catch (err) {
    res.status(500).json({ message: "خطأ", error: err.message });
  }
});

module.exports = router;
