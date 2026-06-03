const mongoose = require("mongoose");

const JobApplicationSchema = new mongoose.Schema(
  {
    fullName:     { type: String, required: true, trim: true },
    email:        { type: String, required: true, lowercase: true, trim: true },
    phone:        { type: String, required: true, trim: true },
    country:      { type: String, required: true },
    position:     { type: String, required: true },
    portfolioUrl: { type: String, default: "" },
    message:      { type: String, required: true, maxlength: 1500 },
    status: {
      type: String,
      enum: ["pending", "reviewed", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobApplication", JobApplicationSchema);
