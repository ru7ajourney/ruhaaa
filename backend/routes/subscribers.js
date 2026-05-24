const express = require("express");
const Subscriber = require("../models/Subscriber");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/subscribers/countries — الدول الموجودة فقط
router.get("/countries", protect, async (req, res) => {
  try {
    const countries = await Subscriber.distinct("country");
    res.json(countries.filter(Boolean).sort());
  } catch (error) {
    res.status(500).json({ message: "خطأ في جلب الدول", error: error.message });
  }
});

// GET /api/subscribers — كل المشتركين مع بحث وفلتر دولة
router.get("/", protect, async (req, res) => {
  try {
    const { q, country, gender } = req.query;
    const filter = {};

    if (q) {
      filter.$or = [
        { fullName: { $regex: q, $options: "i" } },
        { phone:    { $regex: q, $options: "i" } },
        { email:    { $regex: q, $options: "i" } },
      ];
    }
    if (country) filter.country = country;
    if (gender) filter.gender = gender;

    const subscribers = await Subscriber.find(filter).sort({ createdAt: -1 });
    res.json(subscribers);
  } catch (error) {
    res.status(500).json({ message: "خطأ في جلب المشتركين", error: error.message });
  }
});

// DELETE /api/subscribers/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const subscriber = await Subscriber.findByIdAndDelete(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ message: "المشترك غير موجود" });
    }
    res.json({ message: "تم حذف المشترك بنجاح" });
  } catch (error) {
    res.status(500).json({ message: "خطأ في حذف المشترك", error: error.message });
  }
});


module.exports = router;
