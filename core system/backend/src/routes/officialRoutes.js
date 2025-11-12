import express from "express";
import { registerOfficial, loginOfficial, logoutOfficial, getAllOfficials } from "../controllers/officialController.js";
import { registerOfficialRules, loginRules } from "../validators/officialValidator.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireActiveOfficial, requireRole } from "../middlewares/officialAccess.js";

const router = express.Router();

router.post("/register", registerOfficialRules, registerOfficial);
router.post("/login", loginRules, loginOfficial);
router.post("/logout", requireAuth, logoutOfficial);

// Get all officials (accessible only to Chairman)
router.get("/", requireAuth, requireActiveOfficial, requireRole(["Chairman"]), getAllOfficials);

export default router;
