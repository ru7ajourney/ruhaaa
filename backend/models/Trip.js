// models/Trip.js
// نموذج الرحلة في قاعدة البيانات

const mongoose = require("mongoose");

// ==============================
// Schema للفعاليات الإضافية
// ==============================
const ExtraSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: "" },
  price:       { type: Number, required: true },
  scheduleDay: { type: Number, default: null }, // رقم اليوم في البرنامج (day.day)
});

// ==============================
// Schema للبرنامج اليومي للرحلة
// ==============================
const DaySchema = new mongoose.Schema({
  day: { type: Number, required: true },        // اليوم رقم كم
  title: { type: String, required: true },       // عنوان اليوم - مثلاً "وصول روما"
  description: { type: String, required: true }, // شرح ما سيحدث في هذا اليوم
});

// ==============================
// Schema للتاريخ المتاح للرحلة
// ==============================
const AvailableDateSchema = new mongoose.Schema({
  startDate: { type: Date, required: true },     // تاريخ البداية
  endDate: { type: Date, required: true },       // تاريخ النهاية
  spotsTotal: { type: Number, required: true },  // عدد الأماكن الكلي
  spotsTaken: { type: Number, default: 0 },      // الأماكن المحجوزة
});

// ==============================
// Schema الرئيسي للرحلة
// ==============================
const TripSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "عنوان الرحلة مطلوب"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    destination: {
      type: String,
      required: [true, "الوجهة مطلوبة"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "الدولة مطلوبة"],
      trim: true,
    },
    shortDescription: {
      type: String,
      required: [true, "الوصف المختصر مطلوب"],
      maxlength: [200, "الوصف المختصر لا يتجاوز 200 حرف"],
    },
    description: {
      type: String,
      required: [true, "وصف الرحلة مطلوب"],
    },
    duration: {
      type: Number,
      required: [true, "مدة الرحلة مطلوبة"],  // عدد الأيام
    },
    price: {
      type: Number,
      required: [true, "سعر الرحلة مطلوب"],   // السعر بالدولار أو الشيكل
    },
    currency: {
      type: String,
      default: "USD",
      enum: ["USD", "ILS", "EUR"],
    },
    coverImage: {
      type: String,
      default: "",   // رابط الصورة الرئيسية
    },
    images: [String], // روابط صور إضافية
    program: [DaySchema],             // البرنامج اليومي
    extras: [ExtraSchema],            // الفعاليات الإضافية بتكلفة إضافية
    availableDates: [AvailableDateSchema], // التواريخ المتاحة
    includes: [String],   // ماذا يشمل السعر - مثل ["السكن", "المواصلات"]
    excludes: [String],   // ماذا لا يشمل - مثل ["تذاكر الطيران"]
    isActive: {
      type: Boolean,
      default: true,  // هل الرحلة ظاهرة للزوار؟
    },
    isFeatured: {
      type: Boolean,
      default: false, // هل تظهر في الصفحة الرئيسية؟
    },
  },
  {
    timestamps: true, // يضيف createdAt و updatedAt تلقائياً
  }
);

// ==============================
// قبل الحفظ: أنشئ slug من العنوان الإنجليزي أو الـ destination
// ==============================
TripSchema.pre("save", function (next) {
    if (!this.slug) {
        // إذا ما كتب slug، اعمل واحد تلقائي
        this.slug = this.destination
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w\-]/g, "");
    }
    next();
});

// ==============================
// Virtual: كم مكان متبقي في كل تاريخ
// ==============================
AvailableDateSchema.virtual("spotsLeft").get(function () {
  return this.spotsTotal - this.spotsTaken;
});

module.exports = mongoose.model("Trip", TripSchema);
