import { Router } from "express";
import { validateUser } from "../middleware/auth.midddleware.js";
import validate from "../middleware/validate.js";
import * as userSchema from "../validators/user.validator.js";
import * as userController from "../controllers/user.controller.js";

const router = Router();

router.post('/register', validate(userSchema.schemaUserBody), userController.registerUser);
router.put('/validation', validate(userSchema.schemaCodeBody), validateUser, userController.validateEmail);
router.post('/login', validate(userSchema.schemaLoginBody), validateUser, userController.loginUser);
router.get('/', validateUser, userController.getUser);

export default router;