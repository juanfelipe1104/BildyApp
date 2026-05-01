import { Router } from "express";
import validate from "../middleware/validate.js";
import * as commonSchema from "../validators/common.validator.js";
import * as deliveryNoteSchema from "../validators/deliveryNote.validator.js";
import * as deliveryNoteController from "../controllers/deliveryNote.controller.js";
import { deliveryNoteInCompany, userHasCompany, validateUser } from "../middleware/auth.middleware.js";
import { buildQueryDeliveryNote } from "../middleware/buildQuery.js";
import upload from "../middleware/upload.js";

const router = Router();

/**
 * @swagger
 * /api/deliverynote:
 *   post:
 *     summary: Crear albarán
 *     description: Crea un albarán de material o de horas. El proyecto debe pertenecer al cliente y a la compañía del usuario autenticado.
 *     tags:
 *       - DeliveryNote
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/DeliveryNoteInput"
 *           examples:
 *             material:
 *               summary: Albarán de material
 *               value:
 *                 client: "663a0e4f9a21b2d4c84fd123"
 *                 project: "663a0f8a9a21b2d4c84fd456"
 *                 format: "material"
 *                 description: "Entrega de materiales"
 *                 workDate: "2026-04-30"
 *                 material: "Cemento"
 *                 quantity: 10
 *                 unit: "sacos"
 *             hours:
 *               summary: Albarán de horas
 *               value:
 *                 client: "663a0e4f9a21b2d4c84fd123"
 *                 project: "663a0f8a9a21b2d4c84fd456"
 *                 format: "hours"
 *                 description: "Trabajo de instalación"
 *                 workDate: "2026-04-30"
 *                 hours: 8
 *             hoursWithWorkers:
 *               summary: Albarán de horas con trabajadores
 *               value:
 *                 client: "663a0e4f9a21b2d4c84fd123"
 *                 project: "663a0f8a9a21b2d4c84fd456"
 *                 format: "hours"
 *                 description: "Trabajo de instalación"
 *                 workDate: "2026-04-30"
 *                 workers:
 *                   - name: "Juan"
 *                     hours: 4
 *                   - name: "Pedro"
 *                     hours: 3
 *     responses:
 *       201:
 *         description: Albarán creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Albaran creado
 *                 deliveryNote:
 *                   $ref: "#/components/schemas/DeliveryNote"
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: El usuario no tiene compañía asociada
 *       404:
 *         description: No existe un proyecto para ese cliente en la compañía
 *       500:
 *         description: Error interno
 */
router.post("/", validate(deliveryNoteSchema.schemaDeliveryNoteBody), validateUser, userHasCompany, deliveryNoteController.createDeliveryNote);

/**
 * @swagger
 * /api/deliverynote:
 *   get:
 *     summary: Obtener albaranes
 *     description: Devuelve los albaranes de la compañía del usuario autenticado, con filtros, paginación y ordenación.
 *     tags:
 *       - DeliveryNote
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
 *         name: project
 *         schema:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 *         description: Filtrar por ID de proyecto
 *         example: 663a0f8a9a21b2d4c84fd456
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: ["material", "hours"]
 *         description: Filtrar por formato de albarán
 *         example: hours
 *       - in: query
 *         name: description
 *         schema:
 *           type: string
 *         description: Búsqueda parcial por descripción
 *         example: instalación
 *       - in: query
 *         name: material
 *         schema:
 *           type: string
 *         description: Búsqueda parcial por material
 *         example: cemento
 *       - in: query
 *         name: quantity
 *         schema:
 *           type: number
 *         description: Filtrar por cantidad
 *         example: 10
 *       - in: query
 *         name: hours
 *         schema:
 *           type: number
 *         description: Filtrar por horas
 *         example: 8
 *       - in: query
 *         name: signed
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado de firma
 *         example: true
 *       - in: query
 *         name: workDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar por fecha exacta de trabajo
 *         example: "2026-04-30"
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicial del rango de trabajo
 *         example: "2026-04-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha final del rango de trabajo
 *         example: "2026-04-30"
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
 *           example: -workDate
 *         description: Campo de ordenación. Usa "-" delante para orden descendente.
 *     responses:
 *       200:
 *         description: Lista paginada de albaranes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/PaginatedDeliveryNotesResponse"
 *       400:
 *         description: Query params inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: El usuario no tiene compañía asociada
 *       500:
 *         description: Error interno
 */
router.get("/", validate(deliveryNoteSchema.schemaDeliveryNoteQuery), validateUser, userHasCompany, buildQueryDeliveryNote, deliveryNoteController.getDeliveryNotes);

/**
 * @swagger
 * /api/deliverynote/pdf/{id}:
 *   get:
 *     summary: Obtener PDF del albarán
 *     description: Genera y descarga el PDF del albarán. Si el albarán ya está firmado, redirige al PDF firmado almacenado en Cloudinary.
 *     tags:
 *       - DeliveryNote
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 *         description: ID del albarán
 *         example: 663a10489a21b2d4c84fd789
 *     responses:
 *       200:
 *         description: PDF generado correctamente
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       302:
 *         description: Redirección al PDF firmado en Cloudinary
 *       400:
 *         description: ObjectId inválido
 *       401:
 *         description: No autorizado
 *       403:
 *         description: El usuario no tiene compañía asociada
 *       404:
 *         description: Albarán no encontrado o no pertenece a la compañía
 *       500:
 *         description: Error interno
 */
router.get("/pdf/:id", validate(commonSchema.schemaObjectId), validateUser, userHasCompany, deliveryNoteInCompany, deliveryNoteController.getPDF);

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   get:
 *     summary: Obtener albarán por ID
 *     description: Devuelve un albarán concreto si pertenece a la compañía del usuario autenticado.
 *     tags:
 *       - DeliveryNote
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 *         description: ID del albarán
 *         example: 663a10489a21b2d4c84fd789
 *     responses:
 *       200:
 *         description: Albarán encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deliveryNote:
 *                   $ref: "#/components/schemas/DeliveryNote"
 *       400:
 *         description: ObjectId inválido
 *       401:
 *         description: No autorizado
 *       403:
 *         description: El usuario no tiene compañía asociada
 *       404:
 *         description: Albarán no encontrado o no pertenece a la compañía
 *       500:
 *         description: Error interno
 */
router.get("/:id", validate(commonSchema.schemaObjectId), validateUser, userHasCompany, deliveryNoteInCompany, deliveryNoteController.getDeliveryNote);

/**
 * @swagger
 * /api/deliverynote/{id}/sign:
 *   patch:
 *     summary: Firmar albarán
 *     description: Sube una imagen de firma, marca el albarán como firmado, genera el PDF firmado y lo sube a Cloudinary.
 *     tags:
 *       - DeliveryNote
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 *         description: ID del albarán
 *         example: 663a10489a21b2d4c84fd789
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - signature
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *                 description: Imagen de la firma en formato jpg, png o webp.
 *     responses:
 *       200:
 *         description: Albarán firmado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deliveryNote:
 *                   $ref: "#/components/schemas/DeliveryNote"
 *       400:
 *         description: No se ha enviado archivo, formato inválido u ObjectId inválido
 *       401:
 *         description: No autorizado
 *       403:
 *         description: El usuario no tiene compañía asociada
 *       404:
 *         description: Albarán no encontrado o no pertenece a la compañía
 *       409:
 *         description: El albarán ya está firmado
 *       500:
 *         description: Error interno
 */
router.patch("/:id/sign", validate(commonSchema.schemaObjectId), validateUser, userHasCompany, deliveryNoteInCompany, upload.single("signature"), deliveryNoteController.signPDF);

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   delete:
 *     summary: Eliminar albarán
 *     description: Elimina un albarán de forma lógica o física según el query param soft. No se pueden borrar albaranes firmados.
 *     tags:
 *       - DeliveryNote
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 *         description: ID del albarán
 *         example: 663a10489a21b2d4c84fd789
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
 *         description: Albarán borrado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Albaran borrado
 *                 deliveryNote:
 *                   $ref: "#/components/schemas/DeliveryNote"
 *       400:
 *         description: ObjectId o query param inválido
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No se puede borrar un albarán firmado o el usuario no tiene compañía
 *       404:
 *         description: Albarán no encontrado o no pertenece a la compañía
 *       500:
 *         description: Error interno
 */
router.delete("/:id", validate(commonSchema.schemaObjectId), validate(commonSchema.schemaSoftDelete), validateUser, userHasCompany, deliveryNoteInCompany, deliveryNoteController.deleteDeliveryNote);

export default router;