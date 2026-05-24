const express  = require("express");
const router   = express.Router();
const path     = require("path");
const fs       = require("fs");
const multer   = require("multer");
const Gallery  = require("../models/Gallery");
const { protect } = require("../middleware/authMiddleware");

const FEATURED_LIMIT = 4;

// ── multer setup ─────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("الملف يجب أن يكون صورة"));
  },
});

// ── GET /api/gallery  — public ───────────────────────────────
router.get("/", async (req, res) => {
  try {
    const photos = await Gallery.find().sort({ order: 1, createdAt: -1 });
    res.json(photos);
  } catch {
    res.status(500).json({ message: "خطأ في جلب الصور" });
  }
});

// ── GET /api/gallery/featured  — public ─────────────────────
router.get("/featured", async (req, res) => {
  try {
    const photos = await Gallery.find({ isFeatured: true }).sort({ order: 1, createdAt: -1 });
    res.json(photos);
  } catch {
    res.status(500).json({ message: "خطأ في جلب الصور المميزة" });
  }
});

// ── POST /api/gallery/upload  — admin (file upload) ──────────
router.post("/upload", protect, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "لم يتم رفع أي صورة" });

    const { title, isFeatured, order } = req.body;
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    if (isFeatured === "true") {
      const count = await Gallery.countDocuments({ isFeatured: true });
      if (count >= FEATURED_LIMIT) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          message: `الحد الأقصى للصور المميزة هو ${FEATURED_LIMIT} صور فقط`,
        });
      }
    }

    const photo = await Gallery.create({
      imageUrl,
      title:      title || "",
      isFeatured: isFeatured === "true",
      order:      Number(order) || 0,
    });
    res.status(201).json(photo);
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(400).json({ message: err.message || "خطأ في رفع الصورة" });
  }
});

// ── POST /api/gallery  — admin (URL) ─────────────────────────
router.post("/", protect, async (req, res) => {
  try {
    const { imageUrl, title, isFeatured, order, cropArea } = req.body;

    if (isFeatured) {
      const count = await Gallery.countDocuments({ isFeatured: true });
      if (count >= FEATURED_LIMIT) {
        return res.status(400).json({
          message: `الحد الأقصى للصور المميزة هو ${FEATURED_LIMIT} صور فقط`,
        });
      }
    }

    const photo = await Gallery.create({ imageUrl, title, isFeatured, order, cropArea });
    res.status(201).json(photo);
  } catch {
    res.status(400).json({ message: "خطأ في إضافة الصورة" });
  }
});

// ── PATCH /api/gallery/:id  — admin ──────────────────────────
router.patch("/:id", protect, async (req, res) => {
  try {
    if (req.body.isFeatured === true) {
      const count = await Gallery.countDocuments({
        isFeatured: true,
        _id: { $ne: req.params.id },
      });
      if (count >= FEATURED_LIMIT) {
        return res.status(400).json({
          message: `الحد الأقصى للصور المميزة هو ${FEATURED_LIMIT} صور فقط`,
        });
      }
    }

    const photo = await Gallery.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!photo) return res.status(404).json({ message: "الصورة غير موجودة" });
    res.json(photo);
  } catch {
    res.status(400).json({ message: "خطأ في تحديث الصورة" });
  }
});

// ── DELETE /api/gallery/:id  — admin ─────────────────────────
router.delete("/:id", protect, async (req, res) => {
  try {
    const photo = await Gallery.findByIdAndDelete(req.params.id);
    if (!photo) return res.status(404).json({ message: "الصورة غير موجودة" });

    // احذف الملف من الـ uploads لو كانت صورة محلية
    if (photo.imageUrl.includes("/uploads/")) {
      const filename = photo.imageUrl.split("/uploads/")[1];
      const filepath = path.join(__dirname, "../uploads", filename);
      fs.unlink(filepath, () => {});
    }

    res.json({ message: "تم حذف الصورة" });
  } catch {
    res.status(500).json({ message: "خطأ في حذف الصورة" });
  }
});

module.exports = router;
