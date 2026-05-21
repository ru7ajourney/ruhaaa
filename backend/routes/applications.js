// routes/applications.js
// مسارات طلبات التسجيل في الرحلات

const express = require("express");
const Application = require("../models/Application");
const Trip = require("../models/Trip");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// ==============================
// POST /api/applications
// إرسال طلب تسجيل جديد (عام - بدون تسجيل دخول)
// ==============================
router.post("/", async (req, res) => {
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
    } = req.body;

    // تحقق من وجود الرحلة
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: "الرحلة غير موجودة" });
    }

    // أنشئ الطلب
    const application = await Application.create({
      trip: tripId,
      tripTitle: trip.title,
      fullName,
      country,
      city,
      phone,
      email,
      agreeVolunteering,
      hasEnglish,
      readyForDeposit,
      aboutMe,
    });

    res.status(201).json({
      message: "تم إرسال طلبك بنجاح! سنتواصل معك قريباً.",
      applicationId: application._id,
    });
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
      .populate("trip", "title destination")
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
// PUT /api/applications/:id (آدمن فقط)
// تحديث حالة الطلب وملاحظات الآدمن
// ==============================
router.put("/:id", protect, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status, adminNotes },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ message: "الطلب غير موجود" });
    }

    res.json({ message: "تم تحديث الطلب بنجاح", application });
  } catch (error) {
    res.status(400).json({ message: "خطأ في تحديث الطلب", error: error.message });
  }
});

// ==============================
// DELETE /api/applications/:id (آدمن فقط)
// حذف طلب
// ==============================
router.delete("/:id", protect, async (req, res) => {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);

    if (!application) {
      return res.status(404).json({ message: "الطلب غير موجود" });
    }

    res.json({ message: "تم حذف الطلب بنجاح" });
  } catch (error) {
    res.status(500).json({ message: "خطأ في حذف الطلب", error: error.message });
  }
});

module.exports = router;
