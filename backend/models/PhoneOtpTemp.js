const mongoose = require("mongoose");

// تخزين مؤقت لـ OTP لمن لم يسجّل بعد — يُحذف تلقائياً بعد 10 دقائق
const PhoneOtpTempSchema = new mongoose.Schema({
  phone:     { type: String, required: true, unique: true },
  otp:       { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 },
});

module.exports = mongoose.model("PhoneOtpTemp", PhoneOtpTempSchema);
