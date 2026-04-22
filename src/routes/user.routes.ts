import { Router } from "express";
import { validateUser, validateUserStatus } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.js";
import * as commonSchema from "../validators/common.validator.js";
import * as userSchema from "../validators/user.validator.js";
import * as userController from "../controllers/user.controller.js";
import upload from "../middleware/upload.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = Router();

router.post('/register', validate(userSchema.schemaMailBody), userController.registerUser);
router.put('/validation', validate(userSchema.schemaCodeBody), validateUser, validateUserStatus("pending"), userController.validateEmail);
router.post('/login', validate(userSchema.schemaMailBody), userController.loginUser);
router.put('/register', validate(userSchema.schemaUserBody), validateUser, validateUserStatus("verified"), userController.registerDataUser);
router.patch('/company', validate(userSchema.schemaCompanyBody), validateUser, validateUserStatus("verified"), userController.registerCompany);
router.patch('/logo', validateUser, validateUserStatus("verified"), authorizeRoles("admin"), upload.single("logo"), userController.uploadLogo);
router.get('/', validateUser, validateUserStatus("verified"), userController.getUser);
router.post('/refresh', validate(userSchema.schemaRefreshTokenBody), userController.refreshSession);
router.post('/logout', validateUser, validateUserStatus("verified"), userController.logoutUser);
router.delete('/', validate(commonSchema.schemaSoftDelete), validateUser, validateUserStatus("verified"), userController.deleteUser);
router.put('/password', validate(userSchema.schemaPasswordBody), validateUser, validateUserStatus("verified"), userController.changePassword);
router.post('/invite', validate(userSchema.schemaMailBody), validateUser, authorizeRoles("admin"), validateUserStatus("verified"), userController.inviteUser);

export default router;