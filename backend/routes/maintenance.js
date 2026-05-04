const express = require("express");
const router = express.Router();
const { protect, landlordOnly } = require("../middleware/auth");
const maintenanceController = require("../controllers/maintenanceController");

// @GET /api/maintenance
router.get("/", protect, landlordOnly, maintenanceController.getMaintenanceList);

// @POST /api/maintenance
router.post("/", protect, landlordOnly, maintenanceController.createMaintenance);

// @PUT /api/maintenance/:id
router.put("/:id", protect, landlordOnly, maintenanceController.updateMaintenance);

// @DELETE /api/maintenance/:id
router.delete("/:id", protect, landlordOnly, maintenanceController.deleteMaintenance);

module.exports = router;