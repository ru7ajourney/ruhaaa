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
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    paidAmount: { type: Number, default: 0 },
    paidCurrency: { type: String, default: "" },
    tripTitle: {
      type: String,
      required: true, // نحفظ اسم الرحلة مباشرة عشان ما نحتاج populate في كل مرة
    },
    preferredDate: {
      type: String,
      default: "غير محدد",
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
    instagram: {
      type: String,
      required: [true, "حساب الإنستغرام مطلوب"],
      trim: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: [true, "الجنس مطلوب"],
    },
    agreedPolicyVersion: {
      type: String,
      default: "",
    },
    history: [
      {
        status:    { type: String, required: true },
        reason:    { type: String, default: "" },
        changedBy: { type: String, default: "" },
        changedAt: { type: Date, default: Date.now },
      },
    ],

    // ==============================
    // حالة الطلب (يديرها الآدمن)
    // ==============================
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },

    // التاريخ المحدد من الأدمن (ObjectId لتاريخ من availableDates في الرحلة)
    selectedDateId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // هل تم دفع العربون؟
    depositPaid: {
      type: Boolean,
      default: false,
    },

    // هل تم دفع كامل المبلغ؟
    fullyPaid: {
      type: Boolean,
      default: false,
    },

    // طريقة الدفع (paypal أو cash)
    paymentMethod: {
      type: String,
      enum: ["paypal", "cash", null],
      default: null,
    },

    // حالة الريفند (none = لا يوجد، required = مطلوب، completed = تم)
    refundStatus: {
      type: String,
      enum: ["none", "required", "completed"],
      default: "none",
    },

    // سبب القرار (مرتبط بتغيير الحالة)
    adminNotes: {
      type: String,
      default: "",
    },

    // ملاحظات شخصية عن العميل (اختيارية - حساسية، سلوك، مميزات...)
    clientNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Application", ApplicationSchema);
