// routes/admins.js
// إدارة الأدمنز — متاحة للمدير الأعلى فقط

const express = require("express");
const Admin = require("../models/Admin");
const { protectSuper } = require("../middleware/authMiddleware");

const router = express.Router();

// جميع المسارات محمية بـ protectSuper
router.use(protectSuper);

// ==============================
// GET /api/admins
// جلب كل الأدمنز
// ==============================
router.get("/", async (req, res) => {
  try {
    const admins = await Admin.find().select("-password").sort({ createdAt: -1 });
    res.json({ admins });
  } catch (error) {
    res.status(500).json({ message: "خطأ في السيرفر", error: error.message });
  }
});

// ==============================
// POST /api/admins
// إضافة أدمن جديد
// ==============================
router.post("/", async (req, res) => {
  const { email, password, name, username, role } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ message: "الإيميل وكلمة المرور والاسم المستخدم مطلوبة" });
  }

  try {
    const exists = await Admin.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return res.status(400).json({ message: "الإيميل أو اسم المستخدم مستخدم بالفعل" });
    }

    const admin = await Admin.create({
      email,
      password,
      name: name || "Admin",
      username,
      role: role === "super" ? "super" : "admin",
    });

    res.status(201).json({
      message: "تم إنشاء الأدمن بنجاح",
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        username: admin.username,
        role: admin.role,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "خطأ في السيرفر", error: error.message });
  }
});

// ==============================
// PATCH /api/admins/:id
// تعديل أدمن
// ==============================
router.patch("/:id", async (req, res) => {
  const { name, username, email, password, role } = req.body;

  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: "الأدمن غير موجود" });
    }

    if (name !== undefined)     admin.name     = name;
    if (username !== undefined) admin.username = username;
    if (email !== undefined)    admin.email    = email;
    if (role !== undefined)     admin.role     = role === "super" ? "super" : "admin";
    if (password)               admin.password = password; // pre-save hook يشفرها

    await admin.save();

    res.json({
      message: "تم تحديث الأدمن بنجاح",
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        username: admin.username,
        role: admin.role,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "خطأ في السيرفر", error: error.message });
  }
});

// ==============================
// DELETE /api/admins/:id
// حذف أدمن
// ==============================
router.delete("/:id", async (req, res) => {
  try {
    // لا يمكن حذف نفسك
    if (req.params.id === String(req.admin._id)) {
      return res.status(400).json({ message: "لا يمكنك حذف حسابك الخاص" });
    }

    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: "الأدمن غير موجود" });
    }

    res.json({ message: "تم حذف الأدمن بنجاح" });
  } catch (error) {
    res.status(500).json({ message: "خطأ في السيرفر", error: error.message });
  }
});

module.exports = router;
