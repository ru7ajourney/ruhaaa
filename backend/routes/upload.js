const express    = require("express");
const multer     = require("multer");
const cloudinary = require("cloudinary").v2;
const { protectUser } = require("../middleware/userAuthMiddleware");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router  = express.Router();
const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("الملف يجب أن يكون صورة"));
  },
});

// POST /api/upload
router.post("/", protectUser, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "لا يوجد ملف" });

  const folder = req.body.folder || "ruha";

  const stream = cloudinary.uploader.upload_stream(
    { folder, resource_type: "image" },
    (error, result) => {
      if (error) return res.status(500).json({ message: error.message });
      res.json({ url: result.secure_url });
    }
  );

  stream.end(req.file.buffer);
});

module.exports = router;
