const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlistController");
const { protect } = require("../middleware/auth");

// Cả hai route đều cần bảo mật vì wishlist gắn liền với từng User cụ thể
router.get("/", protect, wishlistController.getWishlist);
router.post("/toggle", protect, wishlistController.toggleWishlist);

module.exports = router;