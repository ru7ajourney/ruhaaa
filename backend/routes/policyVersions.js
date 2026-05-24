const express = require("express");
const PolicyVersion = require("../models/PolicyVersion");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

function generateVersionName() {
  const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" });
  const d = new Date(now);
  const year    = d.getFullYear();
  const month   = d.getMonth() + 1;
  const day     = String(d.getDate()).padStart(2, "0");
  const hour    = String(d.getHours()).padStart(2, "0");
  const minute  = String(d.getMinutes()).padStart(2, "0");
  return `${year}v${month}.${day}${hour}.${minute}`;
}

// GET /api/policy-versions — كل النسخ (بدون المحتوى للتخفيف)
router.get("/", protect, async (req, res) => {
  try {
    const versions = await PolicyVersion.find({}, "versionName createdAt").sort({ createdAt: -1 });
    res.json(versions);
  } catch (err) {
    res.status(500).json({ message: "خطأ في جلب النسخ", error: err.message });
  }
});

// GET /api/policy-versions/:id — محتوى نسخة معينة
router.get("/:id", protect, async (req, res) => {
  try {
    const version = await PolicyVersion.findById(req.params.id);
    if (!version) return res.status(404).json({ message: "النسخة غير موجودة" });
    res.json(version);
  } catch (err) {
    res.status(500).json({ message: "خطأ في جلب النسخة", error: err.message });
  }
});

// POST /api/policy-versions — حفظ نسخة جديدة
router.post("/", protect, async (req, res) => {
  try {
    const { policies } = req.body;
    const versionName = generateVersionName();
    const version = await PolicyVersion.create({ versionName, policies });
    res.status(201).json(version);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "نسخة بنفس الاسم موجودة بالفعل، انتظر دقيقة وأعد المحاولة" });
    }
    res.status(500).json({ message: "خطأ في حفظ النسخة", error: err.message });
  }
});

// DELETE /api/policy-versions/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const version = await PolicyVersion.findByIdAndDelete(req.params.id);
    if (!version) return res.status(404).json({ message: "النسخة غير موجودة" });
    res.json({ message: "تم حذف النسخة" });
  } catch (err) {
    res.status(500).json({ message: "خطأ في الحذف", error: err.message });
  }
});

module.exports = router;
