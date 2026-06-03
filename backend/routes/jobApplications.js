const express = require("express");
const { Resend } = require("resend");
const JobApplication = require("../models/JobApplication");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

async function notifyNewJobApplication(app) {
  const to = process.env.ADMIN_EMAIL_NOTIFY || process.env.ADMIN_EMAIL;
  if (!to || !process.env.RESEND_API_KEY) return;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to,
    subject: `💼 طلب توظيف جديد — ${app.position}`,
    html: `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:32px 40px;text-align:center;">
            <p style="margin:0 0 4px;color:#a0aec0;font-size:12px;letter-spacing:2px;">رُحى — Ruha</p>
            <h1 style="margin:0;color:#fff;font-size:22px;">طلب توظيف جديد</h1>
            <p style="margin:8px 0 0;color:#63b3ed;font-size:15px;">${app.position}</p>
          </td>
        </tr>
        <tr><td style="padding:32px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#718096;font-size:14px;width:130px;">الاسم</td>
                <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#1a202c;font-size:14px;font-weight:600;">${app.fullName}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#718096;font-size:14px;">الإيميل</td>
                <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#1a202c;font-size:14px;">${app.email}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#718096;font-size:14px;">الهاتف</td>
                <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#1a202c;font-size:14px;">${app.phone}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#718096;font-size:14px;">البلد</td>
                <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#1a202c;font-size:14px;">${app.country}</td></tr>
            ${app.portfolioUrl ? `<tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#718096;font-size:14px;">بورتفوليو</td>
                <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;"><a href="${app.portfolioUrl}">${app.portfolioUrl}</a></td></tr>` : ""}
          </table>
          <div style="background:#f7fafc;border-radius:8px;padding:16px;margin-top:20px;">
            <p style="margin:0 0 8px;font-weight:700;color:#2d3748;font-size:14px;">رسالة المتقدم:</p>
            <p style="margin:0;color:#4a5568;font-size:14px;line-height:1.7;">${app.message}</p>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

// POST /api/job-applications
router.post("/", async (req, res) => {
  try {
    const { fullName, email, phone, country, position, portfolioUrl, message } = req.body;
    const app = await JobApplication.create({ fullName, email, phone, country, position, portfolioUrl: portfolioUrl || "", message });
    res.status(201).json({ message: "تم إرسال طلبك بنجاح! سنتواصل معك قريباً." });
    notifyNewJobApplication(app).catch((err) => console.error("Job application email failed:", err.message));
  } catch (err) {
    res.status(400).json({ message: "خطأ في إرسال الطلب", error: err.message });
  }
});

// GET /api/job-applications (admin)
router.get("/", protect, async (req, res) => {
  try {
    const apps = await JobApplication.find().sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: "خطأ في جلب الطلبات" });
  }
});

// PUT /api/job-applications/:id/status (admin)
router.put("/:id/status", protect, async (req, res) => {
  try {
    const app = await JobApplication.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: "خطأ في تحديث الحالة" });
  }
});

// DELETE /api/job-applications/:id (admin)
router.delete("/:id", protect, async (req, res) => {
  try {
    await JobApplication.findByIdAndDelete(req.params.id);
    res.json({ message: "تم الحذف" });
  } catch (err) {
    res.status(500).json({ message: "خطأ في الحذف" });
  }
});

module.exports = router;
