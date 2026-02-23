const express = require("express");
const router = express.Router();

const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const usersController = require("../controllers/admin/users.controller");
const sportsController = require("../controllers/admin/sports.controller");
const courtsController = require("../controllers/admin/courts.controller");
const qualificationsController = require("../controllers/admin/qualifications.controller");

// Test endpoint logic was in admin key "test", but not in any new controller. 
// I will inline it or create a general admin controller if needed. 
// Wait, "test" function was in admin.controller.js.
// User said: "Move functions exactly as-is".
// I missed "test" function in my file creation. 
// I will create `general.controller.js` or just inline it here for now to pass "don't create new route files" rule strictness?
// Actually, strict instructions listed users, sports, courts, qualifications. calling out specific functions.
// "test" function was NOT listed in the "Move functions exactly as-is" list provided by user.
// However, the rule "Existing admin endpoints must still resolve correctly" implies I need it.
// I will create `controllers/admin/general.controller.js` for it quickly or put it in users? 
// The user explicitly listed which functions to move where. "test" was NOT in the list. 
// But "Existing admin endpoints must still resolve correctly".
// I'll add `test` to `users.controller.js` for now as it returns user info, OR inline it. 
// Inline is safest to avoid "extra file" if not asked, but "Delete controllers/admin.controller.js" means I lose it if I don't move it.
// I'll put it in `users.controller.js` since it returns `req.user` info.

router.get("/admin/test", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), (req, res) => {
    res.json({
        message: "Admin access granted",
        user: {
            userId: req.user.UserID,
            email: req.user.Email,
            role: req.user.Role
        }
    });
});

router.get("/admin/users", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), usersController.listUsers);
router.post("/admin/users", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), usersController.createUser);
router.put("/admin/users/:userId", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), usersController.updateUser);
router.patch("/admin/users/:userId/disable", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), usersController.disableUser);
router.patch("/admin/users/:userId/enable", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), usersController.enableUser);
router.delete("/admin/users/:userId", requireAuth, requireRole("SUPER_ADMIN"), usersController.deleteUser);

router.get("/admin/sports", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), sportsController.listSports);
router.post("/admin/sports", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), sportsController.createSport);
router.delete("/admin/sports/:sportId", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), sportsController.deleteSport);

router.get("/admin/courts", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), courtsController.listCourts);
router.post("/admin/courts", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), courtsController.createCourt);
router.put("/admin/courts/:courtId", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), courtsController.updateCourt);
router.delete("/admin/courts/:courtId", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), courtsController.deleteCourt);

router.get("/admin/qualifications", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), qualificationsController.listQualifications);
router.post("/admin/qualifications", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), qualificationsController.createQualification);

module.exports = router;
