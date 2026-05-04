const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const userController = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/auth");

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, "avatar-" + Date.now() + path.extname(file.originalname)),
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Chỉ chấp nhận file ảnh!"));
  },
});

router.get("/tenants", protect, userController.getTenants);
router.get("/me", protect, userController.getMe);
router.post("/me/avatar", protect, avatarUpload.single("avatar"), userController.updateAvatar);
router.put("/me", protect, userController.updateProfile);
router.put("/change-password", protect, userController.changePassword);

router.get("/", protect, adminOnly, userController.getAllUsers);
router.put("/:id/lock", protect, adminOnly, userController.lockUser);
router.put("/:id/unlock", protect, adminOnly, userController.unlockUser);

module.exports = router;