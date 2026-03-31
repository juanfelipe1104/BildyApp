import { Router } from "express";
import { validateUser} from "../middleware/auth.midddleware.js";
import validate from "../middleware/validate.js";
import * as userSchema from "../validators/user.validator.js";
import * as userController from "../controllers/user.controller.js";
import upload from "../middleware/upload.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = Router();

router.post('/register', validate(userSchema.schemaMailBody), userController.registerUser);
router.put('/validation', validate(userSchema.schemaCodeBody), validateUser, userController.validateEmail);
router.post('/login', validate(userSchema.schemaMailBody), userController.loginUser);
router.put('/register', validate(userSchema.schemaUserBody), validateUser, userController.registerDataUser);
router.patch('/company', validate(userSchema.schemaCompanyBody), validateUser, userController.registerCompany);
router.patch('/logo', validateUser, authorizeRoles("admin"), upload.single("logo"), userController.uploadLogo);
router.get('/', validateUser, userController.getUser);
router.post('/refresh', validate(userSchema.schemaRefreshTokenBody), userController.refreshSession);
router.post('/logout', validateUser, userController.logoutUser);
router.delete('/', validate(userSchema.schemaSoftDelete), validateUser, userController.deleteUser);
router.put('/password', validate(userSchema.schemaPasswordBody), validateUser, userController.changePassword);
router.post('/invite', validate(userSchema.schemaMailBody), validateUser, authorizeRoles("admin"), userController.inviteUser);
export default router;