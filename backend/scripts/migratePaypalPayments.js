// scripts/migratePaypalPayments.js
// يحدّث الطلبات القديمة المدفوعة عبر PayPal قبل إضافة حقل paymentMethod
// استخدام: node scripts/migratePaypalPayments.js

require("dotenv").config();
const mongoose = require("mongoose");
const Application = require("../models/Application");

(async () => {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI not set in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // ابحث عن كل الطلبات المدفوعة بدون paymentMethod
    const toUpdate = await Application.find({
      depositPaid: true,
      paymentMethod: { $in: [null, undefined] },
    });

    if (toUpdate.length === 0) {
      console.log("ℹ️  لا يوجد طلبات تحتاج تحديث");
      process.exit(0);
    }

    console.log(`\n🔍 وجدت ${toUpdate.length} طلب يحتاج تحديث:\n`);
    toUpdate.forEach((app) => {
      console.log(`  - ${app.fullName} | ${app.tripTitle} | مدفوع: ${app.paidAmount} ${app.paidCurrency}`);
    });

    const result = await Application.updateMany(
      { depositPaid: true, paymentMethod: { $in: [null, undefined] } },
      { $set: { paymentMethod: "paypal" } }
    );

    console.log(`\n✅ تم تحديث ${result.modifiedCount} طلب → paymentMethod: "paypal"`);
    process.exit(0);
  } catch (err) {
    console.error("❌ خطأ:", err.message);
    process.exit(1);
  }
})();
