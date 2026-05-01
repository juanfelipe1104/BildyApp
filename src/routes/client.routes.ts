import { Router } from "express";
import validate from "../middleware/validate.js";
import { buildQueryClient } from "../middleware/buildQuery.js";
import * as commonSchema from "../validators/common.validator.js";
import * as clientSchema from "../validators/client.validator.js";
import * as clientController from "../controllers/client.controller.js";
import { clientInCompany, userHasCompany, validateUser } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/client:
 *   post:
 *     summary: Crear cliente
 *     description: Crea un cliente asociado a la compañía del usuario autenticado.
 *     tags:
 *       - Client
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ClientInput"
 *     responses:
 *       201:
 *         description: Cliente creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cliente creado
 *                 client:
 *                   $ref: "#/components/schemas/Client"
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: El usuario no tiene compañía asociada
 *       409:
 *         description: Ya existe un cliente con ese CIF en la compañía
 *       500:
 *         description: Error interno
 */
router.post("/", validate(clientSchema.schemaClientBody), validateUser, userHasCompany, clientController.createClient);

/**
 * @swagger
 * /api/client:
 *   get:
 *     summary: Obtener clientes
 *     description: Devuelve los clientes de la compañía del usuario autenticado, con filtros, paginación y ordenación.
 *     tags:
 *       - Client
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Búsqueda parcial por nombre
 *         example: García
 *       - in: query
 *         name: cif
 *         schema:
 *           type: string
 *         description: Filtro por CIF
 *         example: B12345678
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *           format: email
 *         description: Filtro por email
 *         example: cliente@example.com
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *         description: Filtro por teléfono
 *         example: "600123123"
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
 *         description: Lista paginada de clientes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/PaginatedClientsResponse"
 *       400:
 *         description: Query params inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: El usuario no tiene compañía asociada
 *       500:
 *         description: Error interno
 */
router.get("/", validate(clientSchema.schemaClientQuery), validateUser, userHasCompany, buildQueryClient, clientController.getClients);

/**
 * @swagger
 * /api/client/archived:
 *   get:
 *     summary: Obtener clientes archivados
 *     description: Devuelve los clientes eliminados mediante soft delete de la compañía del usuario administrador.
 *     tags:
 *       - Client
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clientes archivados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Clientes archivados
 *                 archivedClients:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/Client"
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Solo administradores o usuario sin compañía
 *       500:
 *         description: Error interno
 */
router.get("/archived", validateUser, authorizeRoles("admin"), userHasCompany, clientController.getArchivedClients);

/**
 * @swagger
 * /api/client/{id}:
 *   get:
 *     summary: Obtener cliente por ID
 *     description: Devuelve un cliente concreto si pertenece a la compañía del usuario autenticado.
 *     tags:
 *       - Client
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 *         description: ID del cliente
 *         example: 663a0e4f9a21b2d4c84fd123
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 client:
 *                   $ref: "#/components/schemas/Client"
 *       400:
 *         description: ObjectId inválido
 *       401:
 *         description: No autorizado
 *       403:
 *         description: El usuario no tiene compañía asociada
 *       404:
 *         description: Cliente no encontrado o no pertenece a la compañía
 *       500:
 *         description: Error interno
 */
router.get("/:id", validate(commonSchema.schemaObjectId), validateUser, userHasCompany, clientInCompany, clientController.getClient);

/**
 * @swagger
 * /api/client/{id}:
 *   put:
 *     summary: Actualizar cliente
 *     description: Actualiza los datos de un cliente perteneciente a la compañía del usuario autenticado.
 *     tags:
 *       - Client
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 *         description: ID del cliente
 *         example: 663a0e4f9a21b2d4c84fd123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ClientUpdateInput"
 *     responses:
 *       200:
 *         description: Cliente actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cliente actualizado
 *                 client:
 *                   $ref: "#/components/schemas/Client"
 *       400:
 *         description: Datos inválidos u ObjectId inválido
 *       401:
 *         description: No autorizado
 *       403:
 *         description: El usuario no tiene compañía asociada
 *       404:
 *         description: Cliente no encontrado o no pertenece a la compañía
 *       409:
 *         description: Ya existe un cliente con ese CIF en la compañía
 *       500:
 *         description: Error interno
 */
router.put("/:id", validate(commonSchema.schemaObjectId), validate(clientSchema.schemaClientUpdateBody), validateUser, userHasCompany, clientInCompany, clientController.updateClient);

/**
 * @swagger
 * /api/client/{id}:
 *   delete:
 *     summary: Eliminar cliente
 *     description: Elimina un cliente de forma lógica o física según el query param soft.
 *     tags:
 *       - Client
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 *         description: ID del cliente
 *         example: 663a0e4f9a21b2d4c84fd123
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
 *         description: Cliente borrado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cliente borrado
 *                 client:
 *                   $ref: "#/components/schemas/Client"
 *       400:
 *         description: ObjectId o query param inválido
 *       401:
 *         description: No autorizado
 *       403:
 *         description: El usuario no tiene compañía asociada
 *       404:
 *         description: Cliente no encontrado o no pertenece a la compañía
 *       500:
 *         description: Error interno
 */
router.delete("/:id", validate(commonSchema.schemaObjectId), validate(commonSchema.schemaSoftDelete), validateUser, userHasCompany, clientInCompany, clientController.deleteClient);

/**
 * @swagger
 * /api/client/{id}/restore:
 *   patch:
 *     summary: Restaurar cliente archivado
 *     description: Restaura un cliente eliminado mediante soft delete. Solo disponible para administradores.
 *     tags:
 *       - Client
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 *         description: ID del cliente archivado
 *         example: 663a0e4f9a21b2d4c84fd123
 *     responses:
 *       200:
 *         description: Cliente restaurado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cliente restaurado
 *                 restoredClient:
 *                   $ref: "#/components/schemas/Client"
 *       400:
 *         description: ObjectId inválido
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Solo administradores o usuario sin compañía
 *       404:
 *         description: No hay cliente archivado
 *       500:
 *         description: Error interno
 */
router.patch("/:id/restore", validate(commonSchema.schemaObjectId), validateUser, authorizeRoles("admin"), userHasCompany, clientController.restoreClient);

export default router;