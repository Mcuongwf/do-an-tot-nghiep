const express = require("express");
const router = express.Router();
const roomController = require("../controllers/roomController");
const { protect, landlordOnly, adminOnly } = require("../middleware/auth");

router.get("/my", protect, roomController.getMyRooms);
router.get("/all", protect, adminOnly, roomController.getAllRoomsAdmin);
router.get("/", roomController.getRoomsListing);

router.get("/:id", roomController.getRoomById);
router.post("/", protect, landlordOnly, roomController.createRoom);
router.put("/:id", protect, landlordOnly, roomController.updateRoom);
router.delete("/:id", protect, landlordOnly, roomController.deleteRoom);

router.put("/:id/approve", protect, adminOnly, roomController.approveRoom);
router.put("/:id/reject", protect, adminOnly, roomController.rejectRoom);

module.exports = router;