const mongoose = require("mongoose");

const PolicyVersionSchema = new mongoose.Schema(
  {
    versionName: { type: String, required: true, unique: true },
    policies: { type: Array, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PolicyVersion", PolicyVersionSchema);
