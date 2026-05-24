const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema(
  {
    imageUrl:   { type: String, required: true },
    title:      { type: String, default: "" },
    isFeatured: { type: Boolean, default: false },
    order:    { type: Number, default: 0 },
    cropArea: {
      x:      { type: Number, default: 0   },
      y:      { type: Number, default: 0   },
      width:  { type: Number, default: 100 },
      height: { type: Number, default: 100 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Gallery", gallerySchema);
