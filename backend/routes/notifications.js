const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");

router.get("/", protect, notificationController.getNotifications);
router.put("/read-all", protect, notificationController.readAllNotifications);
router.put("/:id/read", protect, notificationController.readOneNotification);

module.exports = router;