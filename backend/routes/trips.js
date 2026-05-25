// routes/trips.js
// مسارات الرحلات - العامة للعرض والمحمية للإدارة

const express = require("express");
const Trip = require("../models/Trip");
const { protect, protectSuper } = require("../middleware/authMiddleware");

const router = express.Router();

// ============================================================
// المسارات العامة (للزوار - لا تحتاج تسجيل دخول)
// ============================================================

// GET /api/trips
// جلب كل الرحلات النشطة
router.get("/", async (req, res) => {
  try {
    const trips = await Trip.find({ isActive: true }).select(
      "title destination country shortDescription duration price currency coverImage isFeatured slug availableDates"
    );
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: "خطأ في جلب الرحلات", error: error.message });
  }
});

// GET /api/trips/featured
// جلب الرحلات المميزة للصفحة الرئيسية
router.get("/featured", async (req, res) => {
  try {
    const trips = await Trip.find({ isActive: true, isFeatured: true }).select(
      "title destination country shortDescription duration price currency coverImage slug availableDates"
    );
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: "خطأ في جلب الرحلات المميزة", error: error.message });
  }
});

// GET /api/trips/:slug
// جلب تفاصيل رحلة واحدة بالـ slug
router.get("/:slug", async (req, res) => {
  try {
    const trip = await Trip.findOne({ slug: req.params.slug, isActive: true });

    if (!trip) {
      return res.status(404).json({ message: "الرحلة غير موجودة" });
    }

    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: "خطأ في جلب الرحلة", error: error.message });
  }
});

// ============================================================
// المسارات المحمية (للآدمن فقط - تحتاج توكن)
// ============================================================

// GET /api/trips/admin/all
// جلب كل الرحلات للآدمن (بما فيها غير النشطة)
router.get("/admin/all", protect, async (req, res) => {
  try {
    const trips = await Trip.find().sort({ createdAt: -1 });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: "خطأ في جلب الرحلات", error: error.message });
  }
});

// GET /api/trips/admin/:id
// جلب رحلة واحدة بالـ ID (للتعديل)
router.get("/admin/:id", protect, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: "الرحلة غير موجودة" });
    }
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: "خطأ في جلب الرحلة", error: error.message });
  }
});

// POST /api/trips
// إضافة رحلة جديدة (آدمن فقط)
router.post("/", protectSuper, async (req, res) => {
  try {
    const trip = await Trip.create(req.body);
    res.status(201).json({ message: "تم إضافة الرحلة بنجاح", trip });
  } catch (error) {
    res.status(400).json({ message: "خطأ في إضافة الرحلة", error: error.message });
  }
});

// PUT /api/trips/:id
// تعديل رحلة موجودة (آدمن فقط)
router.put("/:id", protectSuper, async (req, res) => {
  try {
    const updateData = { ...req.body };
    const trip = await Trip.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!trip) {
      return res.status(404).json({ message: "الرحلة غير موجودة" });
    }

    res.json({ message: "تم تعديل الرحلة بنجاح", trip });
  } catch (error) {
    res.status(400).json({ message: "خطأ في تعديل الرحلة", error: error.message });
  }
});

// DELETE /api/trips/:id
// حذف رحلة (آدمن فقط)
router.delete("/:id", protectSuper, async (req, res) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.id);

    if (!trip) {
      return res.status(404).json({ message: "الرحلة غير موجودة" });
    }

    res.json({ message: "تم حذف الرحلة بنجاح" });
  } catch (error) {
    res.status(500).json({ message: "خطأ في حذف الرحلة", error: error.message });
  }
});

module.exports = router;
