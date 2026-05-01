import { Router } from "express";
import validate from "../middleware/validate.js";
import { buildQueryProject } from "../middleware/buildQuery.js";
import * as commonSchema from "../validators/common.validator.js";
import * as projectSchema from "../validators/project.validator.js";
import * as projectController from "../controllers/project.controller.js";
import { projectInCompany, userHasCompany, validateUser } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/project:
 *   post:
 *     summary: Crear proyecto
 *     description: Crea un proyecto asociado a un cliente de la compañía del usuario autenticado.
 *     tags:
 *       - Project
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ProjectInput"
 *     responses:
 *       201:
 *         description: Proyecto creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Proyecto creado
 *                 project:
 *                   $ref: "#/components/schemas/Project"
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: El usuario no tiene compañía asociada
 *       404:
 *         description: No existe el cliente en la compañía
 *       409:
 *         description: Ya existe un proyecto con ese código en la compañía
 *       500:
 *         description: Error interno
 */
router.post("/", validate(projectSchema.schemaProjectBody), validateUser, userHasCompany, projectController.createProject);

/**
 * @swagger
 * /api/project:
 *   get:
 *     summary: Obtener proyectos
 *     description: Devuelve los proyectos de la compañía del usuario autenticado, con filtros, paginación y ordenación.
 *     tags:
 *       - Project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: client
 *         schema:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 *         description: Filtrar por ID de cliente
 *         example: 663a0e4f9a21b2d4c84fd123
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Búsqueda parcial por nombre
 *         example: reforma
 *       - in: query
 *         name: projectCode
 *         schema:
 *           type: string
 *         description: Búsqueda parcial por código de proyecto
 *         example: PR
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *           format: email
 *         description: Búsqueda parcial por email
 *         example: obra@example.com
 *       - in: query
 *         name: notes
 *         schema:
 *           type: string
 *         description: Búsqueda parcial por notas
 *         example: urgente
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Página de resultados
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Número de resultados por página
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: -createdAt
 *         description: Campo de ordenación. Usa "-" delante para orden descendente.
 *     responses:
 *       200:
 *         description: Lista paginada de proyectos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/PaginatedProjectsResponse"
 *       400:
 *         description: Query params inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: El usuario no tiene compañía asociada
 *       500:
 *         description: Error interno
 */
router.get("/", validate(projectSchema.schemaProjectQuery), validateUser, userHasCompany, buildQueryProject, projectController.getProjects);

/**
 * @swagger
 * /api/project/archived:
 *   get:
 *     summary: Obtener proyectos archivados
 *     description: Devuelve los proyectos eliminados mediante soft delete de la compañía del usuario administrador.
 *     tags:
 *       - Project
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de proyectos archivados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Proyectos archivados
 *                 archivedProjects:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/Project"
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Solo administradores o usuario sin compañía
 *       500:
 *         description: Error interno
 */
router.get("/archived", validateUser, authorizeRoles("admin"), userHasCompany, projectController.getArchivedProjects);

/**
 * @swagger
 * /api/project/{id}:
 *   get:
 *     summary: Obtener proyecto por ID
 *     description: Devuelve un proyecto concreto si pertenece a la compañía del usuario autenticado.
 *     tags:
 *       - Project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 *         description: ID del proyecto
 *         example: 663a0f8a9a21b2d4c84fd456
 *     responses:
 *       200:
 *         description: Proyecto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   $ref: "#/components/schemas/Project"
 *       400:
 *         description: ObjectId inválido
 *       401:
 *         description: No autorizado
 *       403:
 *         description: El usuario no tiene compañía asociada
 *       404:
 *         description: Proyecto no encontrado o no pertenece a la compañía
 *       500:
 *         description: Error interno
 */
router.get("/:id", validate(commonSchema.schemaObjectId), validateUser, userHasCompany, projectInCompany, projectController.getProject);

/**
 * @swagger
 * /api/project/{id}:
 *   put:
 *     summary: Actualizar proyecto
 *     description: Actualiza los datos de un proyecto perteneciente a la compañía del usuario autenticado. No permite cambiar el cliente asociado.
 *     tags:
 *       - Project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 *         description: ID del proyecto
 *         example: 663a0f8a9a21b2d4c84fd456
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ProjectUpdateInput"
 *     responses:
 *       200:
 *         description: Proyecto actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Proyecto actualizado
 *                 project:
 *                   $ref: "#/components/schemas/Project"
 *       400:
 *         description: Datos inválidos u ObjectId inválido
 *       401:
 *         description: No autorizado
 *       403:
 *         description: El usuario no tiene compañía asociada
 *       404:
 *         description: Proyecto no encontrado o no pertenece a la compañía
 *       409:
 *         description: Ya existe un proyecto con ese código en la compañía
 *       500:
 *         description: Error interno
 */
router.put("/:id", validate(commonSchema.schemaObjectId), validate(projectSchema.schemaProjectUpdateBody), validateUser, userHasCompany, projectInCompany, projectController.updateProject);

/**
 * @swagger
 * /api/project/{id}:
 *   delete:
 *     summary: Eliminar proyecto
 *     description: Elimina un proyecto de forma lógica o física según el query param soft. No se pueden borrar proyectos activos; primero deben desactivarse con active=false.
 *     tags:
 *       - Project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 *         description: ID del proyecto
 *         example: 663a0f8a9a21b2d4c84fd456
 *       - in: query
 *         name: soft
 *         required: false
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *           default: "true"
 *         description: Si es true hace soft delete. Si es false hace hard delete.
 *     responses:
 *       200:
 *         description: Proyecto borrado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Proyecto borrado
 *                 project:
 *                   $ref: "#/components/schemas/Project"
 *       400:
 *         description: ObjectId o query param inválido
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No se pueden borrar proyectos activos o el usuario no tiene compañía
 *       404:
 *         description: Proyecto no encontrado o no pertenece a la compañía
 *       500:
 *         description: Error interno
 */
router.delete("/:id", validate(commonSchema.schemaObjectId), validate(commonSchema.schemaSoftDelete), validateUser, userHasCompany, projectInCompany, projectController.deleteProject);

/**
 * @swagger
 * /api/project/{id}/restore:
 *   patch:
 *     summary: Restaurar proyecto archivado
 *     description: Restaura un proyecto eliminado mediante soft delete. Solo disponible para administradores.
 *     tags:
 *       - Project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 *         description: ID del proyecto archivado
 *         example: 663a0f8a9a21b2d4c84fd456
 *     responses:
 *       200:
 *         description: Proyecto restaurado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Proyecto restaurado
 *                 restoredProject:
 *                   $ref: "#/components/schemas/Project"
 *       400:
 *         description: ObjectId inválido
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Solo administradores o usuario sin compañía
 *       404:
 *         description: No hay proyecto archivado
 *       500:
 *         description: Error interno
 */
router.patch("/:id/restore", validate(commonSchema.schemaObjectId), validateUser, authorizeRoles("admin"), userHasCompany, projectController.restoreProject);

export default router;