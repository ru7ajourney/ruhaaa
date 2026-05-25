// scripts/createAdmin.js
// إنشاء أو إعادة تعيين أدمن
// استخدام: node scripts/createAdmin.js
// أو مع متغيرات: ADMIN_EMAIL=x ADMIN_USERNAME=y ADMIN_PASSWORD=z node scripts/createAdmin.js

require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../models/Admin");

const EMAIL    = process.env.ADMIN_EMAIL    || "gzladhm@gmail.com";
const USERNAME = process.env.ADMIN_USERNAME || "94659465";
const PASSWORD = process.env.ADMIN_PASSWORD || "AdhmGzal";

(async () => {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI not set in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ Connected to MongoDB: ${process.env.MONGODB_URI.replace(/:[^:@]+@/, ":***@")}`);

    let admin = await Admin.findOne({ email: EMAIL.toLowerCase() });

    if (admin) {
      admin.username = USERNAME;
      admin.password = PASSWORD;
      admin.role     = "super";
      await admin.save();
      console.log(`🔄 Updated existing admin: ${EMAIL}`);
    } else {
      admin = await Admin.create({
        email:    EMAIL,
        username: USERNAME,
        password: PASSWORD,
        name:     "Admin",
        role:     "super",
      });
      console.log(`✨ Created new super admin: ${EMAIL}`);
    }

    console.log("\n=== Login credentials ===");
    console.log(`📧 Email:    ${EMAIL}`);
    console.log(`👤 Username: ${USERNAME}`);
    console.log(`🔑 Password: ${PASSWORD}`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Failed:", err.message);
    process.exit(1);
  }
})();
