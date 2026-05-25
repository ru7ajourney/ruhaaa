// scripts/setSuperAdmin.js
// تحويل أدمن موجود إلى مدير أعلى
// استخدام: node scripts/setSuperAdmin.js
// أو مع إيميل محدد: ADMIN_EMAIL=x@x.com node scripts/setSuperAdmin.js

require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../models/Admin");

const EMAIL = process.env.ADMIN_EMAIL || "gzladhm@gmail.com";

(async () => {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI not set in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const result = await Admin.updateOne(
      { email: EMAIL.toLowerCase() },
      { $set: { role: "super" } }
    );

    if (result.matchedCount === 0) {
      console.error(`❌ No admin found with email: ${EMAIL}`);
      process.exit(1);
    }

    console.log(`✅ Admin ${EMAIL} is now a super admin`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed:", err.message);
    process.exit(1);
  }
})();
