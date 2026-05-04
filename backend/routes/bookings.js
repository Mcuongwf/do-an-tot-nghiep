const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const bookingController = require("../controllers/bookingController");

// @POST /api/bookings
router.post("/", protect, bookingController.createBooking);

// @GET /api/bookings
router.get("/", protect, bookingController.getTenantBookings);

// @GET /api/bookings/landlord
router.get("/landlord", protect, bookingController.getLandlordBookings);

// @PUT /api/bookings/:id
router.put("/:id", protect, bookingController.updateBookingStatus);

module.exports = router;