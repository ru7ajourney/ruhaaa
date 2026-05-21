// models/Application.js
// نموذج طلب التسجيل في رحلة

const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema(
  {
    // ==============================
    // الرحلة المطلوبة
    // ==============================
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: [true, "الرحلة مطلوبة"],
    },
    tripTitle: {
      type: String,
      required: true, // نحفظ اسم الرحلة مباشرة عشان ما نحتاج populate في كل مرة
    },

    // ==============================
    // بيانات المتقدم
    // ==============================
    fullName: {
      type: String,
      required: [true, "الاسم الكامل مطلوب"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "البلد مطلوب"],
    },
    city: {
      type: String,
      required: [true, "المدينة مطلوبة"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "رقم الهاتف مطلوب"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "الإيميل مطلوب"],
      lowercase: true,
      trim: true,
    },

    // ==============================
    // أسئلة نعم / لا
    // ==============================
    agreeVolunteering: {
      type: Boolean,
      required: true, // موافق على التطوع والالتزام بقوانين الهوست؟
    },
    hasEnglish: {
      type: Boolean,
      required: true, // عنده مستوى إنجليزي متوسط؟
    },
    readyForDeposit: {
      type: Boolean,
      required: true, // مستعد لدفع عربون؟
    },

    // ==============================
    // التعريف بالنفس
    // ==============================
    aboutMe: {
      type: String,
      required: [true, "التعريف بالنفس مطلوب"],
      maxlength: [1000, "التعريف لا يتجاوز 1000 حرف"],
    },

    // ==============================
    // حالة الطلب (يديرها الآدمن)
    // ==============================
    status: {
      type: String,
      enum: ["pending", "reviewed", "accepted", "rejected"],
      default: "pending",
    },

    // ملاحظات الآدمن
    adminNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Application", ApplicationSchema);
