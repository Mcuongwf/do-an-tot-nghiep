const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController"); // Import controller
const { protect } = require("../middleware/auth");

router.get("/conversations", protect, messageController.getConversations);
router.post("/conversations", protect, messageController.createConversation);
router.get("/conversations/:id/messages", protect, messageController.getMessages);
router.post("/conversations/:id/messages", protect, messageController.sendMessage);
router.put("/conversations/:id/read", protect, messageController.readConversation);

module.exports = router;