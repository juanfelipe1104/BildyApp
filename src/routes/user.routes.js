import { Router } from "express";
import { validateUser } from "../middleware/auth.midddleware.js";
import validate from "../middleware/validate.js";
import { schemaUserBody, schemaCodeBody } from "../validators/user.validator.js";
import * as userController from "../controllers/user.controller.js";

const router = Router();

router.post('/register', validate(schemaUserBody), userController.registerUser);
router.put('/validation', validateUser, validate(schemaCodeBody), userController.validateEmail);
router.get('/', validateUser, userController.getUser);

export default router;