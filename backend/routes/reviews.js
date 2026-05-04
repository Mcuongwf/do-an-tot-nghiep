const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { protect } = require("../middleware/auth");

router.post("/", protect, reviewController.createReview);

router.get("/:roomId", reviewController.getRoomReviews);

module.exports = router;