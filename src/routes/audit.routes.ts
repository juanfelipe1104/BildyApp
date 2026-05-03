import { Router } from "express";
import { userHasCompany, validateUser, validateUserStatus } from "../middleware/auth.middleware.js";
import { getAuditLogs } from "../controllers/audit.controller.js";

const router = Router();

/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: Obtener logs de auditoría
 *     description: Devuelve los últimos eventos de auditoría de la compañía autenticada almacenados en PostgreSQL mediante Prisma.
 *     tags:
 *       - Audit
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logs de auditoría obtenidos correctamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Usuario no verificado o sin compañía
 */
router.get("/", validateUser, validateUserStatus("verified"), userHasCompany, getAuditLogs);

export default router;