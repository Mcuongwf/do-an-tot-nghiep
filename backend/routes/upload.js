const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinaryStorage = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary");
const { protect } = require("../middleware/auth");

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = cloudinaryStorage({
  cloudinary,
  folder: "trotot",
  allowedFormats: ["jpg", "jpeg", "png", "webp"],
  transformation: [{ width: 1200, height: 900, crop: "limit", quality: "auto" }],
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Chỉ chấp nhận file ảnh!"));
  },
});

// POST /api/upload — upload tối đa 5 ảnh lên Cloudinary
router.post("/", protect, upload.array("images", 5), (req, res) => {
  const urls = req.files.map(f => f.secure_url || f.url || f.path);
  res.json({ urls });
});

module.exports = router;
