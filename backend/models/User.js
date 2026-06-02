const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    fullName:    { type: String, required: true, trim: true },
    email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:    { type: String, minlength: 6 },
    phone:           { type: String, unique: true, sparse: true, trim: true },
    phoneOtp:        { type: String, default: null },
    phoneOtpExpires: { type: Date,   default: null },
    nameChangedAt:   { type: Date,   default: null },
    phoneChangedAt:  { type: Date,   default: null },
    emailChangedAt:          { type: Date,   default: null },
    pendingEmail:            { type: String, default: null },
    pendingEmailOtp:         { type: String, default: null },
    pendingEmailOtpExpires:  { type: Date,   default: null },
    pendingPhone:            { type: String, default: null },
    pendingPhoneOtp:         { type: String, default: null },
    pendingPhoneOtpExpires:  { type: Date,   default: null },
    country:     { type: String, default: "" },
    googleId:    { type: String, default: "" },
    avatar:      { type: String, default: "" },
    isVerified:  { type: Boolean, default: false },
    isBanned:    { type: Boolean, default: false },
    otp:         { type: String, default: null },
    otpExpires:  { type: Date,   default: null },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model("User", UserSchema);
