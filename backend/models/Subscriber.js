const mongoose = require("mongoose");

const SubscriberSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone:    { type: String, required: true, trim: true },
    email:    { type: String, required: true, lowercase: true, trim: true },
    country:  { type: String, required: true },
    city:     { type: String, required: true, trim: true },
    instagram: { type: String, default: "", trim: true },
    gender:    { type: String, enum: ["male", "female", ""], default: "" },
    agreedPolicyVersion: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscriber", SubscriberSchema);
