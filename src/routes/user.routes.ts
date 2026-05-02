import { Router } from "express";
import { userHasCompany, validateUser, validateUserStatus } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.js";
import * as commonSchema from "../validators/common.validator.js";
import * as userSchema from "../validators/user.validator.js";
import * as userController from "../controllers/user.controller.js";
import upload from "../middleware/upload.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Registrar usuario
 *     description: Crea un usuario pendiente de verificación y devuelve tokens de sesión.
 *     tags:
 *       - User
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UserAuthInput"
 *     responses:
 *       201:
 *         description: Usuario creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/AuthResponse"
 *                 - type: object
 *                   properties:
 *                     verificationCode:
 *                       type: string
 *                       example: "123456"
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Ya existe un usuario verificado con ese email
 *       500:
 *         description: Error interno
 */
router.post('/register', validate(userSchema.schemaMailBody), userController.registerUser);

/**
 * @swagger
 * /api/user/validation:
 *   put:
 *     summary: Validar email de usuario
 *     description: Valida el usuario pendiente mediante un código de 6 dígitos.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UserValidationInput"
 *     responses:
 *       200:
 *         description: Usuario verificado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuario verificado
 *                 user:
 *                   $ref: "#/components/schemas/User"
 *       400:
 *         description: Código incorrecto
 *       401:
 *         description: No autorizado
 *       429:
 *         description: Demasiados intentos
 *       500:
 *         description: Error interno
 */
router.put('/validation', validate(userSchema.schemaCodeBody), validateUser, validateUserStatus("pending"), userController.validateEmail);

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Autentica un usuario verificado y devuelve access token y refresh token.
 *     tags:
 *       - User
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UserAuthInput"
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/AuthResponse"
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Credenciales incorrectas o usuario no verificado
 *       500:
 *         description: Error interno
 */
router.post('/login', validate(userSchema.schemaMailBody), userController.loginUser);

/**
 * @swagger
 * /api/user/register:
 *   put:
 *     summary: Completar datos personales del usuario
 *     description: Actualiza nombre, apellidos, NIF y dirección del usuario verificado.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UserDataInput"
 *     responses:
 *       200:
 *         description: Usuario actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuario actualizado
 *                 user:
 *                   $ref: "#/components/schemas/User"
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Usuario no verificado
 *       500:
 *         description: Error interno
 */
router.put('/register', validate(userSchema.schemaUserBody), validateUser, validateUserStatus("verified"), userController.registerDataUser);

/**
 * @swagger
 * /api/user/company:
 *   patch:
 *     summary: Registrar o asociar compañía
 *     description: Crea una compañía nueva o asocia al usuario a una compañía existente por CIF. Si isFreelance es true, la compañía se crea con los datos del usuario.
 *     tags:
 *       - Company
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CompanyInput"
 *     responses:
 *       200:
 *         description: Usuario añadido a una compañía existente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuario añadido a la compañia
 *                 user:
 *                   $ref: "#/components/schemas/User"
 *                 company:
 *                   $ref: "#/components/schemas/Company"
 *       201:
 *         description: Compañía creada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Compañia creada
 *                 user:
 *                   $ref: "#/components/schemas/User"
 *                 company:
 *                   $ref: "#/components/schemas/Company"
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Usuario no verificado
 *       409:
 *         description: El usuario ya pertenece a una compañía
 *       500:
 *         description: Error interno
 */
router.patch('/company', validate(userSchema.schemaCompanyBody), validateUser, validateUserStatus("verified"), userController.registerCompany);

/**
 * @swagger
 * /api/user/logo:
 *   patch:
 *     summary: Subir logo de compañía
 *     description: Sube o actualiza el logo de la compañía del usuario administrador.
 *     tags:
 *       - Company
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - logo
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Imagen del logo en formato jpg, png o webp.
 *     responses:
 *       200:
 *         description: Logo actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logo actualizado
 *                 company:
 *                   $ref: "#/components/schemas/Company"
 *       400:
 *         description: No se ha enviado ningún archivo o formato inválido
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Compañía no encontrada
 *       500:
 *         description: Error interno
 */
router.patch('/logo', validateUser, validateUserStatus("verified"), authorizeRoles("admin"), userHasCompany, upload.single("logo"), userController.uploadLogo);

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Obtener usuario autenticado
 *     description: Devuelve los datos del usuario autenticado, incluyendo la compañía poblada.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuario autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: "#/components/schemas/User"
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Usuario no verificado
 *       500:
 *         description: Error interno
 */
router.get('/', validateUser, validateUserStatus("verified"), userController.getUser);

/**
 * @swagger
 * /api/user/refresh:
 *   post:
 *     summary: Refrescar sesión
 *     description: Revoca el refresh token actual y genera un nuevo access token y refresh token.
 *     tags:
 *       - User
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/RefreshTokenInput"
 *     responses:
 *       200:
 *         description: Nuevo access token generado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Nuevo access token generado
 *                 access_token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refresh_token:
 *                   type: string
 *                   example: b3f7d99f-52f1-4a44-bc14-token
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Refresh token inválido o expirado
 *       500:
 *         description: Error interno
 */
router.post('/refresh', validate(userSchema.schemaRefreshTokenBody), userController.refreshSession);

/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     summary: Cerrar sesión
 *     description: Revoca todos los refresh tokens activos del usuario autenticado.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout correcto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logout de todas las sesiones activas
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Usuario no verificado
 *       500:
 *         description: Error interno
 */
router.post('/logout', validateUser, validateUserStatus("verified"), userController.logoutUser);

/**
 * @swagger
 * /api/user:
 *   delete:
 *     summary: Eliminar usuario autenticado
 *     description: Elimina el usuario autenticado. Puede ser borrado lógico o físico según el query param soft.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: soft
 *         required: true
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *           example: "true"
 *         description: Si es true, hace soft delete. Si es false, hace hard delete.
 *     responses:
 *       200:
 *         description: Usuario borrado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuario borrado
 *                 user:
 *                   $ref: "#/components/schemas/User"
 *       400:
 *         description: Query param inválido
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Usuario no verificado
 *       500:
 *         description: Error interno
 */
router.delete('/', validate(commonSchema.schemaSoftDelete), validateUser, validateUserStatus("verified"), userController.deleteUser);

/**
 * @swagger
 * /api/user/password:
 *   put:
 *     summary: Cambiar contraseña
 *     description: Cambia la contraseña del usuario autenticado.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/PasswordChangeInput"
 *     responses:
 *       200:
 *         description: Contraseña cambiada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cambio de contraseña exitoso
 *                 user:
 *                   $ref: "#/components/schemas/User"
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Contraseña incorrecta o no autorizado
 *       403:
 *         description: Usuario no verificado
 *       500:
 *         description: Error interno
 */
router.put('/password', validate(userSchema.schemaPasswordBody), validateUser, validateUserStatus("verified"), userController.changePassword);

/**
 * @swagger
 * /api/user/invite:
 *   post:
 *     summary: Invitar usuario a la compañía
 *     description: Crea un usuario invitado con rol guest asociado a la compañía del administrador autenticado.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UserAuthInput"
 *     responses:
 *       201:
 *         description: Usuario invitado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/AuthResponse"
 *                 - type: object
 *                   properties:
 *                     verificationCode:
 *                       type: string
 *                       example: "123456"
 *       400:
 *         description: El usuario administrador no tiene compañía asociada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Solo administradores
 *       409:
 *         description: Ya existe el usuario
 *       500:
 *         description: Error interno
 */
router.post('/invite', validate(userSchema.schemaMailBody), validateUser, authorizeRoles("admin"), validateUserStatus("verified"), userHasCompany, userController.inviteUser);

export default router;