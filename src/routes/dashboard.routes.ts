import { Router } from "express";
import { userHasCompany, validateUser, validateUserStatus } from "../middleware/auth.middleware.js";
import { getDashboard } from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/", validateUser, validateUserStatus("verified"), userHasCompany, getDashboard);

export default router;