import { Router } from "express";
import { userHasCompany, validateUser, validateUserStatus } from "../middleware/auth.middleware.js";
import { getAuditLogs } from "../controllers/audit.controller.js";

const router = Router();

router.get("/", validateUser, validateUserStatus("verified"), userHasCompany, getAuditLogs);

export default router;