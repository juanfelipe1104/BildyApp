import { Router } from "express";
import { validateUser, validateCompany} from "../middleware/auth.midddleware.js";
import validate from "../middleware/validate.js";
import * as userSchema from "../validators/user.validator.js";
import * as userController from "../controllers/user.controller.js";

const router = Router();

router.post('/register', validate(userSchema.schemaMailBody), userController.registerUser);
router.put('/validation', validate(userSchema.schemaCodeBody), validateUser, userController.validateEmail);
router.post('/login', validate(userSchema.schemaMailBody), validateUser, userController.loginUser);
router.put('/register', validate(userSchema.schemaUserBody), validateUser, userController.registerDataUser);
router.patch('/company', validate(userSchema.schemaCompanyBody), validateUser, userController.registerCompany)
router.get('/', validateUser, userController.getUser);
router.delete('/', validate(userSchema.schemaSoftDelete), validateUser, userController.deleteUser);

export default router;