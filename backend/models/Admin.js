// models/Admin.js
// نموذج الآدمن - مستخدم واحد فقط لإدارة الموقع

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AdminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      default: "Admin",
    },
  },
  { timestamps: true }
);

// ==============================
// قبل الحفظ: شفّر كلمة المرور
// ==============================
AdminSchema.pre("save", async function (next) {
  // فقط إذا تغيرت كلمة المرور
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ==============================
// Method: تحقق من كلمة المرور
// ==============================
AdminSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Admin", AdminSchema);
