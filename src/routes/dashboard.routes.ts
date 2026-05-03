import { Router } from "express";
import { userHasCompany, validateUser, validateUserStatus } from "../middleware/auth.middleware.js";
import { getDashboard } from "../controllers/dashboard.controller.js";

const router = Router();

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Obtener dashboard de estadísticas
 *     description: Devuelve estadísticas agregadas de la compañía autenticada usando aggregation pipeline de MongoDB.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas correctamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Usuario no verificado o sin compañía
 */
router.get("/", validateUser, validateUserStatus("verified"), userHasCompany, getDashboard);

export default router;