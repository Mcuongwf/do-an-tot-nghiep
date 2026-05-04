const express = require("express");
const router = express.Router();
const { protect, landlordOnly } = require("../middleware/auth");
const contractController = require("../controllers/contractController");

// @GET /api/contracts/my
router.get("/my", protect, contractController.getMyContracts);

// @GET /api/contracts
router.get("/", protect, landlordOnly, contractController.getLandlordContracts);

// @POST /api/contracts
router.post("/", protect, landlordOnly, contractController.createContract);

// @PUT /api/contracts/:id
router.put("/:id", protect, landlordOnly, contractController.updateContract);

// @DELETE /api/contracts/:id
router.delete("/:id", protect, landlordOnly, contractController.deleteContract);

module.exports = router;