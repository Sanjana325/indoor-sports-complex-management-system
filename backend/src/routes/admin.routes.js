const express = require("express");
const router = express.Router();

const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const adminController = require("../controllers/admin.controller");

router.get("/admin/test", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), adminController.test);

router.get("/admin/users", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), adminController.listUsers);

router.post("/admin/users", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), adminController.createUser);

router.put("/admin/users/:userId", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), adminController.updateUser);

router.patch("/admin/users/:userId/disable", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), adminController.disableUser);

router.patch("/admin/users/:userId/enable", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), adminController.enableUser);

router.delete("/admin/users/:userId", requireAuth, requireRole("SUPER_ADMIN"), adminController.deleteUser);

router.get("/admin/sports", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), adminController.listSports);
router.post("/admin/sports", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), adminController.createSport);

router.get("/admin/qualifications", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), adminController.listQualifications);
router.post("/admin/qualifications", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), adminController.createQualification);

module.exports = router;
